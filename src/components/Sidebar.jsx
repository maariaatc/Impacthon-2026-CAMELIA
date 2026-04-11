import { useState, useEffect, useRef } from 'react';
import { Activity, FileText, FlaskConical, History, BookOpen, Globe, Menu, X } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const menuItems = [
    { id: 'informes',         label: 'Informes',               icon: FileText     },
    { id: 'nueva-prediccion', label: 'Nueva Predicción',       icon: FlaskConical },
    { id: 'ejecuciones',      label: 'Ejecuciones',            icon: Activity     },
    { id: 'historial',        label: 'Historial',              icon: History      },
    { id: 'info-publica',     label: 'Información Pública',    icon: Globe        },
    { id: 'instrucciones',    label: 'Instrucciones/Tutorial', icon: BookOpen     },
  ];

  const handleTabChange = (id) => {
    onTabChange(id);
    setOpen(false);
  };

  const activeItem = menuItems.find(m => m.id === activeTab);

  /* ── MÓVIL: topbar + dropdown ── */
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      }}>
        {/* Barra superior */}
        <div style={{
          height: '56px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex', alignItems: 'center',
          padding: '0 1rem',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.jpeg" alt="logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>BioHack</span>
          </div>

          {/* Botón menú */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: open ? 'var(--bg-glass)' : 'transparent',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px', padding: '0.4rem 0.75rem',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
              <span>{activeItem?.label || 'Menú'}</span>
            </button>

            {/* Dropdown */}
            {open && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: '240px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--surface-border)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease',
              }}>
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        width: '100%', padding: '0.75rem 1rem',
                        background: isActive ? 'var(--bg-glass)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        textAlign: 'left', cursor: 'pointer',
                        fontWeight: isActive ? 600 : 400, fontSize: '0.9rem',
                      }}
                    >
                      <Icon size={16} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── ESCRITORIO: sidebar fija normal ── */
  return (
    <aside style={{
      width: '260px', flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--surface-border)',
      display: 'flex', flexDirection: 'column',
      padding: '1.5rem 1rem',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <img src="/logo.jpeg" alt="logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>BioHack</h1>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                background: isActive ? 'var(--bg-glass)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--surface-border)' : '1px solid transparent',
                textAlign: 'left', fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem', transition: 'all 0.2s ease',
                width: '100%', cursor: 'pointer',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}