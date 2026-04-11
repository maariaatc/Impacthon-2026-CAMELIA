import { useState, useEffect } from 'react';
import {
  Loader, RefreshCw, Activity, Droplets, ShieldAlert,
  Zap, Download, FileText, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { generateBiologyReport } from '../services/aiService';
import { jsPDF } from 'jspdf';

/* ══════════════════════════════════════════════════════════════════════════════
   GENERACIÓN DEL INFORME MAESTRO PDF
   Secciones:
     1. Identificación de la proteína
     2. Métricas de confianza estructural  (datos CESGA reales o estimados por IA)
     3. Estructura secundaria predicha     (si disponible)
     4. Análisis del Traductor de Biología (texto del resumen IA)
     5. Veredicto Final de Viabilidad      ← NUEVO
     6. Anotaciones del investigador
══════════════════════════════════════════════════════════════════════════════ */
function generateMasterPDF({ data, reportData, savedAnnotations = [], viewerImage }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 18;
  const COL = W - MARGIN * 2;
  let y = MARGIN;

  const addPage = () => { doc.addPage(); y = MARGIN; };
  const checkY = (n = 12) => { if (y + n > 275) addPage(); };

  /* ── Cabecera ── */
  doc.setFillColor(6, 6, 16);
  doc.rect(0, 0, W, 44, 'F');
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(139, 92, 246);
  doc.text('CAMELIA · Informe Maestro de Predicción', MARGIN, 16);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 155, 175);
  doc.text('Cátedra CAMELIA — CESGA FinisTerrae III — Impacthón 2026', MARGIN, 25);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, MARGIN, 32);
  y = 52;

  // ─── AQUÍ ES DONDE DEBES PEGAR EL BLOQUE ───
  if (viewerImage) {
    checkY(85);
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241); // Color lila/azul del tema
    doc.text('1.1 Visualización Estructural 3D', MARGIN, y);
    y += 7;

    // CONFIGURACIÓN DE TAMAÑO
    const newWidth = 100; // Reducimos la anchura a 100mm (antes era COL, que son ~174mm)
    const newHeight = 80; // Mantenemos la altura que te gustaba

    // CALCULO PARA CENTRAR (Ancho página / 2 - Ancho imagen / 2)
    const centerX = (W / 2) - (newWidth / 2);

    // Insertar la captura del visor
    doc.addImage(viewerImage, 'PNG', centerX, y, newWidth, newHeight);
    y += newHeight + 8; // Bajamos el cursor Y basándonos en la altura
  }

  /* helper: título de sección */
  const sectionTitle = (num, text, r, g, b) => {
    checkY(18);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b);
    doc.text(`${num}. ${text}`, MARGIN, y); y += 6;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.3);
    doc.line(MARGIN, y, W - MARGIN, y); y += 6;
  };

  /* helper: par clave-valor */
  const kv = (k, v, kw = 38) => {
    checkY(6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(110, 120, 140);
    doc.text(k + ':', MARGIN, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 45);
    doc.text(String(v ?? 'N/A'), MARGIN + kw, y); y += 5.5;
  };

  const meta = data.protein_metadata || {};
  const conf = data.structural_data?.confidence || {};
  const bio = data.biological_data || {};

  /* ── 1. IDENTIFICACIÓN ── */
  sectionTitle('1', 'Identificación de la Proteína', 59, 130, 246);
  kv('Nombre', meta.protein_name);
  kv('Organismo', meta.organism);
  kv('UniProt', meta.uniprot_id);
  kv('PDB ID', meta.pdb_id);
  y += 4;

  /* ── 2. MÉTRICAS DE CONFIANZA ── */
  sectionTitle('2', 'Métricas de Confianza Estructural', 16, 185, 129);
  kv('pLDDT Medio', conf.plddt_mean, 44);
  kv('PAE Medio (Å)', conf.mean_pae, 44);
  kv('Solubilidad', `${bio.solubility_score ?? 'N/A'} / 100 — ${bio.solubility_prediction ?? ''}`, 44);
  kv('Inestabilidad', `${bio.instability_index ?? 'N/A'} — ${bio.stability_status ?? ''}`, 44);
  kv('Alertas Toxicidad', bio.toxicity_alerts?.length > 0 ? `${bio.toxicity_alerts.length} alerta(s)` : 'Ninguna', 44);
  y += 4;

  /* ── 3. ESTRUCTURA SECUNDARIA ── */
  const ss = bio.secondary_structure_prediction;
  if (ss) {
    sectionTitle('3', 'Estructura Secundaria Predicha', 251, 191, 36);
    kv('Hélice α', `${ss.helix_percent ?? 'N/A'}%`, 30);
    kv('Lámina β', `${ss.strand_percent ?? 'N/A'}%`, 30);
    kv('Coil', `${ss.coil_percent ?? 'N/A'}%`, 30);
    y += 4;
  }

  /* ── 4. ANÁLISIS DE IA ── */
  sectionTitle('4', 'Análisis del Traductor de Biología (IA)', 239, 68, 68);
  if (reportData?.summary) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 55);
    doc.splitTextToSize(reportData.summary, COL).forEach(line => {
      checkY(5.5); doc.text(line, MARGIN, y); y += 5.2;
    });
  } else {
    doc.setTextColor(150, 150, 165); doc.setFontSize(8.5);
    doc.text('Análisis de IA no disponible.', MARGIN, y); y += 5.5;
  }
  y += 4;

  /* ── 5. VEREDICTO FINAL DE VIABILIDAD ── */
  const isPromising = reportData?.verdictLabel === 'Prometedora';
  const vRGB = isPromising ? [16, 185, 129] : [239, 68, 68];
  const vBgRGB = isPromising ? [228, 255, 244] : [255, 232, 232];
  sectionTitle('5', 'Veredicto Final de Viabilidad', ...vRGB);

  checkY(18);
  doc.setFillColor(...vBgRGB);
  doc.roundedRect(MARGIN, y - 4, COL, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...vRGB);
  doc.text(`${isPromising ? '✓' : '⚠'}  ${reportData?.verdictLabel ?? 'No disponible'}`, MARGIN + 5, y + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(75, 80, 100);
  doc.text(
    isPromising
      ? 'Candidata para síntesis. Confianza y estabilidad aceptables para continuar.'
      : 'Descartar o refinar. Parámetros insuficientes para síntesis segura.',
    MARGIN + 42, y + 5
  );
  y += 22;

  /* ── 6. ANOTACIONES DEL INVESTIGADOR ── */
  if (savedAnnotations.length > 0) {
    sectionTitle('6', 'Anotaciones del Investigador', 167, 139, 250);
    savedAnnotations.forEach(note => {
      checkY(12);
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(MARGIN, y - 4, COL, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(109, 40, 217);
      doc.text(`Residuo ${note.residue}:`, MARGIN + 2, y + 2);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 70);
      const lines = doc.splitTextToSize(note.text, COL - 38);
      doc.text(lines, MARGIN + 30, y + 2);
      y += Math.max(10, lines.length * 4.8 + 4);
    });
  }

  /* ── Pie de página ── */
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setTextColor(155, 158, 170); doc.setFont('helvetica', 'normal');
    doc.text(`CAMELIA · Informe Maestro · Impacthón 2026 · Página ${p} de ${total}`, MARGIN, 290);
    doc.text('Generado automáticamente. No sustituye criterio experto.', W - MARGIN, 290, { align: 'right' });
    doc.setDrawColor(195, 200, 212); doc.setLineWidth(0.2);
    doc.line(MARGIN, 287, W - MARGIN, 287);
  }

  const filename = `CAMELIA_Maestro_${(meta.protein_name || 'proteina').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTE AIReport
══════════════════════════════════════════════════════════════════════════════ */
export default function AIReport({ data, savedAnnotations = [], jobId = '', viewerImage }) {
  const [reportData, setReportData] = useState(null);   // { summary, verdict, verdictLabel }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = async () => {
    if (!data) return;
    setLoading(true); setError(null);
    try {
      const result = await generateBiologyReport(data, jobId);
      setReportData(result);
    } catch (err) {
      setError(err.message || 'Error al generar el análisis de IA');
    } finally {
      setLoading(false);
    }
  };

  /* Activar automáticamente descomentando: */
  useEffect(() => {
    // fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, jobId]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { generateMasterPDF({ data, reportData, savedAnnotations, viewerImage }); }
    catch (e) { console.error('Error generando PDF:', e); }
    finally { setPdfLoading(false); }
  };

  if (!data) return null;

  /* Indicadores rápidos */
  const plddt = data.structural_data?.confidence?.plddt_mean || 0;
  const sol = data.biological_data?.solubility_score || 0;
  const insta = data.biological_data?.instability_index || 0;

  const STATUS = {
    plddt: plddt > 80 ? { label: 'Excelente', col: '#10b981' } : plddt > 60 ? { label: 'Bueno', col: '#3b82f6' } : { label: 'Bajo', col: '#f59e0b' },
    sol: sol > 50 ? { label: 'Soluble', col: '#10b981' } : { label: 'Insoluble', col: '#ef4444' },
    insta: insta < 40 ? { label: 'Estable', col: '#10b981' } : { label: 'Inestable', col: '#ef4444' },
  };

  const isPromising = reportData?.verdictLabel === 'Prometedora';
  const verdictColor = isPromising ? '#10b981' : '#ef4444';
  const verdictBg = isPromising ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)';
  const verdictBorder = isPromising ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)';
  const VerdictIcon = isPromising ? TrendingUp : AlertTriangle;

  /* ── Render ── */
  return (
    <div style={{
      padding: '1.5rem', marginTop: '0.25rem',
      background: 'rgba(10,11,20,.88)',
      border: '1px solid rgba(255,255,255,.05)',
      borderRadius: '16px',
      backdropFilter: 'blur(14px)',
    }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={17} color="#fbbf24" fill="#fbbf24" /> Traductor de Biología (IA)
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!loading && (
            <button onClick={fetchReport} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              color: '#9ca3af', padding: '0.4rem 0.8rem', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <RefreshCw size={12} /> Regenerar
            </button>
          )}
          <button onClick={handleDownloadPDF} disabled={pdfLoading} style={{
            background: pdfLoading ? 'rgba(99,102,241,.35)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: '1px solid rgba(139,92,246,.35)', color: 'white',
            padding: '0.4rem 0.9rem', borderRadius: '8px',
            cursor: pdfLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            boxShadow: pdfLoading ? 'none' : '0 0 14px rgba(99,102,241,.3)',
            transition: 'all 0.2s',
          }}>
            {pdfLoading
              ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generando…</>
              : <><Download size={13} /> Informe Maestro</>
            }
          </button>
        </div>
      </div>

      {/* Indicadores rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.2rem' }}>
        <QuickPill icon={<Activity size={13} />} label="Confianza" value={STATUS.plddt.label} color={STATUS.plddt.col} />
        <QuickPill icon={<Droplets size={13} />} label="Solubilidad" value={STATUS.sol.label} color={STATUS.sol.col} />
        <QuickPill icon={<ShieldAlert size={13} />} label="Estabilidad" value={STATUS.insta.label} color={STATUS.insta.col} />
      </div>

      {/* Texto del análisis IA */}
      <div style={{
        background: 'rgba(0,0,0,.2)', padding: '1.1rem',
        borderRadius: '10px', border: '1px solid rgba(255,255,255,.03)',
        marginBottom: reportData?.verdict ? '1.1rem' : 0,
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#6b7280', fontSize: '0.88rem' }}>
            <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analizando con IA…
          </div>
        ) : error ? (
          <div style={{ color: '#f87171', fontSize: '0.88rem' }}>⚠️ {error}</div>
        ) : reportData?.summary ? (
          <p style={{ margin: 0, color: '#d1d5db', lineHeight: '1.75', fontSize: '0.93rem' }}>
            {reportData.summary}
          </p>
        ) : (
          <p style={{ margin: 0, color: '#4b5563', fontSize: '0.88rem', fontStyle: 'italic' }}>
            Pulsa «Regenerar» para obtener el análisis de IA.
          </p>
        )}
      </div>

      {/* ── Veredicto Final de Viabilidad ─────────────────────────────────── */}
      {reportData?.verdict && (
        <div style={{
          background: verdictBg, border: `1px solid ${verdictBorder}`,
          borderRadius: '12px', padding: '1rem 1.15rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
        }}>
          {/* Ícono */}
          <div style={{
            background: verdictBg, border: `1px solid ${verdictBorder}`,
            borderRadius: '50%', width: 36, height: 36, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <VerdictIcon size={18} color={verdictColor} />
          </div>
          {/* Texto */}
          <div>
            <div style={{ fontSize: '0.63rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.2rem' }}>
              Veredicto Final de Viabilidad
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: verdictColor, marginBottom: '0.2rem' }}>
              {reportData.verdictLabel}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {isPromising
                ? 'Los parámetros de confianza y estabilidad son compatibles con la síntesis de laboratorio.'
                : 'Se recomienda descartar o refinar el modelo antes de proceder a síntesis.'}
            </div>
          </div>
        </div>
      )}

      {/* Nota de anotaciones */}
      {savedAnnotations.length > 0 && (
        <div style={{
          marginTop: '1rem', padding: '0.5rem 0.85rem',
          background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.14)',
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <FileText size={12} color="#818cf8" />
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>
            El Informe Maestro incluirá {savedAnnotations.length} anotación{savedAnnotations.length !== 1 ? 'es' : ''} del visor 3D.
          </span>
        </div>
      )}
    </div>
  );
}

function QuickPill({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.03)', padding: '0.7rem',
      borderRadius: '10px', border: '1px solid rgba(255,255,255,.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6b7280', fontSize: '0.66rem', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.06em' }}>
        {icon} {label}
      </div>
      <div style={{ color, fontWeight: 700, fontSize: '0.88rem' }}>{value}</div>
    </div>
  );
}