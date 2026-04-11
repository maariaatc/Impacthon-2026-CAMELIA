import { useEffect, useRef, useCallback, useState } from 'react';
import { Pin } from 'lucide-react';

/* ─── Paleta de colores para post-its ────────────────────────────────────── */
const ANNOTATION_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#a78bfa', '#f472b6'];

function getLabelOffset(index) {
  return [
    { x: 8, y: 8, z: 4 },
    { x: -8, y: 10, z: 4 },
    { x: 10, y: -6, z: 6 },
    { x: -6, y: -8, z: 5 },
    { x: 12, y: 4, z: 3 },
  ][index % 5];
}

const FALLBACK_PROTEINS = [
  { id: '1CRN', name: 'Crambin', color: '#60a5fa' },
  { id: '4LZT', name: 'Lisozima de fago T4', color: '#a78bfa' },
  { id: '1L2Y', name: 'Trp-cage miniproteína', color: '#34d399' },
  { id: '2KHO', name: 'Pectato liasa', color: '#fbbf24' },
  { id: '1VII', name: 'Vilina headpiece', color: '#f87171' },
  { id: '1ENH', name: 'Homeodomain Engrailed', color: '#f472b6' },
];

export default function MolecularViewer({
  modelData,
  format = 'pdb',
  plddtPerResidue,
  highlightResidue,
  savedAnnotations = [],
  useFallback = false,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [fbLoading, setFbLoading] = useState(false);
  const currentFb = useRef(FALLBACK_PROTEINS[Math.floor(Math.random() * FALLBACK_PROTEINS.length)]).current;

  /* ── Estilo base pLDDT con soporte para Modo Foco (Gris) ────────────────── */
  /* ── Estilo base pLDDT Corregido ────────────────────────────────────────── */
  const applyBaseStyle = useCallback((viewer, focusMode = false) => {
    // Creamos el objeto de estilo base
    const cartoonStyle = {
      opacity: focusMode ? 0.3 : 1,
    };

    if (focusMode) {
      // En modo foco, aplicamos color gris plano y NO incluimos colorfunc
      cartoonStyle.color = '#d1d5db';
    } else if (plddtPerResidue?.length > 0) {
      // Si no hay foco y tenemos datos, aplicamos la función de color pLDDT
      cartoonStyle.colorfunc = (atom) => {
        const s = plddtPerResidue[atom.resi - 1];
        if (s == null) return '#4b5563';
        if (s > 90) return '#0053d6';
        if (s > 70) return '#65cbf3';
        if (s > 50) return '#ffdb13';
        return '#ff7d45';
      };
    } else {
      // Si no hay nada, espectro por defecto
      cartoonStyle.color = 'spectrum';
    }

    viewer.setStyle({}, { cartoon: cartoonStyle });
  }, [plddtPerResidue]);

  /* ── EFECTO FALLBACK: proteínas fuera del catálogo ─────────────────────── */
  useEffect(() => {
    if (!useFallback || !containerRef.current || !window.$3Dmol) return;
    let cancelled = false;
    setFbLoading(true);
    fetch(`https://files.rcsb.org/download/${currentFb.id}.pdb`)
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .then(text => {
        if (cancelled || !containerRef.current) return;
        setFbLoading(false);
        if (viewerRef.current) { try { viewerRef.current.clear(); } catch (_) { } }
        containerRef.current.innerHTML = '';
        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '0x070710', antialias: true,
        });
        viewerRef.current = viewer;
        viewer.addModel(text, 'pdb');
        viewer.setStyle({}, { cartoon: { color: 'spectrum', opacity: 1 } });
        viewer.zoomTo();
        viewer.render();
        viewer.zoom(0.9, 400);
      })
      .catch(() => { if (!cancelled) setFbLoading(false); });
    return () => { cancelled = true; };
  }, [useFallback]); // eslint-disable-line

  /* ── EFECTO 1: Inicialización ─────────────────────────────────────────── */
  useEffect(() => {
    if (useFallback || !containerRef.current || !modelData || !window.$3Dmol) return;
    if (viewerRef.current) { try { viewerRef.current.clear(); } catch (_) { } }
    containerRef.current.innerHTML = '';

    const viewer = window.$3Dmol.createViewer(containerRef.current, {
      backgroundColor: '0x070710',
      antialias: true,
    });
    viewerRef.current = viewer;
    viewer.addModel(modelData, format);
    applyBaseStyle(viewer);
    viewer.zoomTo();
    viewer.render();
    viewer.zoom(0.9, 400);
  }, [modelData, format, applyBaseStyle]);

  /* ── EFECTO 2: Post-its + resaltado con Foco Gris ─────────────────────── */
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !modelData) return;

    viewer.removeAllLabels();
    viewer.removeAllShapes();

    /* 1. Resaltado temporal (Highlight) */
    const resiNum = parseInt(highlightResidue, 10);
    const hasHighlight = !isNaN(resiNum) && !!highlightResidue;

    if (hasHighlight) {
      // Ponemos toda la proteína en gris tenue
      applyBaseStyle(viewer, true);

      // Resaltamos el residuo específico con color y esfera
      viewer.addStyle({ resi: resiNum }, {
        sphere: { color: '#e879f9', radius: 1.2, opacity: 1 },
        cartoon: { color: '#e879f9', opacity: 1 },
      });

      viewer.addLabel(`Residuo ${resiNum}`, {
        position: { resi: resiNum }, offset: { x: 6, y: 6, z: 3 },
        backgroundColor: '#7c3aed', fontColor: 'white',
        fontSize: 13, backgroundOpacity: 0.95,
        borderRadius: 8, padding: 5,
        inFront: true, showBackground: true, fontFamily: 'Arial',
      });
      viewer.zoomTo({ resi: resiNum }, 800);
    } else {
      // Sin selección, volvemos al estilo pLDDT normal
      applyBaseStyle(viewer, false);
    }

    /* 2. Anotaciones fijas (Post-its) */
    savedAnnotations.forEach((note, idx) => {
      const color = ANNOTATION_COLORS[idx % ANNOTATION_COLORS.length];
      const offset = getLabelOffset(idx);

      // Marcamos el átomo de la nota
      viewer.addStyle({ resi: note.residue }, { sphere: { color, radius: 0.65, opacity: 0.95 } });

      viewer.addShape({
        type: 'line',
        start: { resi: note.residue },
        end: { resi: note.residue, x: offset.x, y: offset.y, z: offset.z },
        color, lineWidth: 2.5,
      });

      viewer.addLabel(`📌 ${note.text}`, {
        position: { resi: note.residue },
        offset: { x: offset.x + 2, y: offset.y + 2, z: offset.z },
        backgroundColor: color, fontColor: 'white',
        fontSize: 11, backgroundOpacity: 0.92,
        borderRadius: 6, padding: 4,
        inFront: true, showBackground: true, fontFamily: 'Arial',
      });
    });

    viewer.render();
  }, [highlightResidue, savedAnnotations, applyBaseStyle, modelData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>

      {/* Chip de residuo activo */}
      {highlightResidue && !isNaN(parseInt(highlightResidue, 10)) && (
        <div style={{
          position: 'absolute', top: '0.8rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 15, background: 'rgba(124,58,237,.9)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,121,249,.4)', borderRadius: '20px',
          padding: '0.25rem 0.9rem', fontSize: '0.72rem', color: '#f5d0fe', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: '0 0 16px rgba(124,58,237,.4)', pointerEvents: 'none',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e879f9', display: 'inline-block' }} />
          Residuo {highlightResidue} activo
        </div>
      )}

      {/* Panel de anotaciones */}
      {savedAnnotations.length > 0 && (
        <div style={{
          position: 'absolute', top: '0.8rem', right: '0.8rem', zIndex: 15,
          background: 'rgba(8,8,18,.9)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px',
          padding: '0.55rem 0.75rem', maxWidth: '175px', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '0.61rem', color: '#6b7280', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Pin size={9} /> {savedAnnotations.length} anotación{savedAnnotations.length !== 1 ? 'es' : ''}
          </div>
          {savedAnnotations.map((note, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ANNOTATION_COLORS[i % ANNOTATION_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.65rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                #{note.residue} — {note.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {useFallback && fbLoading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,7,22,.95)', gap: '0.8rem' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,.08)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Cargando {currentFb.name}…</span>
        </div>
      )}
      {useFallback && !fbLoading && (
        <div style={{ position: 'absolute', bottom: '3.8rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(8,8,22,.92)', backdropFilter: 'blur(10px)', border: `1px solid ${currentFb.color}55`, borderRadius: '20px', padding: '0.3rem 0.9rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: currentFb.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 600 }}>{currentFb.name}</span>
          <span style={{ fontSize: '0.62rem', color: '#4b5563', fontFamily: 'monospace' }}>· {currentFb.id}</span>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* Leyenda pLDDT — solo cuando hay datos reales */}
      {!useFallback && (
        <div style={{
          position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 10,
          background: 'rgba(7,7,16,.93)', padding: '0.65rem', borderRadius: '10px',
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.08)',
          display: 'flex', flexDirection: 'column', gap: '0.32rem', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#fff', marginBottom: '0.05rem' }}>Confianza pLDDT</div>
          {[
            { color: '#0053d6', label: 'Muy Alta (>90)' },
            { color: '#65cbf3', label: 'Alta (70–90)' },
            { color: '#ffdb13', label: 'Media (50–70)' },
            { color: '#ff7d45', label: 'Baja (<50)' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.42rem' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: '1rem', left: '240px', zIndex: 10,
        background: 'rgba(7,7,16,.7)', border: '1px solid rgba(255,255,255,.08)',
        padding: '0.28rem 0.55rem', borderRadius: '5px',
        fontSize: '0.58rem', color: '#9ca3af', pointerEvents: 'none',
      }}>
        🧬 3Dmol.js Engine
      </div>
    </div>
  );
}