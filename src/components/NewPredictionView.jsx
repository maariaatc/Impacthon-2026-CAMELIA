import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProteinSamples } from '../services/api';
import { Play, Loader2, CheckCircle, Clock, AlertTriangle, Cpu, Microchip, Server, ShieldCheck } from 'lucide-react';

// IMPORTAMOS NUESTRA LÓGICA DE NOTIFICACIONES Y POLLING
import { useJobStatus } from '../hooks/useJobStatus';
import { requestNotificationPermission, sendJobCompletedNotification } from '../services/browserNotifications';
import Toast from './Toast';

// ─── ESQUEMA DE VALIDACIÓN "PRE-VUELO" (ZOD) ──────────────────────────────
const preflightSchema = z.object({
  fasta: z.string()
    .min(1, "La secuencia no puede estar vacía.")
    .refine((val) => val.trim().startsWith(">"), {
      message: "Formato inválido: Debe empezar por '>' (Cabecera FASTA).",
    })
    .refine((val) => {
      const lines = val.trim().split('\n');
      if (lines.length < 2) return false;
      const sequence = lines.slice(1).join('').replace(/\s/g, '');
      return sequence.length > 0;
    }, {
      message: "Falta la secuencia de aminoácidos debajo de la cabecera.",
    })
    .refine((val) => {
      const lines = val.trim().split('\n');
      if (lines.length < 2) return true; 
      const sequence = lines.slice(1).join('').replace(/\s/g, '').toUpperCase();
      const validChars = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
      return validChars.test(sequence);
    }, {
      message: "Secuencia inválida: Solo permitidos aminoácidos válidos (ACDEFGHIKLMNPQRSTVWY).",
    })
    .refine((val) => {
      const lines = val.trim().split('\n');
      if (lines.length < 2) return true;
      const sequence = lines.slice(1).join('').replace(/\s/g, '');
      return sequence.length >= 10 && sequence.length <= 2000;
    }, {
      message: "La longitud debe estar entre 10 y 2000 aminoácidos (límite CESGA).",
    }),
  gpus: z.number({ invalid_type_error: "Requerido" }).min(0, "Mín 0").max(4, "Máx 4 GPUs"),
  cpus: z.number({ invalid_type_error: "Requerido" }).min(1, "Mín 1").max(64, "Máx 64 CPUs"),
  ram: z.number({ invalid_type_error: "Requerido" }).min(4, "Mín 4").max(256, "Máx 256 GB"),
});

