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

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-primary)' }}>

      {/* Barra superior con el desplegable */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--surface-border)',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Contenido principal */}
      <main style={{ padding: '2rem 1.5rem', boxSizing: 'border-box', minWidth: 0 }}>
        {globalError && (
          <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--accent-red)', borderRadius: '8px', color: 'var(--text-primary)' }}>
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