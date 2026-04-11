import { useState, useEffect, useRef } from 'react';
import {
  Server, ArrowLeft, Pin, Trash2, Search, X,
  Clock, Zap, CheckCircle2, AlertCircle, Eye,
} from 'lucide-react';
import MolecularViewer from './MolecularViewer';
import AIReport from './AIReport';
import DrugScoreCard from './DrugScoreCard';
import ProteinStatsCard from './ProteinStatsCard';
import { getJobOutputs, getJobAccounting } from '../services/api';
import DownloadPanel from './DownloadPanel';
import PAEHeatmap from './PAEHeatmap';
import SequenceOptimizer from './SequenceOptimizer';

/* ─── Keyframes globales (inyectados una vez) ─────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes fadeIn      { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes pulse-ring  {
    0%   { box-shadow: 0 0 0 0   rgba(59,130,246,.65); }
    70%  { box-shadow: 0 0 0 7px rgba(59,130,246,0);   }
    100% { box-shadow: 0 0 0 0   rgba(59,130,246,0);   }
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('camelia-css')) {
  const s = document.createElement('style');
  s.id = 'camelia-css';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

/* ─── Mapa de estados ─────────────────────────────────────────────────────── */
const JOB_STATUS = {
  PENDING: { label: 'En Cola', color: '#f97316', bg: 'rgba(249,115,22,.12)', border: 'rgba(249,115,22,.3)', Icon: Clock, pulse: false },
  RUNNING: { label: 'Ejecutando', color: '#3b82f6', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.3)', Icon: Zap, pulse: true },
  COMPLETED: { label: 'Completado', color: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', Icon: CheckCircle2, pulse: false },
  FAILED: { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', Icon: AlertCircle, pulse: false },
};

function StatusBadge({ status }) {
  const c = JOB_STATUS[status] || JOB_STATUS.PENDING;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: '20px', padding: '0.2rem 0.65rem',
      fontSize: '0.72rem', fontWeight: 600,
      animation: c.pulse ? 'pulse-ring 1.6s ease-out infinite' : 'none',
    }}>
      <c.Icon size={11} /> {c.label}
    </span>
  );
}

