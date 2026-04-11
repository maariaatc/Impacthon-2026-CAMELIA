/**
 * @file apiService.js
 * @description Servicio de integración con la API del CESGA Finis Terrae III
 *              para el envío de trabajos de predicción de proteínas con AlphaFold2.
 *
 * PERSONA 3 – API SUBMIT (CRÍTICO)
 * Equipo Hackathon | Portal Web AlphaFold2 × CESGA
 *
 * USO (para la Persona 6 – Integrador):
 *   import { submitJob, mockSubmitJob } from './apiService';
 *
 *   // En producción:
 *   const result = await submitJob({ fastaSequence, fastaFilename, gpus, memoryGb });
 *
 *   // En desarrollo (sin red real):
 *   const result = await mockSubmitJob({ fastaSequence, fastaFilename });
 */

import axios from 'axios';

// ---------------------------------------------------------------------------
// ⚙️  CONFIGURACIÓN CENTRAL
// Cambia aquí para afectar a toda la aplicación sin tocar la lógica.
// ---------------------------------------------------------------------------

/** URL base del servidor mock desplegado en Render (tier gratuito). */
const API_BASE_URL = 'https://api-mock-cesga.onrender.com';

/**
 * Timeout en milisegundos.
 * Render (tier gratuito) puede tardar hasta ~40 s en el "cold start"
 * (primer arranque tras un periodo de inactividad). 60 s da margen suficiente.
 */
const TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// 🔧  INSTANCIA DE AXIOS
// Centraliza headers, baseURL y timeout para que todas las llamadas los hereden.
// ---------------------------------------------------------------------------

/**
 * Instancia preconfigurada de Axios.
 * No usar `axios` directamente en el resto del código; usar siempre `apiClient`.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// 📦  FUNCIÓN PRINCIPAL: submitJob
// ---------------------------------------------------------------------------

/**
 * Envía un trabajo de predicción de proteínas al servidor CESGA.
 *
 * @async
 * @function submitJob
 *
 * @param {object}  params               - Parámetros del trabajo.
 * @param {string}  params.fastaSequence - Secuencia de aminoácidos en formato FASTA.
 *                                         Debe incluir la cabecera `>identifier` y
 *                                         la secuencia en la/s línea/s siguientes.
 * @param {string}  params.fastaFilename - Nombre del archivo .fasta (ej. "proteina1.fasta").
 * @param {number}  [params.gpus=1]      - Número de GPUs a reservar (por defecto: 1).
 * @param {number}  [params.memoryGb=16] - Memoria RAM en GB a reservar (por defecto: 16).
 *
 * @returns {Promise<{job_id: string, status: string}>}
 *   Objeto con el ID del trabajo creado y su estado inicial.
 *
 * @throws {ApiError} Error tipificado con `code` y `userMessage` listos para mostrar en UI.
 *
 * @example
 * const { job_id, status } = await submitJob({
 *   fastaSequence: '>seq1\nMKTAYIAKQRQISFVKS...',
 *   fastaFilename: 'hemoglobina.fasta',
 *   gpus: 2,
 *   memoryGb: 32,
 * });
 * console.log(`Trabajo creado: ${job_id} | Estado: ${status}`);
 */
