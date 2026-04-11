import { useEffect, useRef, useState } from 'react';

/* ─── Paleta: azul oscuro (bajo error) → blanco → amarillo (alto error) ──── */
function paeToRGB(value, maxVal) {
    const t = Math.min(Math.max(value / maxVal, 0), 1);
    if (t < 0.3) {
        // Azul oscuro → azul claro (0–30% del rango)
        const s = t / 0.3;
        return [Math.round(s * 100), Math.round(83 + s * 120), Math.round(214)];
    } else if (t < 0.6) {
        // Azul claro → blanco (30–60%)
        const s = (t - 0.3) / 0.3;
        return [Math.round(100 + s * 155), Math.round(203 + s * 52), Math.round(214 + s * 41)];
    } else {
        // Blanco → amarillo intenso (60–100%)
        const s = (t - 0.6) / 0.4;
        return [255, Math.round(255 - s * 150), Math.round(255 - s * 255)];
    }
}

export default function PAEHeatmap({ paeMatrix, meanPae }) {
    const canvasRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    const n = paeMatrix?.length || 0;
    const maxPAE = 20; // AlphaFold usa 0–30 Å como rango estándar

    /* ── Dibuja el heatmap en el canvas ──────────────────────────────────── */
    useEffect(() => {
        if (!paeMatrix || n === 0 || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const size = canvas.width;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const cellPx = size / n;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const val = paeMatrix[i]?.[j] ?? maxPAE;
                const [r, g, b] = paeToRGB(val, maxPAE);
                // Rellenar todos los píxeles del bloque
                const x0 = Math.floor(j * cellPx);
                const y0 = Math.floor(i * cellPx);
                const x1 = Math.floor((j + 1) * cellPx);
                const y1 = Math.floor((i + 1) * cellPx);
                for (let py = y0; py < y1; py++) {
                    for (let px = x0; px < x1; px++) {
                        const idx = (py * size + px) * 4;
                        imgData.data[idx] = r;
                        imgData.data[idx + 1] = g;
                        imgData.data[idx + 2] = b;
                        imgData.data[idx + 3] = 255;
                    }
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }, [paeMatrix, n]);

    /* ── Tooltip al mover el ratón ───────────────────────────────────────── */
    const handleMouseMove = (e) => {
        if (!paeMatrix || n === 0) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const j = Math.floor((px / rect.width) * n);
        const i = Math.floor((py / rect.height) * n);
        if (i >= 0 && i < n && j >= 0 && j < n) {
            const val = paeMatrix[i]?.[j] ?? 0;
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, i: i + 1, j: j + 1, val: val.toFixed(1) });
        }
    };

    if (!paeMatrix || n === 0) return null;

    return (
        <div style={{
            background: 'rgba(10,14,28,.90)',
            border: '1px solid rgba(99,102,241,.25)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
        }}>
            {/* Cabecera */}
            <button
                onClick={() => setCollapsed(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', background: 'transparent',
                    border: 'none', padding: '1rem 1.2rem', cursor: 'pointer', color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ fontSize: '1rem' }}>🗺️</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        Matriz PAE
                    </span>
                    {meanPae != null && (
                        <span style={{
                            background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)',
                            color: '#a5b4fc', borderRadius: '20px', padding: '0.15rem 0.55rem',
                            fontSize: '0.65rem', fontWeight: 700,
                        }}>
                            Media {Number(meanPae).toFixed(1)} Å
                        </span>
                    )}
                </div>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{collapsed ? '›' : '‹'}</span>
            </button>

            {!collapsed && (
                <div style={{ padding: '0 1rem 1rem' }}>

                    {/* Leyenda educativa */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '0.65rem', fontSize: '0.62rem', color: '#6b7280',
                    }}>
                        <span>🔵 Bajo error → dominios bien definidos</span>
                        <span>🟡 Alto error → orientación incierta</span>
                    </div>

                    {/* Canvas + etiquetas de ejes */}
                    <div style={{ position: 'relative' }}>
                        {/* Etiqueta eje Y */}
                        <div style={{
                            position: 'absolute', left: '-1.4rem', top: '50%',
                            transform: 'translateY(-50%) rotate(-90deg)',
                            fontSize: '0.58rem', color: '#4b5563', whiteSpace: 'nowrap',
                        }}>Residuo i</div>

                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                            <canvas
                                ref={canvasRef}
                                width={300}
                                height={300}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setTooltip(null)}
                                style={{
                                    width: '100%', height: 'auto', display: 'block',
                                    borderRadius: '8px', cursor: 'crosshair',
                                    imageRendering: 'pixelated',
                                }}
                            />

                            {/* Tooltip */}
                            {tooltip && (
                                <div style={{
                                    position: 'absolute',
                                    left: Math.min(tooltip.x + 10, 220),
                                    top: Math.max(tooltip.y - 40, 4),
                                    background: 'rgba(8,8,22,.95)', backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(99,102,241,.4)', borderRadius: '8px',
                                    padding: '0.3rem 0.6rem', fontSize: '0.68rem', color: '#e2e8f0',
                                    pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
                                }}>
                                    <span style={{ color: '#818cf8' }}>i={tooltip.i}</span>
                                    {' → '}
                                    <span style={{ color: '#818cf8' }}>j={tooltip.j}</span>
                                    {'  '}
                                    <span style={{ fontWeight: 700, color: Number(tooltip.val) < 5 ? '#60a5fa' : Number(tooltip.val) < 15 ? '#fbbf24' : '#f87171' }}>
                                        {tooltip.val} Å
                                    </span>
                                </div>
                            )}

                            {/* Escala de color */}
                            <div style={{
                                position: 'absolute', right: '-2.2rem', top: 0, bottom: 0,
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>30Å</span>
                                <div style={{
                                    width: '8px', flex: 1, margin: '4px 0',
                                    background: 'linear-gradient(to top, #0053d6, #ffffff, #ffdb13)',
                                    borderRadius: '4px',
                                }} />
                                <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>0Å</span>
                            </div>
                        </div>

                        {/* Etiqueta eje X */}
                        <div style={{
                            textAlign: 'center', fontSize: '0.58rem', color: '#4b5563', marginTop: '0.3rem',
                        }}>Residuo j</div>
                    </div>

                    {/* Interpretación */}
                    <div style={{
                        marginTop: '0.75rem', padding: '0.55rem 0.7rem',
                        background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)',
                        borderRadius: '8px', fontSize: '0.63rem', color: '#6b7280', lineHeight: 1.6,
                    }}>
                        💡 Los bloques <span style={{ color: '#60a5fa' }}>azules en la diagonal</span> indican dominios con alta confianza posicional.
                        Los bloques <span style={{ color: '#fbbf24' }}>amarillos entre dominios</span> indican que la orientación relativa entre esas regiones es incierta.
                    </div>
                </div>
            )}
        </div>
    );
}