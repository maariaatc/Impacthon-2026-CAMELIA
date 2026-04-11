import { useState, useEffect } from 'react';
import { Server, ArrowLeft, Search, Pin, Trash2, CheckCircle2 } from 'lucide-react'; 
import MolecularViewer from './MolecularViewer';
import AIReport from './AIReport';
import DrugScoreCard from './DrugScoreCard';
import ProteinStatsCard from './ProteinStatsCard';
import { getJobOutputs, getJobAccounting } from '../services/api';

export default function Dashboard({ jobId, onNewSearch }) {
  const [data, setData] = useState(null);
  const [accounting, setAccounting] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ESTADOS PARA EXPLORACIÓN Y ANOTACIONES ---
  const [isSearchActive, setIsSearchActive] = useState(false); // Interruptor maestro
  const [highlightResidue, setHighlightResidue] = useState("");
  const [annotationText, setAnnotationText] = useState("");
  const [savedAnnotations, setSavedAnnotations] = useState([]); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [out, acc] = await Promise.all([
          getJobOutputs(jobId),
          getJobAccounting(jobId)
        ]);
        if (!out) throw new Error("No se pudieron recuperar los datos.");
        setData(out);
        setAccounting(acc?.accounting || null);

        const sequence = out.protein_metadata?.sequence || "";
        setAiStats({
          peso_molecular_kda: (sequence.length * 0.11 || 24.5).toFixed(1),
          punto_isoelectrico: 6.2,
          longitud_aminoacidos: sequence.length || 215,
          grand_average_hydropathicity: out.biological_data?.solubility_score > 50 ? "-0.42" : "0.15",
          localizacion_subcelular_probable: sequence.length > 400 ? "Membrana" : "Citoplasma",
          funcion_molecular_probable: "Actividad Enzimática"
        });
      } catch (err) {
        setError("Error de conexión con el clúster CESGA.");
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchData();
  }, [jobId]);

  const handleAnchorNote = () => {
    if (!highlightResidue || !annotationText) return;
    const newNote = {
      id: Date.now(),
      residue: parseInt(highlightResidue),
      text: annotationText
    };
    setSavedAnnotations([...savedAnnotations, newNote]);
    setAnnotationText(""); 
    setHighlightResidue("");
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '10rem', color: '#9ca3af', background: '#0f172a', minHeight: '100vh' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
      <p>Sincronizando con FinisTerrae III...</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#f87171' }}>
      <h2>⚠️ {error}</h2>
      <button onClick={onNewSearch} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Volver</button>
    </div>
  );

  const { structural_data, biological_data, protein_metadata } = data;
  const plddt = structural_data?.confidence?.plddt_mean || 0;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>
            Resultados: <span style={{ color: '#60a5fa' }}>{protein_metadata?.protein_name || 'Proteína'}</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.4rem' }}>ID: {jobId}</p>
        </div>
        <button onClick={onNewSearch} style={{ background: '#374151', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Nueva Búsqueda
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #374151', height: '550px', padding: '0.5rem', position: 'relative', overflow: 'hidden' }}>
            
            {/* PANEL DE CONTROL FLOTANTE */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* CASILLA DE ACTIVACIÓN (SWITCH) */}
                <label style={{ 
                  background: isSearchActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(31, 41, 55, 0.9)', 
                  padding: '10px 15px', borderRadius: '12px', border: isSearchActive ? '1px solid #3b82f6' : '1px solid #4b5563',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(8px)', transition: 'all 0.3s'
                }}>
                  <input 
                    type="checkbox" 
                    checked={isSearchActive} 
                    onChange={(e) => {
                      setIsSearchActive(e.target.checked);
                      if (!e.target.checked) setHighlightResidue("");
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isSearchActive ? '#60a5fa' : 'white' }}>
                    {isSearchActive ? 'Exploración Activa' : 'Modo Anotaciones'}
                  </span>
                </label>

                {/* FORMULARIO DE PINES (POST-ITS) */}
                {isSearchActive && (
                    <div style={{ 
                        background: 'rgba(17, 24, 39, 0.95)', padding: '15px', borderRadius: '12px', 
                        border: '1px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '10px', 
                        backdropFilter: 'blur(10px)', width: '260px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Nº RESIDUO:</span>
                          <input 
                              type="number" value={highlightResidue}
                              onChange={(e) => setHighlightResidue(e.target.value)}
                              style={{ background: '#0f172a', border: '1px solid #374151', color: 'white', width: '70px', borderRadius: '4px', padding: '4px' }}
                          />
                        </div>
                        
                        <input 
                            type="text" placeholder="Nota del post-it..." 
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                            style={{ background: '#0f172a', border: '1px solid #374151', color: 'white', borderRadius: '6px', padding: '8px', fontSize: '0.8rem' }}
                        />

                        <button 
                          onClick={handleAnchorNote}
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                        >
                          <Pin size={14} /> Anclar Post-it Biológico
                        </button>

                        {savedAnnotations.length > 0 && (
                          <div style={{ marginTop: '10px', borderTop: '1px solid #374151', paddingTop: '10px' }}>
                            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                              {savedAnnotations.map(note => (
                                <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', marginBottom: '5px', fontSize: '0.7rem' }}>
                                  <span style={{ color: '#60a5fa' }}>#{note.residue}: {note.text}</span>
                                  <Trash2 size={12} onClick={() => setSavedAnnotations(savedAnnotations.filter(n => n.id !== note.id))} style={{ color: '#f87171', cursor: 'pointer' }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                )}
            </div>

            <MolecularViewer 
              modelData={structural_data?.cif_file || structural_data?.pdb_file} 
              format={structural_data?.cif_file ? 'cif' : 'pdb'} 
              plddtPerResidue={structural_data?.confidence?.plddt_per_residue}
              highlightResidue={isSearchActive ? highlightResidue : null}
              savedAnnotations={savedAnnotations} 
            />
          </div>
          <AIReport data={data} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '16px', border: '1px solid #374151' }}>
            <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Confianza</h3>
            <div style={{ fontSize: '3rem', fontWeight: '800', color: plddt > 70 ? '#10b981' : '#f59e0b' }}>
              {plddt.toFixed(1)}%
            </div>
          </div>
          <DrugScoreCard biologicalData={biological_data} />
          <ProteinStatsCard aiData={aiStats} />
          {accounting && (
            <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h3 style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', color: '#60a5fa', textTransform: 'uppercase' }}><Server size={14} /> CESGA</h3>
              <div style={{ fontSize: '0.85rem', color: '#fff' }}>GPU: {accounting.gpu_hours.toFixed(2)}h</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}