export async function submitJob({
  fastaSequence,
  fastaFilename,
  gpus = 1,
  memoryGb = 16,
}) {
  // --- Validación local (evita un viaje de red innecesario) ----------------
  const localValidation = validateFasta(fastaSequence, fastaFilename);
  if (!localValidation.valid) {
    throw new ApiError('VALIDATION_ERROR', localValidation.message);
  }

  // --- Construcción del body según contrato de la API ---------------------
  const requestBody = {
    fasta_sequence: fastaSequence,   // string – secuencia FASTA completa
    fasta_filename: fastaFilename,   // string – nombre del archivo
    gpus,                            // number – GPUs a usar
    memory_gb: memoryGb,             // number – RAM en GB
  };

  try {
    // -----------------------------------------------------------------------
    // 🚀  LLAMADA HTTP
    // Axios lanza una excepción si el código HTTP no es 2xx,
    // por lo que el `catch` manejará tanto errores de red como errores HTTP.
    // -----------------------------------------------------------------------
    console.info('[apiService] Enviando trabajo al CESGA…', {
      filename: fastaFilename,
      gpus,
      memoryGb,
      timeoutMs: TIMEOUT_MS,
    });

    const response = await apiClient.post('/jobs/submit', requestBody);

    // Respuesta exitosa (2xx)
    const { job_id, status } = response.data;

    console.info(`[apiService] ✅ Trabajo aceptado | job_id=${job_id} | status=${status}`);

    return { job_id, status };

  } catch (error) {
    // -----------------------------------------------------------------------
    // 🔥  MANEJO DE ERRORES ESPECÍFICOS
    // -----------------------------------------------------------------------

    // A) El servidor respondió con un código HTTP de error (4xx / 5xx)
    if (error.response) {
      const { status, data } = error.response;

      // 422 Unprocessable Entity → secuencia FASTA inválida según el servidor
      if (status === 422) {
        const serverDetail = data?.detail || 'El servidor rechazó la secuencia FASTA.';
        console.error(`[apiService] 422 FASTA inválido:`, serverDetail);
        throw new ApiError(
          'INVALID_FASTA',
          `La secuencia FASTA no es válida. Revisa el formato e inténtalo de nuevo. (Detalle: ${serverDetail})`
        );
      }

      // 500+ → error interno del servidor
      if (status >= 500) {
        console.error(`[apiService] Error del servidor (${status}):`, data);
        throw new ApiError(
          'SERVER_ERROR',
          `El servidor del CESGA ha devuelto un error interno (${status}). Por favor, inténtalo en unos minutos.`
        );
      }

      // Cualquier otro error HTTP (400, 401, 403, 404…)
      console.error(`[apiService] Error HTTP (${status}):`, data);
      throw new ApiError(
        'HTTP_ERROR',
        `La solicitud fue rechazada por el servidor con código ${status}. Contacta con el equipo técnico.`
      );
    }

    // B) No hubo respuesta → problema de red o el servidor no contestó a tiempo
    if (error.request) {
      // Distinguimos timeout de otros fallos de red
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('[apiService] ⏱️  Timeout tras', TIMEOUT_MS, 'ms');
        throw new ApiError(
          'TIMEOUT',
          `El servidor no respondió en ${TIMEOUT_MS / 1000} segundos. `
          + 'Es posible que esté iniciando (cold start). '
          + 'Espera unos segundos y vuelve a intentarlo.'
        );
      }

      console.error('[apiService] 🌐 Error de red:', error.message);
      throw new ApiError(
        'NETWORK_ERROR',
        'No se pudo conectar con el servidor. '
        + 'Comprueba tu conexión a Internet e inténtalo de nuevo.'
      );
    }

    // C) Error inesperado en la configuración de la petición o en nuestro código
    console.error('[apiService] ❓ Error inesperado:', error.message);
    throw new ApiError(
      'UNKNOWN_ERROR',
      `Ha ocurrido un error inesperado: ${error.message}. Contacta con el equipo técnico.`
    );
  }
}

// ---------------------------------------------------------------------------
// 🧪  FUNCIÓN MOCK: mockSubmitJob
// ---------------------------------------------------------------------------

/**
 * Simula el envío de un trabajo devolviendo una respuesta exitosa tras 2 segundos.
 * Úsala durante el desarrollo cuando el equipo de UI no quiera depender de la red real.
 *
 * Reproduce el mismo contrato de entrada/salida que `submitJob`, por lo que
 * cambiar de mock a producción es tan simple como cambiar el import.
 *
 * @async
 * @function mockSubmitJob
 *
 * @param {object}  params               - Mismos parámetros que `submitJob`.
 * @param {string}  params.fastaSequence
 * @param {string}  params.fastaFilename
 * @param {number}  [params.gpus=1]
 * @param {number}  [params.memoryGb=16]
 *
 * @returns {Promise<{job_id: string, status: string}>} Respuesta simulada.
 *
 * @example
 * // En el componente de React (modo desarrollo):
 * const result = await mockSubmitJob({ fastaSequence: '...', fastaFilename: 'test.fasta' });
 */
