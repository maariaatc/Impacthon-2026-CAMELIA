import { Server, Cpu, HardDrive } from 'lucide-react';

export default function EjecucionesView() {
  const jobs = [
    { id: 'job_88a12b', user: 'u_bio23', status: 'RUNNING', protein: 'P53 Tumor Suppressor', time: '45m' },
    { id: 'job_44c91d', user: 'u_res01', status: 'RUNNING', protein: 'Insulin analog', time: '12m' },
    { id: 'job_99f33e', user: 'tu_usuario', status: 'PENDING', protein: 'Desconocido', time: 'In Queue' },
    { id: 'job_22b10a', user: 'u_med77', status: 'PENDING', protein: 'BRCA1', time: 'In Queue' }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }} className="text-gradient">Monitor del Clúster CESGA</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Visualización del estado actual de los nodos de cómputo y cola de trabajos globales.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <Server size={32} color="var(--accent-blue)" />
           <div>
             <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nodos Activos</h4>
             <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>24 / 32</span>
           </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <Cpu size={32} color="var(--accent-purple)" />
           <div>
             <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carga CPU/GPU</h4>
             <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>82%</span>
           </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <HardDrive size={32} color="var(--accent-green)" />
           <div>
             <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>RAM Disponible</h4>
             <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>1.2 TB</span>
           </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
         <h3 style={{ margin: '0 0 1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Cola de Trabajos</h3>
         <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
           <thead>
             <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
               <th style={{ padding: '0.5rem' }}>ID TRABAJO</th>
               <th style={{ padding: '0.5rem' }}>USUARIO</th>
               <th style={{ padding: '0.5rem' }}>PROTEÍNA</th>
               <th style={{ padding: '0.5rem' }}>ESTADO</th>
               <th style={{ padding: '0.5rem' }}>TIEMPO</th>
             </tr>
           </thead>
           <tbody>
             {jobs.map((job, idx) => (
               <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{job.id}</td>
                 <td style={{ padding: '1rem 0.5rem' }}>{job.user}</td>
                 <td style={{ padding: '1rem 0.5rem' }}>{job.protein}</td>
                 <td style={{ padding: '1rem 0.5rem' }}>
                   <span style={{ 
                     background: job.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)', 
                     color: job.status === 'RUNNING' ? 'var(--accent-blue)' : 'var(--accent-orange)',
                     padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600
                   }}>
                     {job.status}
                   </span>
                 </td>
                 <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{job.time}</td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
