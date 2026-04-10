import { useState, useEffect, useRef } from 'react';

const BASE_URL = 'https://api-mock-cesga.onrender.com';

export const useJobStatus = (jobId) => {
  const [state, setState] = useState({
    status: 'IDLE',
    isLoading: false,
    error: null,
  });

  const timerRef = useRef(null);
  const isMounted = useRef(true);
  const retryCount = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    if (!jobId) return;

    const checkStatus = async () => {
      if (!isMounted.current) return;
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const res = await fetch(`${BASE_URL}/jobs/${jobId}/status`);
        if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
        const result = await res.json();
        retryCount.current = 0;

        if (!isMounted.current) return;
        setState({ status: result.status, isLoading: false, error: null });

        const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'];
        if (!terminal.includes(result.status)) {
          timerRef.current = setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        if (!isMounted.current) return;
        retryCount.current++;
        if (retryCount.current <= 3) {
          timerRef.current = setTimeout(checkStatus, 3000 * retryCount.current);
          setState(prev => ({ ...prev, isLoading: false, error: `Reintentando... (${retryCount.current}/3)` }));
        } else {
          setState({ status: 'IDLE', isLoading: false, error: 'Sin conexión con el clúster. Inténtalo de nuevo.' });
        }
      }
    };

    checkStatus();

    return () => {
      isMounted.current = false;
      clearTimeout(timerRef.current);
    };
  }, [jobId]);

  return state;
};