import { useState } from 'react';
import { JobMonitor } from './components/JobMonitor';

const BASE_URL = 'https://api-mock-cesga.onrender.com';

const FASTA_EJEMPLO = `>sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`;

export default function App() {
  const [fasta, setFasta] = useState('');
  const [jobId, setJobId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [resultados, setResultados] = useState(null);

  const handleSubmit = async () => {
    if (!fasta.trim() || !fasta.startsWith('>')) {
      setErrorEnvio('La secuencia debe empezar por ">"');
      return;
    }
    setErrorEnvio(null);
    setEnviando(true);
    setJobId(null);
    setResultados(null);

    try {
      const res = await fetch(`${BASE_URL}/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fasta_sequence: fasta,
          fasta_filename: 'secuencia.fasta',
          gpus: 1,
          memory_gb: 16,
        }),
      });
      const data = await res.json();
      setJobId(data.job_id);
    } catch (err) {
      setErrorEnvio('Error al conectar con la API. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCompleted = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/jobs/${id}/outputs`);
      const data = await res.json();
      setResultados({
        plddt: data.structural_data?.confidence?.plddt_mean,
        solubilidad: data.biological_data?.solubility_score,
        estabilidad: data.biological_data?.instability_index,
        proteina: data.protein_metadata?.protein_name,
      });
    } catch (err) {
      console.error('Error obteniendo resultados', err);
    }
  };

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ color: '#0f6e56', marginBottom: '8px' }}>
        🧬 BioHack — Predicción de Proteínas
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Pega tu secuencia FASTA y el clúster CESGA calculará la estructura 3D.
      </p>

      {/* Input */}
      <div>
        <textarea
          value={fasta}
          onChange={(e) => setFasta(e.target.value)}
          placeholder=">sp|P0CG47|UBQ_HUMAN Ubiquitin&#10;MQIFVKTLTGKTITLEVEPSD..."
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontFamily: 'monospace',
            fontSize: '13px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={() => setFasta(FASTA_EJEMPLO)}
          style={{
            marginTop: '8px',
            marginRight: '10px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            background: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          Usar ejemplo
        </button>

        <button
          onClick={handleSubmit}
          disabled={enviando}
          style={{
            marginTop: '8px',
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            background: enviando ? '#9ca3af' : '#0f6e56',
            color: 'white',
            cursor: enviando ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar al clúster'}
        </button>

        {errorEnvio && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
            {errorEnvio}
          </p>
        )}
      </div>

      {/* Monitor de estado */}
      {jobId && (
        <JobMonitor jobId={jobId} onCompleted={handleCompleted} />
      )}

      {/* Resultados */}
      {resultados && (
        <div style={{
          marginTop: '32px',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #22c55e',
          background: '#f0fdf4',
        }}>
          <h2 style={{ color: '#15803d', marginTop: 0 }}>
            ✅ Resultados
            {resultados.proteina && ` — ${resultados.proteina}`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <MetricCard
              label="pLDDT medio"
              value={resultados.plddt?.toFixed(1)}
              description="Confianza global (>70 = fiable)"
              color="#3b82f6"
            />
            <MetricCard
              label="Solubilidad"
              value={`${resultados.solubilidad?.toFixed(1)}/100`}
              description=">50 = soluble en agua"
              color="#0f6e56"
            />
            <MetricCard
              label="Inestabilidad"
              value={resultados.estabilidad?.toFixed(1)}
              description="<40 = proteína estable"
              color="#f59e0b"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, description, color }) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      background: 'white',
      border: `1px solid ${color}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '22px', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontWeight: '600', fontSize: '13px', marginTop: '4px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{description}</div>
    </div>
  );
}