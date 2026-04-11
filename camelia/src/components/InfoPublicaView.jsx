import { Shield, Microscope, Database } from 'lucide-react';

export default function InfoPublicaView() {
  const opendb = [
    { title: 'Zika Virus Envelope Protein', desc: 'Predictiva de alta resolución de la glucoproteína superficial.', icon: Shield, color: 'var(--accent-red)' },
    { title: 'Taq Polymerase Mutants', desc: 'Variantes termoestables optimizadas identificadas la semana pasada.', icon: Microscope, color: 'var(--accent-blue)' },
    { title: 'CRISPR-Cas9 Complex', desc: 'Endonucleasa guiada por ARN, plegamiento canónico.', icon: Database, color: 'var(--accent-purple)' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }} className="text-gradient">Base de Datos Pública</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Hallazgos computacionales recientes compartidos por la comunidad open-source.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {opendb.map((db, idx) => {
          const Icon = db.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.8rem', background: 'var(--bg-primary)', borderRadius: '50%', width: 'fit-content' }}>
                 <Icon size={28} color={db.color} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{db.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                 {db.desc}
              </p>
              <button className="btn btn-secondary" style={{ marginTop: 'auto', padding: '0.5rem', fontSize: '0.85rem' }}>
                Ver Estructura
              </button>
            </div>
          )
        })}
      </div>
    </div>
  );
}