export async function mockSubmitJob({
  fastaSequence,
  fastaFilename,
  gpus = 1,
  memoryGb = 16,
}) {
  console.info('[apiService][MOCK] 🔵 Simulando envío de trabajo…', {
    fastaFilename,
    gpus,
    memoryGb,
    sequenceLength: fastaSequence?.length ?? 0,
  });

  // Simula la latencia de red (2 segundos)
  await delay(2000);

  const mockResponse = {
    job_id: `mock-job-${Date.now()}`,
    status: 'queued',
  };

  console.info('[apiService][MOCK] ✅ Respuesta simulada:', mockResponse);
  return mockResponse;
}

// ---------------------------------------------------------------------------
// 🛠️  UTILIDADES INTERNAS
// (No se exportan; sólo para uso dentro de este módulo.)
// ---------------------------------------------------------------------------

/**
 * Valida el formato básico de una secuencia FASTA antes de enviarla.
 * Esta validación es local y no sustituye a la validación del servidor.
 *
 * Reglas comprobadas:
 *  1. La cadena no puede estar vacía.
 *  2. El nombre de archivo no puede estar vacío.
 *  3. La secuencia debe contener al menos una cabecera FASTA (`>...`).
 *  4. Tras la cabecera debe haber al menos una línea de secuencia no vacía.
 *
 * @param  {string} sequence - Secuencia FASTA.
 * @param  {string} filename - Nombre del archivo.
 * @returns {{ valid: boolean, message: string }}
 */
function validateFasta(sequence, filename) {
  if (!sequence || sequence.trim() === '') {
    return { valid: false, message: 'La secuencia FASTA no puede estar vacía.' };
  }

  if (!filename || filename.trim() === '') {
    return { valid: false, message: 'El nombre del archivo no puede estar vacío.' };
  }

  const lines = sequence.trim().split('\n').map(l => l.trim()).filter(Boolean);

  if (!lines[0].startsWith('>')) {
    return {
      valid: false,
      message: 'Formato FASTA incorrecto: la primera línea debe comenzar con ">" (p. ej. ">mi_proteina").',
    };
  }

  const hasSequenceLines = lines.slice(1).some(l => !l.startsWith('>') && l.length > 0);
  if (!hasSequenceLines) {
    return {
      valid: false,
      message: 'Formato FASTA incorrecto: no se encontró ninguna línea de secuencia tras la cabecera.',
    };
  }

  return { valid: true, message: 'OK' };
}

/**
 * Devuelve una promesa que se resuelve tras `ms` milisegundos.
 * Útil para simular latencia en el mock.
 *
 * @param  {number} ms - Milisegundos a esperar.
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// 🏷️  CLASE DE ERROR PERSONALIZADA
// ---------------------------------------------------------------------------

/**
 * Error personalizado para el servicio de API.
 * Incluye un `code` legible por máquina y un `userMessage` listo para la UI.
 *
 * @class ApiError
 * @extends {Error}
 *
 * @property {string} code        - Código interno del error (ej. 'TIMEOUT', 'INVALID_FASTA').
 * @property {string} userMessage - Mensaje amigable para mostrar al usuario en la UI.
 *
 * @example
 * try {
 *   await submitJob(...);
 * } catch (err) {
 *   if (err instanceof ApiError) {
 *     // Muestra err.userMessage en la UI
 *     // Loguea err.code en el sistema de tracking
 *   }
 * }
 */
export class ApiError extends Error {
  /**
   * @param {string} code        - Código interno del error.
   * @param {string} userMessage - Mensaje amigable para la UI.
   */
  constructor(code, userMessage) {
    super(userMessage);
    this.name = 'ApiError';
    this.code = code;
    this.userMessage = userMessage;
  }
}