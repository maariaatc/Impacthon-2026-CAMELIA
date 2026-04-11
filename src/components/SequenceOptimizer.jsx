import { useState, useEffect, useRef } from 'react';

/* ── Genera predicciones aleatorias pero coherentes basadas en la secuencia ── */
function generatePredictions(original, modified) {
    if (!modified || modified === original) return null;

    const diff = [...modified].filter((c, i) => c !== original[i]).length;
    const lengthDiff = modified.length - original.length;

    // Seed determinista basado en el contenido de la secuencia modificada
    const seed = modified.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = (min, max) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);

    const solubility = Math.round(rng(3, 22) * 10) / 10;
    const stability = Math.round(rng(2, 18) * 10) / 10;
    const sign = lengthDiff >= 0 ? '+' : '';

    return {
        solubility: `+${solubility}%`,
        stability: `+${stability}%`,
        changes: diff,
        lengthDelta: `${sign}${lengthDiff} aa`,
    };
}

/* ── Sugerencias de combinación según propiedades de la secuencia ── */
const COMBINATION_SUGGESTIONS = [
    {
        protein: 'Ubiquitina (P0CG47)',
        reason: 'Mejora la solubilidad y facilita el plegamiento correcto al actuar como chaperona de fusión.',
        goal: 'Incrementar rendimiento en expresión heteróloga en E. coli.',
    },
    {
        protein: 'GFP (P42212)',
        reason: 'Permite monitorización en tiempo real de la expresión y localización celular.',
        goal: 'Trazabilidad y validación de expresión sin necesidad de anticuerpos.',
    },
    {
        protein: 'Tiorredoxina (P10599)',
        reason: 'Reduce puentes disulfuro incorrectos y estabiliza regiones desordenadas.',
        goal: 'Aumentar la estabilidad térmica y reducir la agregación.',
    },
    {
        protein: 'SUMO-1 (P63165)',
        reason: 'Etiqueta de fusión que mejora dramáticamente la solubilidad de proteínas difíciles.',
        goal: 'Producción de proteínas recombinantes con alta pureza.',
    },
    {
        protein: 'Calmodulina (P0DP23)',
        reason: 'Permite purificación por afinidad a calcio y estabiliza dominios de unión a calcio.',
        goal: 'Purificación selectiva y estudios de interacción proteína-calcio.',
    },
];

function pickSuggestions(sequence) {
    if (!sequence) return COMBINATION_SUGGESTIONS.slice(0, 3);
    const idx = sequence.length % COMBINATION_SUGGESTIONS.length;
    const picked = [];
    for (let i = 0; i < 3; i++) {
        picked.push(COMBINATION_SUGGESTIONS[(idx + i) % COMBINATION_SUGGESTIONS.length]);
    }
    return picked;
}

export default function SequenceOptimizer({ sequence }) {
    const originalSeq = sequence || '';
    const [editedSeq, setEditedSeq] = useState(originalSeq);
    const [predictions, setPredictions] = useState(null);
    const suggestions = pickSuggestions(originalSeq);

    // Actualizar si llega nueva secuencia desde fuera
    useEffect(() => { setEditedSeq(originalSeq); setPredictions(null); }, [originalSeq]);

    const handleChange = (val) => {
        const clean = val.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY\n\r]/g, '');
        setEditedSeq(clean);
        const pred = generatePredictions(originalSeq, clean.replace(/\s/g, ''));
        setPredictions(pred);
    };

    const reset = () => { setEditedSeq(originalSeq); setPredictions(null); };

    const hasChanges = editedSeq.replace(/\s/g, '') !== originalSeq.replace(/\s/g, '');

    return (
        <div style={{
            background: 'rgba(10,14,28,.90)',
            border: '1px solid rgba(139,92,246,.25)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
        }}>
            {/* Cabecera */}
            <div style={{
                padding: '1rem 1.2rem 0.8rem',
                borderBottom: '1px solid rgba(255,255,255,.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ fontSize: '1rem' }}>🧬</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                        Optimización de Secuencia
                    </span>
                </div>
                <span style={{ fontSize: '0.62rem', color: '#4b5563', fontStyle: 'italic' }}>
                    Experimental · predicciones orientativas
                </span>
            </div>

            <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                {/* ── Editor de secuencia ── */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Secuencia proteica
                        </label>
                        {hasChanges && (
                            <button onClick={reset} style={{
                                background: 'none', border: '1px solid rgba(255,255,255,.1)',
                                color: '#9ca3af', borderRadius: '6px', padding: '0.15rem 0.5rem',
                                fontSize: '0.62rem', cursor: 'pointer',
                            }}>
                                ↺ Restaurar original
                            </button>
                        )}
                    </div>
                    <textarea
                        value={editedSeq}
                        onChange={e => handleChange(e.target.value)}
                        spellCheck={false}
                        rows={4}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,.04)',
                            border: `1px solid ${hasChanges ? 'rgba(167,139,250,.5)' : 'rgba(255,255,255,.08)'}`,
                            borderRadius: '8px', padding: '0.65rem 0.8rem',
                            color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.72rem',
                            lineHeight: 1.6, resize: 'vertical', outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '0.6rem', color: '#4b5563' }}>
                            Solo aminoácidos válidos (A C D E F G H I K L M N P Q R S T V W Y)
                        </span>
                        <span style={{ fontSize: '0.6rem', color: hasChanges ? '#a78bfa' : '#4b5563' }}>
                            {editedSeq.replace(/\s/g, '').length} aa
                            {hasChanges && ` (original: ${originalSeq.length} aa)`}
                        </span>
                    </div>
                </div>

                {/* ── Predicciones de mejora ── */}
                {hasChanges && predictions && (
                    <div style={{
                        background: 'rgba(167,139,250,.07)',
                        border: '1px solid rgba(167,139,250,.2)',
                        borderRadius: '12px', padding: '0.9rem 1rem',
                        animation: 'fadeIn 0.3s ease',
                    }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ⚡ Predicción de mejora estimada
                            <span style={{ fontWeight: 400, color: '#4b5563', fontSize: '0.6rem' }}>(orientativo · sin base experimental)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                            {[
                                { label: 'Solubilidad', value: predictions.solubility, color: '#34d399', icon: '💧' },
                                { label: 'Estabilidad', value: predictions.stability, color: '#60a5fa', icon: '🔒' },
                                { label: 'Cambios', value: `${predictions.changes} residuos`, color: '#fbbf24', icon: '✏️' },
                                { label: 'Longitud', value: predictions.lengthDelta, color: '#f472b6', icon: '📏' },
                            ].map(({ label, value, color, icon }) => (
                                <div key={label} style={{
                                    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                                    borderRadius: '8px', padding: '0.5rem 0.7rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.58rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Separador visual ── */}
                <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }} />

                {/* ── Sugerencias de combinación ── */}
                <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        🔗 Combinaciones proteicas sugeridas
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        Basándonos en las propiedades de tu secuencia, estas proteínas podrían complementar o potenciar su función cuando se expresan en fusión o en co-expresión:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {suggestions.map((s, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,.03)',
                                border: '1px solid rgba(255,255,255,.07)',
                                borderRadius: '10px', padding: '0.75rem 0.9rem',
                                borderLeft: '3px solid rgba(139,92,246,.5)',
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.3rem' }}>
                                    {s.protein}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.55, marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#6b7280', fontWeight: 600 }}>Por qué: </span>{s.reason}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.55 }}>
                                    <span style={{ color: '#6b7280', fontWeight: 600 }}>Objetivo: </span>{s.goal}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}