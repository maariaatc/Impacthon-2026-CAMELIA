const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/* ─── Los 22 nodos oficiales del clúster CESGA FinisTerrae III ────────────────
   Convención de jobId: "<nodo>-<resto>", ej: "ft3-node05-CAMELIA-0045"
   Si el jobId contiene alguno de estos prefijos, los datos estructurales son
   reales y de alta confianza → la IA los usa directamente.
   En caso contrario se activa el modo de Inferencia Dinámica.              */
const CESGA_NODES = new Set([
  'ft3-node01', 'ft3-node02', 'ft3-node03', 'ft3-node04', 'ft3-node05',
  'ft3-node06', 'ft3-node07', 'ft3-node08', 'ft3-node09', 'ft3-node10',
  'ft3-node11', 'ft3-node12', 'ft3-node13', 'ft3-node14', 'ft3-node15',
  'ft3-node16', 'ft3-node17', 'ft3-node18', 'ft3-node19', 'ft3-node20',
  'ft3-node21', 'ft3-node22',
]);

/** Devuelve true si el jobId pertenece a un nodo oficial CESGA */
export function isOfficialCESGAJob(jobId = '') {
  return [...CESGA_NODES].some(node => jobId.includes(node));
}

/**
 * Genera el análisis bioinformático completo.
 *
 * Retorna: { summary: string, verdict: string, verdictLabel: 'Prometedora' | 'Riesgosa' }
 *
 * Lógica híbrida:
 *  - CESGA oficial → usa los datos reales del JSON (pLDDT, PAE, solubilidad…)
 *  - Proteína nueva → infiere propiedades desde la secuencia de aminoácidos;
 *    si la secuencia es de baja calidad la IA lo refleja con valores bajos.
 */
export async function generateBiologyReport(data = {}, jobId = '') {
  const { structural_data = {}, biological_data = {}, protein_metadata = {} } = data;

  const plddt_mean = structural_data?.confidence?.plddt_mean ?? null;
  const plddt_histogram = structural_data?.confidence?.plddt_histogram ?? [];
  const mean_pae = structural_data?.confidence?.mean_pae ?? null;
  const solubility_score = biological_data?.solubility_score ?? null;
  const instability_index = biological_data?.instability_index ?? null;
  const stability_status = biological_data?.stability_status ?? null;
  const toxicity_alerts = biological_data?.toxicity_alerts ?? [];
  const protein_name = protein_metadata?.protein_name ?? 'Desconocida';
  const organism = protein_metadata?.organism ?? 'Desconocido';
  const sequence = protein_metadata?.sequence ?? '';

  const isCESGA = isOfficialCESGAJob(jobId);

  /* ── Bloque de instrucciones adaptativo ── */
  const dataSourceNote = isCESGA
    ? `FUENTE DE DATOS: Nodo oficial CESGA FinisTerrae III (${jobId}).
Los valores proporcionados son reales y de alta confianza instrumental.
Úsalos directamente para el análisis; NO los estimes ni los sustituyas.`
    : `FUENTE DE DATOS: Proteína nueva / nodo externo (${jobId || 'desconocido'}).
Los valores JSON pueden ser preliminares o estar ausentes (null).
Debes INFERIR activamente solubilidad, estabilidad y confianza
analizando la composición de la secuencia de aminoácidos:
  • Abundancia de D,E,K,R → mayor solubilidad predicha
  • Abundancia de C,P     → mayor estabilidad estructural
  • Regiones repetitivas de bajo complejidad → señal de desorden
  • Si la secuencia es corta (<50 aa) o pobre en información → indica incertidumbre alta
NO inventes valores favorables; sé riguroso aunque el resultado sea negativo.`;

  const sequenceBlock = sequence
    ? `\nSECUENCIA (primeros 200 aa): ${sequence.slice(0, 200)}${sequence.length > 200 ? '…' : ''}\nLongitud total: ${sequence.length} aa`
    : '\nSECUENCIA: No disponible';

  const prompt = `ROL: Eres un experto en bioinformática estructural que comunica resultados complejos a investigadores sin formación computacional. Hablas en español con tono claro y directo.

${dataSourceNote}

TAREA: Analiza la siguiente proteína predicha con AlphaFold2 y devuelve EXCLUSIVAMENTE un objeto JSON con dos campos: "summary" y "verdict".

DATOS:
  Proteína:           ${protein_name} (${organism})
  pLDDT medio:        ${plddt_mean ?? 'N/A'}
  Histograma pLDDT:   ${JSON.stringify(plddt_histogram)}
  PAE medio (Å):      ${mean_pae ?? 'N/A'}
  Solubilidad:        ${solubility_score ?? 'N/A'} / 100
  Índice inestabilidad: ${instability_index ?? 'N/A'} (${stability_status ?? 'desconocido'})
  Alertas toxicidad:  ${toxicity_alerts.length > 0 ? toxicity_alerts.join(', ') : 'ninguna'}${sequenceBlock}

INSTRUCCIONES PARA "summary" (máx. 170 palabras):
  1. Fiabilidad estructural: explica si la estructura es confiable basándote en pLDDT
     (${isCESGA ? 'usa el valor real' : 'infiere a partir de secuencia si pLDDT es null'})
  2. Regiones problemáticas: identifica zonas desordenadas o de baja confianza
  3. Solubilidad y estabilidad: traduce los valores (o inferencias) a implicaciones
     prácticas de laboratorio
  4. Usa frases como "Esta proteína…", "Las regiones con…"; sin tecnicismos innecesarios
  5. NO menciones números crudos; tradúcelos a significado biológico

INSTRUCCIONES PARA "verdict":
  Evalúa conjuntamente: confianza estructural, estabilidad, solubilidad y alertas.
  Devuelve EXACTAMENTE uno de estos dos valores (sin comillas adicionales ni texto):
    "Prometedora"  → si los indicadores sugieren viabilidad para síntesis de laboratorio
    "Riesgosa"     → si hay señales de inestabilidad, baja confianza o toxicidad
  Criterio orientativo (adáptalo según el contexto):
    Prometedora: pLDDT > 70 (o inferencia positiva) AND inestabilidad < 40 AND solubilidad > 45
    Riesgosa: cualquier incumplimiento grave o datos insuficientes sin secuencia compensatoria

FORMATO DE RESPUESTA: JSON puro, sin markdown, sin texto adicional, sin backticks:
{"summary":"...","verdict":"Prometedora"}`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:5173',
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al contactar con OpenRouter');
  }

  const result = await response.json();
  const raw = result.choices?.[0]?.message?.content?.trim() ?? '';

  /* Parsear la respuesta JSON; si el modelo añade backticks los limpiamos */
  try {
    const clean = raw.replace(/```(?:json)?|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const label = parsed.verdict === 'Prometedora' ? 'Prometedora' : 'Riesgosa';
    return { summary: parsed.summary ?? raw, verdict: label, verdictLabel: label };
  } catch {
    /* Fallback: el texto completo como summary, veredicto conservador */
    return { summary: raw, verdict: 'Riesgosa', verdictLabel: 'Riesgosa' };
  }
}