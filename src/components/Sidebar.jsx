import { useState, useRef, useEffect } from 'react';
import { Activity, FileText, FlaskConical, History, BookOpen, Globe, ChevronDown } from 'lucide-react';

const menuItems = [
  { id: 'informes',         label: 'Informes',               icon: FileText     },
  { id: 'nueva-prediccion', label: 'Nueva Predicción',       icon: FlaskConical },
  { id: 'ejecuciones',      label: 'Ejecuciones',            icon: Activity     },
  { id: 'historial',        label: 'Historial',              icon: History      },
  { id: 'info-publica',     label: 'Información Pública',    icon: Globe        },
  { id: 'instrucciones',    label: 'Instrucciones/Tutorial', icon: BookOpen     },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const activeItem = menuItems.find(m => m.id === activeTab);
  const ActiveIcon = activeItem?.icon || FileText;

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    document.addEventListener('touchstart', fn);
    return () => { document.removeEventListener('mousedown', fn); document.removeEventListener('touchstart', fn); };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 500 }}>
      {/* Botón principal */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: open ? '10px 10px 0 0' : '10px',
          padding: '0.6rem 1rem',
          color: 'white', cursor: 'pointer',
          fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: 500,
          whiteSpace: 'nowrap', minWidth: '200px',
          transition: 'border-radius 0.1s',
        }}
      >
        <img src="/logo.jpeg" alt="logo" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} />
        <ActiveIcon size={15} color="#818cf8" />
        <span style={{ flex: 1, textAlign: 'left' }}>{activeItem?.label || 'Menú'}</span>
        <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Ventana desplegable */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0,
          width: '100%', minWidth: '200px',
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.15)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onTabChange(item.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.7rem',
                  width: '100%', padding: '0.75rem 1rem',
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderBottom: idx < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.88rem', fontFamily: 'inherit',
                }}
              >
                <Icon size={15} color={isActive ? '#818cf8' : 'currentColor'} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}