export default function NewPredictionView({ onSubmitJob, activeJobId, onJobCompleted }) {
  const [samples, setSamples] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // ─── MAGIA DE POLLING: LLAMAMOS A NUESTRO HOOK ───
  const { status, jobData, error: pollingError } = useJobStatus(activeJobId);

  // ─── CONTROL DE NOTIFICACIONES ───
  useEffect(() => {
    if (status === 'COMPLETED' && activeJobId) {
      sendJobCompletedNotification(activeJobId); // Notificación de sistema
      setShowToast(true); // Mostramos el toast por si acaso
      
      // AUTO-REDIRECCIÓN: Después de 1.5 segundos de ver el "Check" verde,
      // saltamos automáticamente a los resultados.
      const timer = setTimeout(() => {
        onJobCompleted(activeJobId);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [status, activeJobId, onJobCompleted]);

  const handleViewResults = () => {
    setShowToast(false);
    if (onJobCompleted) onJobCompleted(activeJobId);
  };

  // ─── CONFIGURACIÓN DEL FORMULARIO ───
  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(preflightSchema),
    mode: "onChange",
    defaultValues: { fasta: '', gpus: 1, cpus: 8, ram: 32 }
  });

  const fastaValue = watch("fasta");
  const isFastaStarted = fastaValue?.trim().length > 0;
  const isFastaValid = isFastaStarted && !errors.fasta;

  useEffect(() => {
    const loadSamples = async () => {
      try {
        const data = await getProteinSamples();
        setSamples(data);
      } catch (err) {
        console.error('Failed to load samples', err);
      }
    };
    loadSamples();
  }, []);

  const handleSampleSelect = (sample) => {
    setValue('fasta', sample.fasta, { shouldValidate: true, shouldDirty: true });
    setApiError(null);
  };

  const onSubmit = async (data) => {
    setApiError(null);
    await requestNotificationPermission(); 
    onSubmitJob(data); 
  };

  // ─── CONFIGURACIÓN VISUAL DEL PANEL DE ESTADO ───
  const stateConfig = {
    IDLE: { color: 'var(--text-muted)', label: 'Esperando Secuencia', icon: Clock, bg: 'transparent', spin: false },
    PENDING: { color: 'var(--accent-orange)', label: 'En Cola (PENDING)', icon: Loader2, bg: 'rgba(249, 115, 22, 0.1)', spin: true },
    RUNNING: { color: 'var(--accent-blue)', label: 'Procesando (RUNNING)', icon: Loader2, bg: 'rgba(59, 130, 246, 0.1)', spin: true },
    COMPLETED: { color: 'var(--accent-green)', label: 'Completado', icon: CheckCircle, bg: 'rgba(16, 185, 129, 0.1)', spin: false },
    FAILED: { color: 'var(--accent-red)', label: 'Error', icon: AlertTriangle, bg: 'rgba(239, 68, 68, 0.1)', spin: false }
  };

  const currentStatus = (pollingError || status === 'FAILED') ? 'FAILED' : (activeJobId ? status : 'IDLE');
  const config = stateConfig[currentStatus] || stateConfig.IDLE;
  const Icon = config.icon;

  return (
    <>
      {/* EL TOAST FLOTANTE (Oculto hasta que termina el job) */}
      <Toast 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        onAction={handleViewResults} 
      />

      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* ─── ZONA IZQUIERDA: FORMULARIO PRE-VUELO ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.4rem' }}>Editor de Secuencias</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Carga un ejemplo o escribe tu secuencia FASTA. El sistema validará los requisitos antes de enviar.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                <ShieldCheck size={16} /> Pre-vuelo Activo
              </div>
            </div>

            {samples.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {samples.map((sample, idx) => (
                  <button 
                    key={idx} type="button" className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    onClick={() => handleSampleSelect(sample)}
                    disabled={currentStatus !== 'IDLE'}
                  >
                    {sample.protein_name || sample.protein_id}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div style={{
                 background: '#0d0d12', borderRadius: 'var(--border-radius-sm)', 
                 border: '1px solid',
                 borderColor: !isFastaStarted ? 'var(--surface-border)' : (isFastaValid ? 'var(--accent-green)' : 'var(--accent-red)'),
                 overflow: 'hidden', transition: 'border-color 0.3s'
              }}>
                <div style={{ background: '#1c1c24', padding: '0.4rem 1rem', fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <div style={{width: 10, height: 10, borderRadius: '50%', background: '#ef4444'}}></div>
                   <div style={{width: 10, height: 10, borderRadius: '50%', background: '#eab308'}}></div>
                   <div style={{width: 10, height: 10, borderRadius: '50%', background: '#22c55e'}}></div>
                   <span style={{marginLeft: '0.5rem'}}>FASTA Editor</span>
                </div>
                <textarea
                  {...register("fasta")}
                  rows="8"
                  placeholder=">Mi_Secuencia_01&#10;MEEPQSDPSVEPPLSQETFS..."
                  style={{ 
                    width: '100%', background: 'transparent', 
                    color: !isFastaStarted || isFastaValid ? 'var(--text-primary)' : '#fca5a5', 
                    border: 'none', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem',
                    resize: 'vertical', outline: 'none', lineHeight: '1.5'
                  }}
                  disabled={currentStatus !== 'IDLE'}
                ></textarea>
              </div>
              {errors.fasta && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '-0.8rem' }}>
                  <AlertTriangle size={14} /> {errors.fasta.message}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <Microchip size={14} /> GPUs
                  </label>
                  <input type="number" {...register("gpus", { valueAsNumber: true })} disabled={currentStatus !== 'IDLE'} className="input-field" style={{ padding: '0.5rem', fontSize: '0.9rem', borderColor: errors.gpus ? 'var(--accent-red)' : '' }} />
                  {errors.gpus && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.gpus.message}</span>}
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <Cpu size={14} /> CPUs
                  </label>
                  <input type="number" {...register("cpus", { valueAsNumber: true })} disabled={currentStatus !== 'IDLE'} className="input-field" style={{ padding: '0.5rem', fontSize: '0.9rem', borderColor: errors.cpus ? 'var(--accent-red)' : '' }} />
                  {errors.cpus && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.cpus.message}</span>}
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    <Server size={14} /> RAM (GB)
                  </label>
                  <input type="number" {...register("ram", { valueAsNumber: true })} disabled={currentStatus !== 'IDLE'} className="input-field" style={{ padding: '0.5rem', fontSize: '0.9rem', borderColor: errors.ram ? 'var(--accent-red)' : '' }} />
                  {errors.ram && <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem' }}>{errors.ram.message}</span>}
                </div>
              </div>

              {apiError && (
                <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={14} /> {apiError}
                </div>
              )}

              <button 
                 type="submit" 
                 className="btn btn-primary" 
                 disabled={currentStatus !== 'IDLE' || !isValid}
                 style={{ 
                   alignSelf: 'flex-start', 
                   opacity: (currentStatus !== 'IDLE' || !isValid) ? 0.5 : 1,
                   display: 'flex', alignItems: 'center', gap: '0.6rem',
                   cursor: (currentStatus !== 'IDLE' || !isValid) ? 'not-allowed' : 'pointer'
                 }}
              >
                <Play size={18} fill="currentColor" />
                Validar y Enviar al CESGA
              </button>
            </form>
          </div>
        </div>

        {/* ─── ZONA DERECHA: PANEL DE ESTADO Y TERMINAL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
               Estado de Ejecución
             </h3>

             <div style={{ 
               display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', 
               flex: 1, background: config.bg, borderRadius: 'var(--border-radius-md)',
               border: `1px dashed ${config.color}`, padding: '2rem 1rem', color: config.color,
               transition: 'all 0.5s ease'
             }}>
                
                <div style={config.spin ? { animation: 'spin 2s linear infinite' } : {}}>
                  <Icon size={42} />
                </div>
                
                <span style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.5px', textAlign: 'center' }}>
                  {config.label}
                </span>
                
                {activeJobId && (
                  <span style={{ fontSize: '0.8rem', opacity: 0.8, fontFamily: 'monospace' }}>
                    {activeJobId}
                  </span>
                )}
                
                {pollingError && (
                  <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', textAlign: 'center' }}>
                    {pollingError}
                  </span>
                )}

                {/* ─── LA CAJA NEGRA (TERMINAL DE LOGS) ─── */}
                {activeJobId && (
                  <div style={{
                    marginTop: '1.5rem', width: '100%', background: '#09090b', 
                    borderRadius: '8px', padding: '1rem', fontFamily: 'monospace', 
                    fontSize: '0.75rem', color: '#4ade80', textAlign: 'left',
                    border: '1px solid var(--surface-border)', minHeight: '120px',
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }} />
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ color: '#6b7280', fontSize: '0.65rem', marginLeft: '6px' }}>cesga-node.log</span>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '150px' }}>
                      {!jobData?.logs && currentStatus === 'PENDING' && (
                        <span style={{ color: '#6b7280' }}>[sys] Esperando asignación de recursos en CESGA...</span>
                      )}
                      {jobData?.logs && (
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {jobData.logs}
                        </pre>
                      )}
                      {currentStatus === 'RUNNING' && (
                        <div style={{ marginTop: '5px', opacity: 0.7 }}>_</div>
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

      </div>
    </>
  );
}