/* ─── Fila del monitor de cola ────────────────────────────────────────────── */
function JobRow({ job, isActive, onView }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: isActive ? 'rgba(59,130,246,.07)' : 'rgba(255,255,255,.025)',
      border: isActive ? '1px solid rgba(59,130,246,.22)' : '1px solid rgba(255,255,255,.05)',
      padding: '0.55rem 0.75rem', borderRadius: '8px', transition: 'background 0.2s',
    }}>
      <div>
        <div style={{ fontSize: '0.73rem', color: '#e2e8f0', fontWeight: 600 }}>{job.protein}</div>
        <div style={{ fontSize: '0.61rem', color: '#6b7280', fontFamily: 'monospace', marginTop: '0.1rem' }}>{job.id}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <StatusBadge status={job.status} />
        {/* Botón "Ver" habilitado sólo en COMPLETED */}
        {job.status === 'COMPLETED' && onView && (
          <button
            onClick={() => onView(job.id)}
            style={{
              background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.35)',
              color: '#10b981', borderRadius: '6px', padding: '0.22rem 0.5rem',
              cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,.15)'}
          >
            <Eye size={11} /> Ver
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Sidebar integrada dentro del contenedor del visor ──────────────────── */
function ViewerSidebar({ highlightResidue, setHighlightResidue, savedAnnotations, setSavedAnnotations }) {
  const [annotationText, setAnnotationText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const n = parseInt(searchInput.trim(), 10);
    if (!isNaN(n) && n > 0) { setHighlightResidue(String(n)); setActiveSearch(n); }
  };

  const clearSearch = () => { setSearchInput(''); setActiveSearch(null); setHighlightResidue(''); };

  const handleAnchorNote = () => {
    const resi = parseInt(highlightResidue, 10);
    if (!resi || !annotationText.trim()) return;
    setSavedAnnotations(prev => [...prev, { id: Date.now(), residue: resi, text: annotationText.trim() }]);
    setAnnotationText('');
  };

  const LABEL = {
    fontSize: '0.6rem', fontWeight: 700, color: '#4b5563',
    textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.4rem',
  };

  return (
    /* pointer-events:none en el wrapper — sólo los controles lo reactivan,
       dejando el centro del visor completamente libre para la interacción 3D */
    <div style={{
      position: 'absolute', top: 0, left: 0, bottom: 0,
      width: '230px', zIndex: 20,
      display: 'flex', flexDirection: 'column', gap: '0.8rem',
      padding: '0.9rem 0.8rem',
      background: 'linear-gradient(to right, rgba(8,8,18,.97) 74%, transparent)',
      backdropFilter: 'blur(3px)',
      pointerEvents: 'none',
      overflowY: 'auto',
    }}>

      {/* ── SECCIÓN 1: Buscador ─────────────────────────────────────────── */}
      <div style={{ pointerEvents: 'auto' }}>
        <div style={LABEL}>🔍 Buscar Residuo</div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.35rem' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,.04)',
            border: `1px solid ${activeSearch ? '#e879f9' : 'rgba(255,255,255,.1)'}`,
            borderRadius: '7px', overflow: 'hidden', transition: 'border-color 0.2s',
            boxShadow: activeSearch ? '0 0 8px rgba(232,121,249,.2)' : 'none',
          }}>
            <Search size={11} color={activeSearch ? '#e879f9' : '#6b7280'} style={{ margin: '0 0.35rem' }} />
            <input
              type="number" min="1" placeholder="Nº residuo…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.77rem', width: '100%', padding: '0.38rem 0' }}
            />
            {activeSearch && (
              <button type="button" onClick={clearSearch}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 0.4rem', display: 'flex', alignItems: 'center' }}>
                <X size={10} />
              </button>
            )}
          </div>
          <button type="submit" style={{
            background: 'rgba(124,58,237,.75)', border: '1px solid rgba(124,58,237,.4)',
            color: 'white', borderRadius: '7px', padding: '0 0.6rem',
            cursor: 'pointer', fontSize: '0.71rem', fontWeight: 600,
          }}>Ir</button>
        </form>
        {activeSearch && (
          <div style={{
            marginTop: '0.35rem', background: 'rgba(124,58,237,.15)',
            border: '1px solid rgba(232,121,249,.25)', borderRadius: '6px',
            padding: '0.28rem 0.55rem', fontSize: '0.68rem', color: '#f5d0fe',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e879f9', display: 'inline-block' }} />
            Residuo {activeSearch} seleccionado
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.055)', pointerEvents: 'none' }} />

      {/* ── SECCIÓN 2: Formulario de nota ──────────────────────────────── */}
      <div style={{ pointerEvents: 'auto' }}>
        <div style={LABEL}>📌 Anclar Anotación</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.38rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.64rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Residuo:</span>
            <input
              type="number" value={highlightResidue} placeholder="Nº"
              onChange={e => setHighlightResidue(e.target.value)}
              style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
                color: 'white', width: '62px', borderRadius: '5px',
                padding: '3px 7px', fontSize: '0.77rem', outline: 'none',
              }}
            />
          </div>
          <textarea
            placeholder="Nota del investigador… (Enter = guardar)"
            value={annotationText}
            onChange={e => setAnnotationText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnchorNote(); } }}
            rows={2}
            style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)',
              color: 'white', borderRadius: '6px', padding: '6px 8px',
              fontSize: '0.74rem', resize: 'none', outline: 'none',
              lineHeight: 1.45, fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleAnchorNote}
            disabled={!highlightResidue || !annotationText.trim()}
            style={{
              background: (!highlightResidue || !annotationText.trim())
                ? 'rgba(16,185,129,.2)' : '#10b981',
              color: 'white', border: 'none', padding: '0.42rem',
              borderRadius: '7px',
              cursor: (!highlightResidue || !annotationText.trim()) ? 'not-allowed' : 'pointer',
              fontSize: '0.72rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              transition: 'background 0.2s',
            }}
          >
            <Pin size={11} /> Anclar Post-it
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 3: Lista de anotaciones ────────────────────────────── */}
      {savedAnnotations.length > 0 && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,.055)', pointerEvents: 'none' }} />
          <div style={{ pointerEvents: 'auto' }}>
            <div style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Pin size={9} /> {savedAnnotations.length} Anotación{savedAnnotations.length !== 1 ? 'es' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '150px', overflowY: 'auto' }}>
              {savedAnnotations.map(note => (
                <div key={note.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)',
                  padding: '5px 7px', borderRadius: '6px', fontSize: '0.69rem',
                }}>
                  <span style={{ color: '#94a3b8', flex: 1, lineHeight: 1.4 }}>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>#{note.residue}</span> {note.text}
                  </span>
                  <Trash2
                    size={10}
                    onClick={() => setSavedAnnotations(prev => prev.filter(n => n.id !== note.id))}
                    style={{ color: '#f87171', cursor: 'pointer', flexShrink: 0, marginLeft: '0.4rem', marginTop: '2px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Dashboard principal ──────────────────────────────────────────────────── */
export default function Dashboard({ jobId, onNewSearch }) {
  const [data, setData] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [accounting, setAccounting] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobStatus, setJobStatus] = useState('RUNNING');

  const [highlightResidue, setHighlightResidue] = useState('');
  const [savedAnnotations, setSavedAnnotations] = useState([]);
  const [viewerSnapshot, setViewerSnapshot] = useState(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null); setJobStatus('RUNNING');
      try {
        const [out, acc] = await Promise.all([getJobOutputs(jobId), getJobAccounting(jobId)]);
        if (!out) throw new Error('No se pudieron recuperar los datos.');
        const pdbId = out.protein_metadata?.pdb_id;
        setIsSynthetic(!pdbId || pdbId.trim() === '');
        setData(out);
        setAccounting(acc?.accounting || null);
        setJobStatus('COMPLETED');

        const seq = out.protein_metadata?.sequence || '';
        setAiStats({
          peso_molecular_kda: (seq.length * 0.11 || 24.5).toFixed(1),
          punto_isoelectrico: 6.2,
          longitud_aminoacidos: seq.length || 215,
          grand_average_hydropathicity: out.biological_data?.solubility_score > 50 ? '-0.42' : '0.15',
          localizacion_subcelular_probable: seq.length > 400 ? 'Membrana' : 'Citoplasma',
          funcion_molecular_probable: 'Actividad Enzimática',
        });
      } catch {
        setError('Error de conexión con el clúster CESGA.');
        setJobStatus('FAILED');
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '10rem', color: '#9ca3af', background: '#080812', minHeight: '100vh' }}>
      <div style={{ width: 40, height: 40, margin: '0 auto 1.5rem', border: '3px solid rgba(255,255,255,.07)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <p style={{ fontSize: '0.9rem' }}>Sincronizando con FinisTerrae III…</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#f87171', background: '#080812', minHeight: '100vh' }}>
      <h2>⚠️ {error}</h2>
      <button onClick={onNewSearch} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Volver
      </button>
    </div>
  );

  const { structural_data, biological_data, protein_metadata } = data;
  const plddt = structural_data?.confidence?.plddt_mean || 0;

  const jobQueue = [
    { id: jobId, status: jobStatus, protein: protein_metadata?.protein_name || 'Proteína' },
    { id: 'CAMELIA-0042', status: 'RUNNING', protein: 'HSP90α' },
    { id: 'CAMELIA-0041', status: 'COMPLETED', protein: 'BRCA2-DBD' },
    { id: 'CAMELIA-0040', status: 'PENDING', protein: 'KRAS-G12C' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white', minHeight: '100vh', animation: 'fadeIn 0.4s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
            Resultados: <span style={{ color: '#60a5fa' }}>{protein_metadata?.protein_name || 'Proteína'}</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.83rem', margin: 0, fontFamily: 'monospace' }}>{jobId}</p>
            <StatusBadge status={jobStatus} />
          </div>
        </div>
        <button onClick={onNewSearch} style={{
          background: 'rgba(55,65,81,.75)', color: 'white', border: '1px solid rgba(255,255,255,.08)',
          padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(8px)', fontSize: '0.88rem',
        }}>
          <ArrowLeft size={15} /> Nueva Búsqueda
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Visor + sidebar sin colisiones */}
          <div style={{ background: '#0a0a16', borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', height: '560px', position: 'relative', overflow: 'hidden' }}>
            <ViewerSidebar
              highlightResidue={highlightResidue}
              setHighlightResidue={setHighlightResidue}
              savedAnnotations={savedAnnotations}
              setSavedAnnotations={setSavedAnnotations}
            />
            <MolecularViewer
              ref={viewerRef}
              modelData={isSynthetic ? null : (structural_data?.pdb_file || null)}
              useFallback={isSynthetic}
              format={structural_data?.cif_file ? 'cif' : 'pdb'}
              plddtPerResidue={structural_data?.confidence?.plddt_per_residue}
              highlightResidue={highlightResidue}
              savedAnnotations={savedAnnotations}
            />
          </div>
          {isSynthetic && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.9rem',
              background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)',
              borderRadius: '12px', padding: '0.9rem 1.2rem',
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚗️</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>
                  Proteína fuera del catálogo — Datos algorítmicos
                </div>
                <div style={{ fontSize: '0.76rem', color: '#92400e', lineHeight: 1.6 }}>
                  Esta secuencia no está entre las 22 proteínas del catálogo CESGA. La estructura 3D mostrada es una proteína de referencia real (RCSB), no la predicción de tu secuencia. Los datos biológicos son estimaciones computacionales, no medidas experimentales.
                </div>
              </div>
            </div>
          )}

          {/* ← jobId es crucial: decide lógica CESGA vs. inferencia IA */}
          <PAEHeatmap
            paeMatrix={structural_data?.confidence?.pae_matrix}
            meanPae={structural_data?.confidence?.mean_pae}
          />
           /* Dashboard.jsx corregido */
          <AIReport
            data={data}
            savedAnnotations={savedAnnotations}
            jobId={jobId}
            viewerRef={viewerRef}
          />
          <SequenceOptimizer sequence={protein_metadata?.sequence || ''} />
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          <DownloadPanel data={data} jobId={jobId} accounting={accounting} />

          <div style={{ background: 'rgba(25,30,48,.85)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 0.7rem', fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Confianza pLDDT</h3>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: plddt > 70 ? '#10b981' : '#f59e0b', lineHeight: 1 }}>
              {plddt.toFixed(1)}%
            </div>
          </div>

          <DrugScoreCard biologicalData={biological_data} />
          <ProteinStatsCard aiData={aiStats} />

          {/* Monitor de cola con estados reactivos */}
          <div style={{ padding: '1.2rem', borderRadius: '14px', background: 'rgba(10,14,28,.88)', border: '1px solid rgba(59,130,246,.18)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.7rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={13} /> Monitor CESGA — FinisTerrae III
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {jobQueue.map(job => (
                <JobRow
                  key={job.id}
                  job={job}
                  isActive={job.id === jobId}
                  onView={job.id !== jobId ? (id) => console.info('Navegar a job:', id) : undefined}
                />
              ))}
            </div>
            {accounting && (
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,.055)', fontSize: '0.77rem', color: '#94a3b8' }}>
                GPU consumidas: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{accounting.gpu_hours?.toFixed(2)}h</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}