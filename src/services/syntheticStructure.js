/**
 * syntheticStructure.js
 *
 * Genera un PDB completo (backbone N·CA·C·O por residuo) en α-hélice ideal
 * para que 3Dmol.js pueda renderizarlo en modo cartoon sin datos reales.
 */

const AA1TO3 = {
    A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS',
    Q: 'GLN', E: 'GLU', G: 'GLY', H: 'HIS', I: 'ILE',
    L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO',
    S: 'SER', T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL',
};

function res3(letter) {
    return AA1TO3[letter?.toUpperCase()] || 'ALA';
}

function fmtCoord(n) {
    return n.toFixed(3).padStart(8);
}

/**
 * Genera un PDB con backbone completo N-CA-C-O en α-hélice ideal.
 * 3Dmol necesita al menos N + CA + C + O para trazar el ribbon/cartoon.
 */
export function buildSyntheticPDB(sequence = '') {
    if (!sequence) return null;

    const seq = sequence.replace(/\s/g, '').toUpperCase().slice(0, 2000);
    const lines = [];
    const conect = [];

    lines.push('REMARK  CAMELIA – Estructura sintética (alfa-helice ideal)');
    lines.push('REMARK  Generada algorítmicamente. No representa coordenadas reales.');
    lines.push('REMARK  Backbone N-CA-C-O completo para visualización 3D.');

    const rCA = 2.3;
    const rise = 1.5;
    const dAngle = (100 * Math.PI) / 180;

    // Desplazamientos locales respecto al CA para cada átomo del backbone
    const offsets = {
        N: { dr: -0.5, dTheta: -0.3, dz: -0.6 },
        CA: { dr: 0.0, dTheta: 0.0, dz: 0.0 },
        C: { dr: 0.5, dTheta: 0.3, dz: 0.6 },
        O: { dr: 1.2, dTheta: 0.5, dz: 0.5 },
    };

    const atomOrder = ['N', 'CA', 'C', 'O'];
    let serial = 1;
    const serialMap = {};

    seq.split('').forEach((letter, ri) => {
        const resi = ri + 1;
        const resn = res3(letter);
        const theta0 = ri * dAngle;
        const z0 = ri * rise;

        atomOrder.forEach(atomName => {
            const off = offsets[atomName];
            const r = rCA + off.dr;
            const theta = theta0 + off.dTheta;
            const z = z0 + off.dz;

            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);

            const element = atomName === 'N' ? 'N'
                : atomName === 'O' ? 'O'
                    : 'C';

            // Nombre de átomo en columnas PDB (cols 13-16)
            const nameFmt = (' ' + atomName).padEnd(4);

            lines.push(
                'ATOM  ' +
                String(serial).padStart(5) +
                ' ' +
                nameFmt +
                ' ' +
                resn +
                ' A' +
                String(resi).padStart(4) +
                '    ' +
                fmtCoord(x) +
                fmtCoord(y) +
                fmtCoord(z) +
                '  1.00 50.00          ' +
                element.padStart(2)
            );

            serialMap[`${ri}-${atomName}`] = serial;
            serial++;
        });
    });

    // CONECT: enlaces covalentes del backbone
    for (let ri = 0; ri < seq.length; ri++) {
        const sN = serialMap[`${ri}-N`];
        const sCA = serialMap[`${ri}-CA`];
        const sC = serialMap[`${ri}-C`];
        const sO = serialMap[`${ri}-O`];

        conect.push(`CONECT${String(sN).padStart(5)}${String(sCA).padStart(5)}`);
        conect.push(`CONECT${String(sCA).padStart(5)}${String(sC).padStart(5)}`);
        conect.push(`CONECT${String(sC).padStart(5)}${String(sO).padStart(5)}`);

        if (ri + 1 < seq.length) {
            const sNnext = serialMap[`${ri + 1}-N`];
            conect.push(`CONECT${String(sC).padStart(5)}${String(sNnext).padStart(5)}`);
        }
    }

    lines.push(...conect);
    lines.push('END');
    return lines.join('\n');
}

/**
 * Genera scores pLDDT sintéticos (distribución baja-media).
 */
export function buildSyntheticConfidence(length = 0) {
    if (!length) return [];
    return Array.from({ length }, (_, i) => {
        const base = 42 + 18 * Math.sin((i / length) * Math.PI * 3);
        const noise = Math.sin(i * 17.3) * 8;
        return Math.min(72, Math.max(20, base + noise));
    });
}

/**
 * Objeto structural_data completo para el Dashboard cuando protein_metadata === null.
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
            mean_pae: null,
            plddt_histogram: [],
        },
    };
}