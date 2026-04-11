import { useEffect, useRef, useCallback } from 'react';

export default function MolecularViewer({ 
  modelData, 
  format = 'pdb', 
  plddtPerResidue, 
  highlightResidue, 
  savedAnnotations = [] 
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  // Función para aplicar el estilo oficial pLDDT (AlphaFold)
  const applyBaseStyle = useCallback((viewer, opacity = 1) => {
    if (plddtPerResidue && plddtPerResidue.length > 0) {
      viewer.setStyle({}, {
        cartoon: {
          opacity: opacity,
          colorfunc: (atom) => {
            const score = plddtPerResidue[atom.resi - 1];
            
            // CORRECCIÓN COLOR GRIS: Si no hay score, usamos un color neutro de la cadena
            if (score === undefined || score === null) return '#4b5563'; 
            
            if (score > 90) return '#0053d6'; // Muy alta
            if (score > 70) return '#65cbf3'; // Alta
            if (score > 50) return '#ffdb13'; // Media
            return '#ff7d45';                 // Baja
          }
        }
      });
    } else {
      viewer.setStyle({}, { cartoon: { color: 'spectrum', opacity: opacity } });
    }
  }, [plddtPerResidue]);

  // EFECTO 1: Inicialización
  useEffect(() => {
    if (!containerRef.current || !modelData) return;
    if (!window.$3Dmol) return;

    if (viewerRef.current) {
      try { viewerRef.current.clear(); } catch (_) {}
    }
    containerRef.current.innerHTML = '';

    const viewer = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: '0x0a0a0f',
      antialias: true,
    });
    viewerRef.current = viewer;

    viewer.addModel(modelData, format);
    applyBaseStyle(viewer);

    viewer.zoomTo();
    viewer.render();
    viewer.zoom(0.9, 400);
  }, [modelData, format, applyBaseStyle]);

  // EFECTO 2: Gestión de Post-its y Foco Dinámico
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !modelData) return;

    viewer.removeAllLabels();
    viewer.removeAllShapes();

    // 1. DIBUJAR ANOTACIONES FIJAS (Post-its biológicos)
    savedAnnotations.forEach(note => {
      const colorNote = '#10b981'; // Verde esmeralda

      // Marcador en el residuo
      viewer.addStyle({ resi: note.residue }, { 
        sphere: { color: colorNote, radius: 0.7 } 
      });

      // Etiqueta Post-it
      viewer.addLabel(note.text, {
        position: { resi: note.residue },
        backgroundColor: colorNote,
        fontColor: 'white',
        fontSize: 12,
        backgroundOpacity: 1,
        borderRadius: 6,
        padding: 5,
        alignment: 'topLeft',
        inFront: true,
        showBackground: true
      });

      // La "Flecha": Línea conectora
      viewer.addShape({
        type: 'line',
        start: { resi: note.residue },
        // La flecha apunta al átomo desde una pequeña distancia relativa
        end: { resi: note.residue, x: 3, y: 3, z: 3 }, 
        color: colorNote,
        lineWidth: 2
      });
    });

    // 2. LÓGICA DE RESALTADO TEMPORAL
    const resiNum = parseInt(highlightResidue);
    if (highlightResidue && !isNaN(resiNum)) {
      // Aplicamos opacidad baja al resto para resaltar la búsqueda
      applyBaseStyle(viewer, 0.3); 

      viewer.addStyle({ resi: resiNum }, { 
        sphere: { color: '#ff00ff', radius: 1.1 },
        cartoon: { color: '#ff00ff', opacity: 1 } 
      });

      viewer.addLabel("Seleccionado", {
        position: { resi: resiNum },
        backgroundColor: '#ff00ff',
        fontColor: 'white',
        fontSize: 12,
        backgroundOpacity: 0.8
      });

      viewer.zoomTo({ resi: resiNum }, 800);
    } else {
      // SI NO HAY BÚSQUEDA: Restauramos opacidad al 100% y colores originales
      applyBaseStyle(viewer, 1);
    }

    viewer.render();
  }, [highlightResidue, savedAnnotations, applyBaseStyle, modelData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* Leyenda de Confianza */}
      <div style={{
        position: 'absolute', bottom: '1rem', right: '1rem',
        background: 'rgba(10, 10, 15, 0.9)', padding: '0.7rem',
        borderRadius: '12px', backdropFilter: 'blur(10px)',
        zIndex: 10, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', gap: '0.4rem'
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', marginBottom: '0.1rem' }}>Confianza pLDDT</div>
        {[
          { color: '#0053d6', label: 'Muy Alta (>90)' },
          { color: '#65cbf3', label: 'Alta (70-90)' },
          { color: '#ffdb13', label: 'Media (50-70)' },
          { color: '#ff7d45', label: 'Baja (<50)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: '1rem', left: '1rem',
        background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '0.3rem 0.6rem', borderRadius: '6px',
        fontSize: '0.6rem', color: '#9ca3af', zIndex: 10
      }}>
        🧬 3Dmol.js Engine
      </div>
    </div>
  );
}