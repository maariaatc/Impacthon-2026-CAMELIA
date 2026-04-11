import { useState, useEffect } from 'react';
import { getProteinSamples } from '../services/api';
// Importamos un icono para que quede más visual
import { Beaker } from 'lucide-react'; 

export default function SubmissionForm({ onSubmit }) {
  const [fasta, setFasta] = useState('');
  const [samples, setSamples] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSamples();
  }, []);

  const loadSamples = async () => {
    try {
      const data = await getProteinSamples();
      setSamples(data);
    } catch (err) {
      console.error('Failed to load samples', err);
    }
  };

  const handleSampleSelect = (sample) => {
    // Si la API devuelve el fasta, lo cargamos. 
    // Si no, lo construimos con el ID
    const fastaContent = sample.fasta || `>${sample.protein_id}\n${sample.sequence || ''}`;
    setFasta(fastaContent);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fasta.trim()) {
      setError('Por favor ingresa una secuencia válida.');
      return;
    }
    if (!fasta.trim().startsWith('>')) {
      setError('La secuencia FASTA debe comenzar con ">".');
      return;
    }
    setError(null);
    onSubmit(fasta);
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }} className="text-gradient">
        Nueva Predicción
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Analiza estructuras moleculares en el CESGA mediante AlphaFold2.
      </p>

      {/* --- SECCIÓN DE PROTEÍNAS PRECARGADAS (Propuesta 3) --- */}
      {samples.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Beaker size={14} /> Librería de Referencia (Samples)
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.8rem', scrollbarWidth: 'none' }}>
            {samples.map((sample, idx) => (
              <button 
                key={idx} 
                type="button" 
                onClick={() => handleSampleSelect(sample)}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.5rem 1rem', 
                  background: fasta.includes(sample.protein_id) ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: fasta.includes(sample.protein_id) ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)',
                  color: fasta.includes(sample.protein_id) ? 'var(--accent-blue)' : 'var(--text-primary)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {sample.protein_name || sample.protein_id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- EDITOR DE SECUENCIAS --- */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Editor de Secuencia FASTA
          </label>
          <textarea
            className="input-field"
            rows="10"
            placeholder=">nombre_proteina&#10;MAVLA..."
            value={fasta}
            onChange={(e) => { setFasta(e.target.value); setError(null); }}
            style={{ 
              resize: 'vertical', 
              fontFamily: 'monospace', 
              fontSize: '0.9rem',
              lineHeight: '1.4',
              padding: '1.2rem',
              background: 'rgba(0,0,0,0.2)'
            }}
          ></textarea>
        </div>
        
        {error && (
          <div style={{ 
            color: 'var(--accent-red)', 
            marginBottom: '1.2rem', 
            fontSize: '0.85rem', 
            padding: '0.8rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 'bold', fontSize: '1rem' }}>
          🚀 Lanzar Análisis en CESGA
        </button>
      </form>
    </div>
  );
}