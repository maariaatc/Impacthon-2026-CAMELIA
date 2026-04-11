import { useState } from 'react';
import { Download, FileCode2, FileJson, ScrollText, Archive, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function stringToBlob(content, mimeType) {
    return new Blob([content], { type: mimeType });
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function buildLog(data, jobId, accounting) {
    const now = new Date().toISOString();
    const meta = data?.protein_metadata || {};
    const conf = data?.structural_data?.confidence || {};
    const bio = data?.biological_data || {};
    const acc = accounting || {};

    return [
        '═══════════════════════════════════════════════════════════════',
        ' CAMELIA – Log completo de ejecución',
        '═══════════════════════════════════════════════════════════════',
        `Generado el      : ${now}`,
        `Job ID           : ${jobId}`,
        `Proteína         : ${meta.protein_name || 'N/A'}`,
        `Organismo        : ${meta.organism || 'N/A'}`,
        '',
        '── RECURSOS HPC (FinisTerrae III · CESGA) ───────────────────',
        `GPU-hours        : ${acc.gpu_hours?.toFixed(4) ?? 'N/A'}`,
        `CPU-hours        : ${acc.cpu_hours?.toFixed(4) ?? 'N/A'}`,
        `Memoria máx.     : ${acc.max_memory_gb?.toFixed(1) ?? 'N/A'} GB`,
        `Nodos            : ${acc.nodes ?? 'N/A'}`,
        `Tiempo reloj     : ${acc.wall_time_seconds ?? 'N/A'} s`,
        `Inicio           : ${acc.start_time ?? 'N/A'}`,
        `Fin              : ${acc.end_time ?? 'N/A'}`,
        '',
        '── CONFIANZA ESTRUCTURAL (pLDDT) ────────────────────────────',
        `pLDDT medio      : ${conf.plddt_mean?.toFixed(2) ?? 'N/A'}`,
        `pLDDT máx.       : ${conf.plddt_max?.toFixed(2) ?? 'N/A'}`,
        `pLDDT mín.       : ${conf.plddt_min?.toFixed(2) ?? 'N/A'}`,
        `Residuos totales : ${conf.plddt_per_residue?.length ?? 'N/A'}`,
        '',
        '── DATOS BIOLÓGICOS ─────────────────────────────────────────',
        `Drug Score       : ${bio.drug_score?.toFixed(3) ?? 'N/A'}`,
        `Solubilidad (%)  : ${bio.solubility_score?.toFixed(1) ?? 'N/A'}`,
        `Actividad diana  : ${bio.binding_affinity ?? 'N/A'}`,
        '',
        '── SECUENCIA FASTA ──────────────────────────────────────────',
        `>${meta.protein_name || 'Proteina'} | ${meta.organism || ''} | CAMELIA/${jobId}`,
        `${meta.sequence || 'Secuencia no disponible'}`,
        '',
        '═══════════════════════════════════════════════════════════════',
        ' Fin del log. Generado por CAMELIA v1.0',
        '═══════════════════════════════════════════════════════════════',
    ].join('\n');
}

function buildConfidenceJson(data, jobId) {
    const conf = data?.structural_data?.confidence || {};
    const meta = data?.protein_metadata || {};
    return JSON.stringify({
        job_id: jobId,
        protein_name: meta.protein_name,
        organism: meta.organism,
        plddt_mean: conf.plddt_mean,
        plddt_max: conf.plddt_max,
        plddt_min: conf.plddt_min,
        plddt_per_residue: conf.plddt_per_residue || [],
        generated_at: new Date().toISOString(),
        source: 'CAMELIA / FinisTerrae III · CESGA',
    }, null, 2);
}

/* ─── Definición de archivos descargables ──────────────────────────────────── */
function buildDownloadItems(data, jobId, accounting) {
    const struct = data?.structural_data || {};
    return [
        {
            id: 'pdb',
            label: 'Estructura PDB',
            desc: 'Coordenadas atómicas en formato Protein Data Bank',
            ext: '.pdb',
            icon: FileCode2,
            color: '#60a5fa',
            bg: 'rgba(96,165,250,.10)',
            border: 'rgba(96,165,250,.25)',
            mime: 'chemical/x-pdb',
            getContent: () => struct.pdb_file || '# PDB no disponible para este job\n',
        },
        {
            id: 'cif',
            label: 'Estructura mmCIF',
            desc: 'Formato macromolecular CIF (estándar wwPDB)',
            ext: '.cif',
            icon: FileCode2,
            color: '#a78bfa',
            bg: 'rgba(167,139,250,.10)',
            border: 'rgba(167,139,250,.25)',
            mime: 'chemical/x-mmcif',
            getContent: () => struct.cif_file || '# mmCIF no disponible para este job\n',
        },
        {
            id: 'json',
            label: 'JSON de confianza',
            desc: 'Scores pLDDT por residuo y metadatos de confianza',
            ext: '_confidence.json',
            icon: FileJson,
            color: '#34d399',
            bg: 'rgba(52,211,153,.10)',
            border: 'rgba(52,211,153,.25)',
            mime: 'application/json',
            getContent: () => buildConfidenceJson(data, jobId),
        },
        {
            id: 'log',
            label: 'Log completo',
            desc: 'Parámetros HPC, tiempos de cómputo y trazabilidad',
            ext: '_log.txt',
            icon: ScrollText,
            color: '#fbbf24',
            bg: 'rgba(251,191,36,.10)',
            border: 'rgba(251,191,36,.25)',
            mime: 'text/plain',
            getContent: () => buildLog(data, jobId, accounting),
        },
    ];
}

/* ─── Botón individual de descarga ─────────────────────────────────────────── */
function DownloadItem({ item, jobId, data, accounting }) {
    const [state, setState] = useState('idle'); // idle | loading | done
    const Icon = item.icon;

    const handleDownload = async () => {
        if (state !== 'idle') return;
        setState('loading');
        try {
            const content = item.getContent();
            const blob = stringToBlob(content, item.mime);
            const safeName = (data?.protein_metadata?.protein_name || jobId || 'resultado')
                .replace(/[^a-zA-Z0-9_-]/g, '_');
            triggerDownload(blob, `${safeName}${item.ext}`);
            setState('done');
            setTimeout(() => setState('idle'), 2500);
        } catch {
            setState('idle');
        }
    };

    const isBusy = state === 'loading';
    const isDone = state === 'done';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: item.bg,
            border: `1px solid ${isDone ? 'rgba(16,185,129,.45)' : item.border}`,
            borderRadius: '10px',
            padding: '0.7rem 0.9rem',
            transition: 'border-color 0.3s, background 0.2s',
        }}>
            {/* Icono del tipo de archivo */}
            <div style={{
                width: 36, height: 36,
                borderRadius: '8px',
                background: `${item.bg}`,
                border: `1px solid ${item.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <Icon size={17} color={item.color} />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                </div>
                <div style={{ fontSize: '0.67rem', color: '#6b7280', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.desc}
                </div>
            </div>

            {/* Botón de descarga */}
            <button
                onClick={handleDownload}
                disabled={isBusy}
                title={`Descargar ${item.label}`}
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: isDone
                        ? 'rgba(16,185,129,.22)'
                        : isBusy
                            ? 'rgba(255,255,255,.04)'
                            : `${item.bg}`,
                    border: `1px solid ${isDone ? 'rgba(16,185,129,.4)' : item.border}`,
                    color: isDone ? '#10b981' : item.color,
                    borderRadius: '8px',
                    padding: '0.38rem 0.75rem',
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    transition: 'all 0.25s',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!isBusy && !isDone) e.currentTarget.style.filter = 'brightness(1.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
                {isBusy
                    ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : isDone
                        ? <CheckCircle2 size={13} />
                        : <Download size={13} />}
                {isBusy ? 'Preparando…' : isDone ? '¡Listo!' : 'Descargar'}
            </button>
        </div>
    );
}

/* ─── Panel principal ───────────────────────────────────────────────────────── */
export default function DownloadPanel({ data, jobId, accounting }) {
    const [open, setOpen] = useState(true);

    const items = buildDownloadItems(data, jobId, accounting);

    const handleDownloadAll = () => {
        items.forEach((item, i) => {
            setTimeout(() => {
                const content = item.getContent();
                const blob = stringToBlob(content, item.mime);
                const safeName = (data?.protein_metadata?.protein_name || jobId || 'resultado')
                    .replace(/[^a-zA-Z0-9_-]/g, '_');
                triggerDownload(blob, `${safeName}${item.ext}`);
            }, i * 300); // escalonado para evitar bloqueos del navegador
        });
    };

    return (
        <div style={{
            background: 'rgba(10,14,28,.90)',
            border: '1px solid rgba(96,165,250,.2)',
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden',
        }}>
            {/* Cabecera colapsable */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    padding: '1rem 1.2rem',
                    cursor: 'pointer',
                    color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Archive size={15} color="#60a5fa" />
                    <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#60a5fa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.09em',
                    }}>
                        Descargar Resultados
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    {/* Descarga todo */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); handleDownloadAll(); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleDownloadAll(); } }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: 'rgba(96,165,250,.14)',
                            border: '1px solid rgba(96,165,250,.32)',
                            color: '#93c5fd',
                            borderRadius: '7px',
                            padding: '0.28rem 0.65rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,.26)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,.14)'; }}
                    >
                        <Download size={11} /> Todo
                    </div>
                    {open ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
                </div>
            </button>

            {/* Lista de archivos */}
            {open && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0 1rem 1rem',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    {items.map(item => (
                        <DownloadItem
                            key={item.id}
                            item={item}
                            jobId={jobId}
                            data={data}
                            accounting={accounting}
                        />
                    ))}

                    {/* Nota informativa */}
                    <div style={{
                        marginTop: '0.3rem',
                        padding: '0.5rem 0.7rem',
                        background: 'rgba(255,255,255,.025)',
                        border: '1px solid rgba(255,255,255,.06)',
                        borderRadius: '8px',
                        fontSize: '0.63rem',
                        color: '#4b5563',
                        lineHeight: 1.55,
                    }}>
                        💡 Los archivos PDB y mmCIF son compatibles con PyMOL, UCSF ChimeraX y VMD.
                        El JSON de confianza incluye scores pLDDT por residuo para análisis personalizados.
                    </div>
                </div>
            )}
        </div>
    );
}