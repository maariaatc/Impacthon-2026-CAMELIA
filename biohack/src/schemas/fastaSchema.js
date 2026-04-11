import { z } from 'zod'

const VALID_AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWY]+$/i

export const fastaSchema = z.object({
  fasta_filename: z
    .string()
    .min(1, 'El nombre de archivo no puede estar vacío.')
    .refine(
      (val) => val.endsWith('.fasta'),
      'El archivo debe tener extensión .fasta'
    ),

  fasta_sequence: z
    .string()
    .min(1, 'La secuencia no puede estar vacía.')
    .refine(
      (val) => val.trimStart().startsWith('>'),
      "La secuencia FASTA debe comenzar con '>' (cabecera)."
    )
    .refine((val) => {
      const lines = val.split('\n')
      const sequenceLines = lines
        .slice(1)
        .map((l) => l.trim())
        .filter(Boolean)
      if (sequenceLines.length === 0) return false
      const sequence = sequenceLines.join('')
      return VALID_AMINO_ACIDS.test(sequence)
    }, 'Solo se permiten aminoácidos canónicos: ACDEFGHIKLMNPQRSTVWY.'),
})