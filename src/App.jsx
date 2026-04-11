import { useState } from 'react';
import Sidebar from './components/Sidebar';
import NewPredictionView from './components/NewPredictionView';
import Dashboard from './components/Dashboard';
import EjecucionesView from './components/EjecucionesView';
import HistorialView from './components/HistorialView';
import InfoPublicaView from './components/InfoPublicaView';
import InstruccionesView from './components/InstruccionesView';
import { submitJob } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('nueva-prediccion');
  const [activeJobId, setActiveJobId] = useState(null);
  const [completedJobId, setCompletedJobId] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  const handleSequenceSubmit = async (jobData) => {
    try {
      setGlobalError(null);
      const res = await submitJob(jobData);
      setActiveJobId(res.job_id);
      setCompletedJobId(null);
    } catch (err) {
      console.error(err);
      setGlobalError(err.message || 'Error al conectar con CESGA.');
      setActiveJobId(null);
    }
  };

  const handleJobCompleted = (jobId) => {
    setActiveJobId(null);
    setCompletedJobId(jobId);
    setActiveTab('informes');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-primary)',
    }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main style={{
        flex: 1,
        minWidth: 0,
        boxSizing: 'border-box',
        padding: isMobile ? '1rem' : '2rem 3rem',
        paddingTop: isMobile ? '72px' : '2rem',
        overflowY: 'auto',
      }}>
        {globalError && (
          <div className="layout-container" style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-red)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)' }}>
            <strong>Error:</strong> {globalError}
            <button onClick={() => setGlobalError(null)} style={{ float: 'right', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {activeTab === 'nueva-prediccion' && (
          <NewPredictionView
            onSubmitJob={handleSequenceSubmit}
            activeJobId={activeJobId}
            onJobCompleted={handleJobCompleted}
          />
        )}

        {activeTab === 'informes' && (
          completedJobId ? (
            <Dashboard jobId={completedJobId} onNewSearch={() => {
              setCompletedJobId(null);
              setActiveTab('nueva-prediccion');
            }} />
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>No hay informes recientes</h2>
              <p>Realiza una nueva predicción para generar un informe de análisis de IA.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('nueva-prediccion')} style={{ marginTop: '1rem' }}>
                Ir a Nueva Predicción
              </button>
            </div>
          )
        )}

        {activeTab === 'ejecuciones' && <EjecucionesView />}
        {activeTab === 'historial' && <HistorialView />}
        {activeTab === 'info-publica' && <InfoPublicaView />}
        {activeTab === 'instrucciones' && <InstruccionesView />}
      </main>
    </div>
  );
}

export default App;