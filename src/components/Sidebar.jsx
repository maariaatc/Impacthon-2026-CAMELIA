import { Activity, FileText, FlaskConical, History, BookOpen, Globe } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange }) {
  const menuItems = [
    { id: 'informes', label: 'Informes', icon: FileText },
    { id: 'nueva-prediccion', label: 'Nueva Predicción', icon: FlaskConical },
    { id: 'ejecuciones', label: 'Ejecuciones', icon: Activity },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'info-publica', label: 'Información Pública', icon: Globe },
    { id: 'instrucciones', label: 'Instrucciones/Tutorial', icon: BookOpen },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--surface-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <img
          src="/LOGO.jpeg"
          alt="BioHack logo"
          style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
        />
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
          BioHack
        </h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                background: isActive ? 'var(--bg-glass)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--surface-border)' : '1px solid transparent',
                textAlign: 'left',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                width: '100%',
                cursor: 'pointer',
                boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.05), var(--shadow-sm)' : 'none'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  );
}
