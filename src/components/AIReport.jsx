import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Loader, RefreshCw, Activity, Droplets, ShieldAlert, Zap } from 'lucide-react';
import { generateBiologyReport } from '../services/aiService';

export default function AIReport({ data }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    if (!data) return;
    setLoading(true);
    setError(null);
    try {
      const text = await generateBiologyReport(data);
      setReport(text);
    } catch (err) {
      setError(err.message || 'Error al generar el análisis de IA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [data]);

  if (!data) return null;

  // --- LÓGICA DE INDICADORES RÁPIDOS ---
  const plddt = data.structural_data?.confidence?.plddt_mean || 0;
  const sol = data.biological_data?.solubility_score || 0;
  const insta = data.biological_data?.instability_index || 0;

  const getStatus = (val, type) => {
    if (type === 'plddt') return val > 80 ? { label: 'Excelente', col: '#10b981' } : val > 60 ? { label: 'Bueno', col: '#3b82f6' } : { label: 'Bajo', col: '#f59e0b' };
    if (type === 'sol') return val > 50 ? { label: 'Soluble', col: '#10b981' } : { label: 'Insoluble', col: '#ef4444' };
    if (type === 'insta') return val < 40 ? { label: 'Estable', col: '#10b981' } : { label: 'Inestable', col: '#ef4444' };
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'rgba(20, 21, 30, 0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
      
      {/* CABECERA CON BOTÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#fbbf24" fill="#fbbf24" /> Traductor de Biología (IA)
        </h3>
        {!loading && (
          <button onClick={fetchReport} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={12} /> Regenerar
          </button>
        )}
      </div>

      {/* --- INDICADORES RÁPIDOS (LO QUE FALTABA) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <QuickPill icon={<Activity size={14}/>} label="Confianza" value={getStatus(plddt, 'plddt').label} color={getStatus(plddt, 'plddt').col} />
        <QuickPill icon={<Droplets size={14}/>} label="Solubilidad" value={getStatus(sol, 'sol').label} color={getStatus(sol, 'sol').col} />
        <QuickPill icon={<ShieldAlert size={14}/>} label="Estabilidad" value={getStatus(insta, 'insta').label} color={getStatus(insta, 'insta').col} />
      </div>

      {/* TEXTO DE LA IA */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#6b7280', fontSize: '0.9rem' }}>
            <Loader className="animate-spin" size={16} /> Analizando secuencia con Nemotron-3...
          </div>
        ) : error ? (
          <div style={{ color: '#f87171', fontSize: '0.9rem' }}>⚠️ {error}</div>
        ) : (
          <p style={{ margin: 0, color: '#d1d5db', lineHeight: '1.7', fontSize: '0.95rem' }}>
            {report}
          </p>
        )}
      </div>
    </div>
  );
}

// Sub-componente para las pastillas
function QuickPill({ icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
        {icon} {label}
      </div>
      <div style={{ color: color, fontWeight: 'bold', fontSize: '0.9rem' }}>{value}</div>
    </div>
  );
}