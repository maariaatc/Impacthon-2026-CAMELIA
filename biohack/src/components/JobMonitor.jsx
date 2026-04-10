import { useJobStatus } from '../hooks/useJobStatus';

const STATUS_CONFIG = {
  IDLE:      { label: 'Esperando secuencia...',                color: 'gray',  progress: 0   },
  PENDING:   { label: 'Buscando nodo libre en CESGA...',       color: 'amber', progress: 25  },
  RUNNING:   { label: 'Ejecutando AlphaFold2 en GPU A100...', color: 'blue',  progress: 65  },
  COMPLETED: { label: '¡Estructura calculada!',                color: 'green', progress: 100 },
  FAILED:    { label: 'Error en el clúster',                   color: 'red',   progress: 100 },
};

const LOGS = [
  '[INFO] Apptainer container started',
  '[INFO] Loading AlphaFold2 weights...',
  '[INFO] Running MSA search against UniRef90...',
  '[INFO] Template search complete',
  '[INFO] Structure prediction in progress...',
];

function SimulatedLogs() {
  return (
    <div style={{
      background: '#0d1117',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#4ade80',
    }}>
      {LOGS.map((log, i) => (
        <div key={i} style={{
          opacity: 0,
          animation: `fadeIn 0.4s forwards`,
          animationDelay: `${i * 0.7}s`,
        }}>
          {log}
        </div>
      ))}
    </div>
  );
}

export function JobMonitor({ jobId, onCompleted }) {
  const { status, isLoading, error } = useJobStatus(jobId);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;

  if (status === 'COMPLETED' && onCompleted) {
    console.log('Enviando notificación al investigador...');
    onCompleted(jobId);
  }

  const colors = {
    gray:  '#6b7280',
    amber: '#f59e0b',
    blue:  '#3b82f6',
    green: '#22c55e',
    red:   '#ef4444',
  };

  const color = colors[config.color];

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: `1px solid ${color}`,
        color: color,
        fontWeight: '500',
      }}>
        {isLoading && (
          <div style={{
            width: '14px',
            height: '14px',
            border: `2px solid ${color}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
        )}
        {config.label}
      </div>

      <div style={{
        height: '6px',
        background: '#e5e7eb',
        borderRadius: '9999px',
        marginTop: '10px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${config.progress}%`,
          background: color,
          borderRadius: '9999px',
          transition: 'width 0.6s ease, background 0.4s',
        }} />
      </div>

      {status === 'RUNNING' && <SimulatedLogs />}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}