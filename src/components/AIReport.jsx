import { useState, useEffect } from 'react';
import {
  Loader, RefreshCw, Activity, Droplets, ShieldAlert,
  Zap, Download, FileText, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { generateBiologyReport } from '../services/aiService';
import { jsPDF } from 'jspdf';

/* ══════════════════════════════════════════════════════════════════════════════
   GENERACIÓN DEL INFORME MAESTRO PDF
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

  /* ── 1.1 Visualización 3D ── */
  if (viewerImage) {
    checkY(85);
    doc.setFontSize(11); doc.setTextColor(99, 102, 241);
    doc.text('1.1 Visualización Estructural 3D', MARGIN, y);
    y += 7;
    const newWidth = 100;
    const newHeight = 80;
    const centerX = (W / 2) - (newWidth / 2);
    doc.addImage(viewerImage, 'PNG', centerX, y, newWidth, newHeight, undefined, 'FAST');
    y += newHeight + 12;
  }

  const sectionTitle = (num, text, r, g, b) => {
    checkY(18);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b);
    doc.text(`${num}. ${text}`, MARGIN, y); y += 6;
    doc.setDrawColor(r, g, b); doc.setLineWidth(0.3);
    doc.line(MARGIN, y, W - MARGIN, y); y += 6;
  };

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

  sectionTitle('1', 'Identificación de la Proteína', 59, 130, 246);
  kv('Nombre', meta.protein_name);
  kv('Organismo', meta.organism);
  kv('UniProt', meta.uniprot_id);
  kv('PDB ID', meta.pdb_id);
  y += 4;

  sectionTitle('2', 'Métricas de Confianza Estructural', 16, 185, 129);
  kv('pLDDT Medio', conf.plddt_mean, 44);
  kv('PAE Medio (Å)', conf.mean_pae, 44);
  kv('Solubilidad', `${bio.solubility_score ?? 'N/A'} / 100 — ${bio.solubility_prediction ?? ''}`, 44);
  kv('Inestabilidad', `${bio.instability_index ?? 'N/A'} — ${bio.stability_status ?? ''}`, 44);
  y += 4;

  sectionTitle('3', 'Análisis del Traductor de Biología (IA)', 239, 68, 68);
  if (reportData?.summary) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(40, 40, 55);
    doc.splitTextToSize(reportData.summary, COL).forEach(line => {
      checkY(5.5); doc.text(line, MARGIN, y); y += 5.2;
    });
  } else {
    doc.text('Análisis de IA no disponible.', MARGIN, y); y += 5.5;
  }
  y += 6;

  /* ── 5. VEREDICTO FINAL (DISEÑO VERTICAL ANTI-SOLAPAMIENTO) ── */
  const isPromising = reportData?.verdictLabel === 'Prometedora';
  const vRGB = isPromising ? [16, 185, 129] : [239, 68, 68];
  const vBgRGB = isPromising ? [228, 255, 244] : [255, 232, 232];
  sectionTitle('4', 'Veredicto Final de Viabilidad', ...vRGB);

  checkY(30);
  doc.setFillColor(...vBgRGB);
  doc.roundedRect(MARGIN, y - 4, COL, 22, 3, 3, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...vRGB);
  doc.text(`${isPromising ? 'V' : '!'} ${reportData?.verdictLabel ?? 'No disponible'}`, MARGIN + 6, y + 4);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(75, 80, 100);
  const descriptionText = isPromising
    ? 'Candidata para síntesis. Confianza y estabilidad aceptables para continuar.'
    : 'Descartar o refinar. Parámetros insuficientes para síntesis segura.';

  doc.text(descriptionText, MARGIN + 6, y + 12); // Puesta debajo para evitar solapamiento
  y += 28;

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setTextColor(155, 158, 170);
    doc.text(`CAMELIA · Informe Maestro · Impacthón 2026 · Página ${p} de ${total}`, MARGIN, 290);
    doc.line(MARGIN, 287, W - MARGIN, 287);
  }

  const filename = `CAMELIA_Maestro_${(meta.protein_name || 'proteina').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(filename);
}

export default function AIReport({ data, savedAnnotations = [], jobId = '', viewerRef }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    if (!data) return;
    setLoading(true); setError(null);
    try {
      const result = await generateBiologyReport(data, jobId);
      setReportData(result);
    } catch (err) {
      setError(err.message || 'Error al conectar con la IA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data && !reportData && !loading) fetchReport();
  }, [data, jobId]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Capturamos la imagen justo al hacer clic para evitar errores de renderizado
      const imgCapturada = viewerRef?.current?.getScreenshot?.() || null;
      generateMasterPDF({ data, reportData, savedAnnotations, viewerImage: imgCapturada });
    }
    catch (e) { console.error('Error generando PDF:', e); }
    finally { setPdfLoading(false); }
  };

  if (!data) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={17} color="#fbbf24" fill="#fbbf24" /> Traductor de Biología (IA)
        </h3>
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading || loading}
          className="btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {pdfLoading ? <Loader className="animate-spin" size={14} /> : <Download size={14} />}
          {pdfLoading ? 'Generando...' : 'Informe Maestro'}
        </button>
      </div>
      <div style={{ background: 'rgba(0,0,0,.2)', padding: '1rem', borderRadius: '8px', color: '#d1d5db', fontSize: '0.9rem' }}>
        {loading ? 'Analizando con Gemini 2.0...' : error ? `Error: ${error}` : reportData?.summary}
      </div>
    </div>
  );
}