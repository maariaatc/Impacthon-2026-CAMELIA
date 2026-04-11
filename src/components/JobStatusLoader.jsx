import { useState, useEffect } from 'react';
import { checkJobStatus } from '../services/api';

export default function JobStatusLoader({ jobId, onComplete }) {
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let timeoutId;
    
    // Polling logic
    const poll = async () => {
      try {
        const data = await checkJobStatus(jobId);
        setStatus(data.status);
        
        if (data.status === 'COMPLETED') {
          onComplete(jobId);
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          setError(`El trabajo terminó con estado: ${data.status}`);
        } else {
          // Keep polling every 2 seconds
          timeoutId = setTimeout(poll, 2000);
        }
      } catch (err) {
        console.error('Error in polling loop:', err);
        // Do not fail immediately on network error, keep trying
        timeoutId = setTimeout(poll, 2000);
      }
    };
    
    poll();
    return () => clearTimeout(timeoutId);
  }, [jobId, onComplete]);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
      
      <div style={{ 
        width: '60px', 
        height: '60px', 
        border: '4px solid var(--surface-border)', 
        borderTopColor: 'var(--accent-blue)', 
        borderRadius: '50%',
        margin: '0 auto 1.5rem',
        animation: 'spin 1s linear infinite'
      }} />

      <h3 style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Procesando Secuencia en el Clúster</h3>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem' }}>
        Job ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent-purple)' }}>{jobId}</span>
      </p>
      
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%',
            background: status === 'PENDING' ? 'var(--accent-orange)' : 'var(--accent-blue)' 
          }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            Estado Actual: <strong style={{ letterSpacing: '0.5px' }}>{status}</strong>
          </span>
        </div>
      </div>
      
      {error && (
        <div style={{ marginTop: '1rem', color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
