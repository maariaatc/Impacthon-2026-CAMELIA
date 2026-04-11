/**
 * syntheticStructure.js
 *
 * Genera un fichero PDB mínimo y datos de confianza sintéticos a partir de
 * una secuencia de aminoácidos. La cadena se construye como una α-hélice
 * ideal (paso 1.5 Å, rotación 100°) para que 3Dmol.js pueda renderizarla.
 *
 * USO:
 *   import { buildSyntheticPDB, buildSyntheticConfidence } from './syntheticStructure';
 *   const pdbText   = buildSyntheticPDB(sequence);
 *   const plddt     = buildSyntheticConfidence(sequence.length);
 */

/* ─── Tabla de aminoácidos (código 1-letra → nombre 3-letras) ──────────── */
const AA1TO3 = {
    A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS',
    Q: 'GLN', E: 'GLU', G: 'GLY', H: 'HIS', I: 'ILE',
    L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO',
    S: 'SER', T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL',
    // no-estándar → alanina por defecto
};

function resName(letter) {
    return AA1TO3[letter.toUpperCase()] || 'ALA';
}

/**
 * Construye un PDB de α-hélice ideal para la secuencia dada.
 * Devuelve un string con formato PDB estándar.
 */
export function buildSyntheticPDB(sequence = '') {
    if (!sequence) return null;

    // Limitamos a 2500 residuos para no saturar el visor
    const seq = sequence.replace(/\s/g, '').toUpperCase().slice(0, 2500);

    const lines = [];
    lines.push('REMARK  CAMELIA – Estructura sintética (α-hélice ideal)');
    lines.push('REMARK  Generada algorítmicamente a partir de la secuencia FASTA');
    lines.push('REMARK  No representa coordenadas reales de la proteína');

    // Parámetros de α-hélice ideal
    const rise = 1.5;    // Å por residuo en el eje Z
    const radius = 2.3;    // Å del radio helicoidal
    const deltaAngle = (100 * Math.PI) / 180; // 100° por residuo

    let atomSerial = 1;

    seq.split('').forEach((letter, idx) => {
        const resi = idx + 1;
        const angle = idx * deltaAngle;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = idx * rise;
        const res3 = resName(letter);

        // CA (carbono alfa) — suficiente para cartoon en 3Dmol
        lines.push(
            'ATOM  ' +
            String(atomSerial).padStart(5) +
            '  CA  ' +
            res3 +
            ' A' +
            String(resi).padStart(4) +
            '    ' +
            x.toFixed(3).padStart(8) +
            y.toFixed(3).padStart(8) +
            z.toFixed(3).padStart(8) +
            '  1.00  0.00           C  '
        );
        atomSerial++;
    });

    lines.push('END');
    return lines.join('\n');
}

/**
 * Genera un array de scores pLDDT sintéticos (distribución realista baja-media)
 * para indicar visualmente que se trata de datos no reales.
 */
export function buildSyntheticConfidence(length = 0) {
    if (!length) return [];

    // Usamos una sinusoide + ruido para imitar el patrón de baja confianza
    return Array.from({ length }, (_, i) => {
        const base = 42 + 18 * Math.sin((i / length) * Math.PI * 3);
        const noise = (Math.sin(i * 17.3) * 8);   // pseudo-aleatorio determinista
        return Math.min(72, Math.max(20, base + noise));
    });
}

/**
 * Construye un objeto structural_data sintético compatible con el Dashboard.
 * Se usa cuando la API devuelve protein_metadata === null.
 */
export function buildSyntheticStructuralData(sequence = '') {
    const plddt_per_residue = buildSyntheticConfidence(sequence.length);
    const plddt_mean = plddt_per_residue.length
        ? plddt_per_residue.reduce((a, b) => a + b, 0) / plddt_per_residue.length
        : 0;

    return {
        pdb_file: buildSyntheticPDB(sequence),
        cif_file: null,
        confidence: {
            plddt_mean,
            plddt_max: Math.max(...plddt_per_residue),
            plddt_min: Math.min(...plddt_per_residue),
            plddt_per_residue,
            mean_pae: null,   // no disponible en sintético
            plddt_histogram: [],
        },
    };
}