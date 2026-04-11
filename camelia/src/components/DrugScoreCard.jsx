import React from 'react';
import { Beaker, ShieldCheck, AlertTriangle, Info, Zap, ThermometerSnowflake } from 'lucide-react';

export default function DrugScoreCard({ biologicalData }) {
  if (!biologicalData) return null;

  const { solubility_score: sol, instability_index: insta } = biologicalData;

  // ─── LÓGICA DE CLASIFICACIÓN ───
  const getSolubilityInfo = (val) => {
    if (val >= 50) return { label: 'Alta Solubilidad', color: '#10b981', desc: 'Fácil de manejar en soluciones acuosas.' };
    if (val >= 30) return { label: 'Solubilidad Media', color: '#f59e0b', desc: 'Puede requerir aditivos o optimización de pH.' };
    return { label: 'Baja Solubilidad', color: '#ef4444', desc: 'Alta tendencia a la agregación y precipitación.' };
  };

  const getStabilityInfo = (val) => {
    if (val < 40) return { label: 'Estructura Estable', color: '#10b981', desc: 'Vida media prolongada in vitro.' };
    return { label: 'Estructura Inestable', color: '#ef4444', desc: 'Propensa a la degradación proteolítica.' };
  };

  const getFinalVerdict = (s, i) => {
    if (s >= 50 && i < 40) return { label: 'Candidata Prometedora', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (s < 30 || i >= 60) return { label: 'No Recomendada', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    return { label: 'Requiere Optimización', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  };

  const solInfo = getSolubilityInfo(sol);
  const staInfo = getStabilityInfo(insta);
  const verdict = getFinalVerdict(sol, insta);

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '1rem',
    flex: 1
  };

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Beaker size={20} color="var(--accent-blue)" />
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Potencial Farmacéutico (Druggability)</h3>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Card Solubilidad */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <Zap size={16} color={solInfo.color} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SOLUBILIDAD</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: solInfo.color }}>{sol.toFixed(1)}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>{solInfo.label}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>{solInfo.desc}</p>
        </div>

        {/* Card Estabilidad */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <ThermometerSnowflake size={16} color={staInfo.color} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ESTABILIDAD</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: staInfo.color }}>{insta.toFixed(1)}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>{staInfo.label}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>{staInfo.desc}</p>
        </div>
      </div>

      {/* Badge Final de Veredicto */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        padding: '1rem', borderRadius: '12px', background: verdict.bg,
        border: `1px solid ${verdict.color}40`, marginTop: '0.5rem'
      }}>
        {verdict.label === 'Candidata Prometedora' ? <ShieldCheck color={verdict.color} /> : <AlertTriangle color={verdict.color} />}
        <span style={{ fontWeight: 'bold', color: verdict.color, letterSpacing: '0.5px' }}>
          VERDICTO: {verdict.label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}