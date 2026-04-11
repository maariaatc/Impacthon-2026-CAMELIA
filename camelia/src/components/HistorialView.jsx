import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function HistorialView() {
  const history = [
    { id: 'job_61b74c', date: '2026-04-10', protein: 'Ubiquitin', plddt: 89.2, status: 'COMPLETED' },
    { id: 'job_cc319e', date: '2026-04-09', protein: 'Hemoglobin alpha', plddt: 94.5, status: 'COMPLETED' },
    { id: 'job_44af01', date: '2026-04-05', protein: 'Synthetic Peptide A', plddt: 42.1, status: 'FAILED' },
    { id: 'job_11x00b', date: '2026-04-01', protein: 'Lysozyme C', plddt: 91.8, status: 'COMPLETED' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }} className="text-gradient">Mi Historial</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Registro de todas tus predicciones completadas anteriormente.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.5rem' }}>FECHA</th>
              <th style={{ padding: '0.5rem' }}>ID TRABAJO</th>
              <th style={{ padding: '0.5rem' }}>PROTEÍNA</th>
              <th style={{ padding: '0.5rem' }}>pLDDT</th>
              <th style={{ padding: '0.5rem' }}>RESULTADO</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{item.date}</td>
                <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace' }}>{item.id}</td>
                <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{item.protein}</td>
                <td style={{ padding: '1rem 0.5rem' }}>
                  <span style={{ color: item.plddt > 80 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {item.plddt}
                  </span>
                </td>
                <td style={{ padding: '1rem 0.5rem' }}>
                  {item.status === 'COMPLETED' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
                      <CheckCircle size={14} /> ÉXITO
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                      <AlertTriangle size={14} /> FALLO
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
