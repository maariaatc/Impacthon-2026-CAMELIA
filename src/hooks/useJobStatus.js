import { useState, useEffect, useRef } from 'react';

export function useJobStatus(jobId) {
  const [status, setStatus] = useState('IDLE');
  const [jobData, setJobData] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let timeoutId;

    const pollStatus = async () => {
      if (!jobId || !isMounted.current) return;

      setIsPolling(true);
      try {
        const response = await fetch(`https://api-mock-cesga.onrender.com/jobs/${jobId}/status`);
        
        if (!response.ok) throw new Error('Error al consultar el clúster');
        
        const data = await response.json();
        
        if (isMounted.current) {
          setStatus(data.status);
          setJobData(data);
          setError(null);

          const terminalStates = ['COMPLETED', 'FAILED', 'CANCELLED'];
          if (!terminalStates.includes(data.status)) {
            // Polling cada 3 segundos
            timeoutId = setTimeout(pollStatus, 3000);
          } else {
            setIsPolling(false);
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
          setStatus('FAILED');
          setIsPolling(false);
        }
      }
    };

    if (jobId) {
      pollStatus();
    }

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [jobId]);

  return { status, jobData, error, isPolling };
}