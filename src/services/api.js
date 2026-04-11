const API_BASE_URL = 'https://api-mock-cesga.onrender.com';

/**
 * Traduce mensajes de error de la API al castellano con explicaciones claras.
 */
function traducirErrorApi(msg) {
  const m = msg.toLowerCase();

  if (m.includes('fasta must contain a header') || m.includes('header and at least one sequence')) {
    return 'Formato FASTA incorrecto: la secuencia debe comenzar con una línea de cabecera (p. ej. ">Mi_proteina") seguida de los aminoácidos en la línea siguiente.';
  }
  if (m.includes('fasta') && m.includes('sequence')) {
    return 'La secuencia FASTA no es válida. Asegúrate de incluir una cabecera (">...") y al menos una línea con aminoácidos.';
  }
  if (m.includes('gpus') || m.includes('cpus') || m.includes('memory')) {
    return 'Los recursos solicitados (GPUs, CPUs o memoria) están fuera del rango permitido por el clúster.';
  }
  if (m.includes('too long') || m.includes('max length') || m.includes('sequence length')) {
    return 'La secuencia es demasiado larga. El límite máximo aceptado por el simulador CESGA es de 2500 aminoácidos.';
  }
  if (m.includes('invalid character') || m.includes('invalid amino')) {
    return 'La secuencia contiene caracteres no válidos. Usa sólo el código de una letra para aminoácidos (A, C, D, E, F, G, H, I, K, L, M, N, P, Q, R, S, T, V, W, Y).';
  }
  if (m.includes('unauthorized') || m.includes('401')) {
    return 'No estás autorizado para realizar esta operación. Comprueba tus credenciales de acceso al clúster.';
  }
  if (m.includes('timeout') || m.includes('timed out')) {
    return 'El servidor CESGA tardó demasiado en responder. Inténtalo de nuevo en unos instantes.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'No se pudo conectar con el servidor CESGA. Comprueba tu conexión a internet e inténtalo de nuevo.';
  }

  // Si no reconocemos el error, devolvemos un mensaje genérico en castellano
  return `Error al enviar el trabajo al clúster: ${msg}`;
}

/**
 * Fetch sample protein sequences
 */
export async function getProteinSamples() {
  const res = await fetch(`${API_BASE_URL}/proteins/samples`);
  if (!res.ok) throw new Error('Error fetching protein samples');
  return res.json();
}

/**
 * Submit a new prediction job
 */
export async function submitJob(jobData, filename = 'custom.fasta') {
  const payload = {
    fasta_sequence: typeof jobData === 'string' ? jobData : jobData.fasta,
    fasta_filename: filename,
    gpus: jobData.gpus !== undefined ? jobData.gpus : 1,
    cpus: jobData.cpus !== undefined ? jobData.cpus : 8,
    memory_gb: jobData.ram !== undefined ? jobData.ram : 32.0,
  };

  const res = await fetch(`${API_BASE_URL}/jobs/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    const rawMsg = err.detail?.[0]?.msg || JSON.stringify(err.detail) || '';
    throw new Error(traducirErrorApi(rawMsg));
  }

  return res.json();
}

/**
 * Check the status of a job (PENDING, RUNNING, COMPLETED, FAILED)
 */
export async function checkJobStatus(jobId) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`);
  if (!res.ok) throw new Error('Error checking job status');
  return res.json();
}

/**
 * Get results of a completed job
 */
export async function getJobOutputs(jobId) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/outputs`);
  if (!res.ok) throw new Error('Error getting job outputs');
  return res.json();
}

/**
 * Get HPC accounting info for a job
 */
export async function getJobAccounting(jobId) {
  const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/accounting`);
  if (!res.ok) throw new Error('Error getting job accounting info');
  return res.json();
}