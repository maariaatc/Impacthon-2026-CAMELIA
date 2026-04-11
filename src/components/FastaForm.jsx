import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fastaSchema } from '../schemas/fastaSchema'
import { useFastaDrop } from '../hooks/useFastaDrop'

function FieldBadge({ isValid, isDirty }) {
  if (!isDirty) return null
  return isValid ? (
    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      ✓ Válido
    </span>
  ) : (
    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      ✗ Inválido
    </span>
  )
}

function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
      <span>⚠</span>
      {message}
    </p>
  )
}

export default function FastaForm({ onValidSubmit }) {
  const [samples, setSamples] = useState([])
  const [loadingProtein, setLoadingProtein] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields, isValid },
  } = useForm({
    resolver: zodResolver(fastaSchema),
    mode: 'onChange',
  })

  const sequenceValue = watch('fasta_sequence') || ''
  const aaCount = sequenceValue
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .join('').length

  useEffect(() => {
    fetch('https://api-mock-cesga.onrender.com/proteins/samples')
      .then((r) => r.json())
      .then((data) => setSamples(data))
      .catch(() => setSamples([]))
  }, [])

  const loadProtein = async (proteinId) => {
    setLoadingProtein(proteinId)
    try {
      const r = await fetch(`https://api-mock-cesga.onrender.com/proteins/${proteinId}`)
      const data = await r.json()
      setValue('fasta_sequence', data.fasta_ready, { shouldValidate: true, shouldDirty: true })
      setValue('fasta_filename', `${proteinId}.fasta`, { shouldValidate: true, shouldDirty: true })
    } catch {
      alert('Error cargando la proteína, inténtalo de nuevo.')
    } finally {
      setLoadingProtein(null)
    }
  }

  const handleFileLoaded = ({ content, filename }) => {
    setValue('fasta_sequence', content, { shouldValidate: true, shouldDirty: true })
    setValue('fasta_filename', filename, { shouldValidate: true, shouldDirty: true })
  }

  const { isDragging, dropError, handleDragOver, handleDragLeave, handleDrop, handleFileInput } =
    useFastaDrop(handleFileLoaded)

  const onSubmit = (data) => {
    onValidSubmit?.(data)
  }

  const borderClass = (field) => {
    const hasError = !!errors[field]
    const isDirty = !!dirtyFields[field]
    if (hasError) return 'border-red-400 focus:border-red-500'
    if (isDirty) return 'border-green-400 focus:border-green-500'
    return 'border-gray-200 focus:border-blue-400'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-800">Validación FASTA</h1>
          <p className="text-sm text-gray-400 mt-1">
            Pre-vuelo · AlphaFold2 @ CESGA · Impacthón 2026
          </p>
        </div>

        {/* Proteínas de ejemplo */}
        {samples.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Cargar proteína del catálogo
            </p>
            <div className="flex flex-wrap gap-2">
              {samples.map((p) => (
                <button
                  key={p.protein_id}
                  type="button"
                  onClick={() => loadProtein(p.protein_id)}
                  disabled={loadingProtein === p.protein_id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200
                    bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700
                    transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingProtein === p.protein_id ? '⏳' : '🧬'} {p.protein_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all cursor-pointer
            ${isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
        >
          <input
            type="file"
            accept=".fasta"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer block">
            <div className="text-3xl mb-3">📂</div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? 'Suelta el archivo aquí...' : 'Arrastra tu archivo .fasta aquí'}
            </p>
            <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionarlo</p>
          </label>
          {dropError && (
            <p className="mt-3 text-xs text-red-500">⚠ {dropError}</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

          {/* fasta_filename */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Nombre de archivo</label>
              <FieldBadge
                isValid={!errors.fasta_filename}
                isDirty={!!dirtyFields.fasta_filename}
              />
            </div>
            <input
              {...register('fasta_filename')}
              type="text"
              placeholder="mi_proteina.fasta"
              className={`w-full rounded-lg border-2 px-3 py-2.5 text-sm bg-white
                focus:outline-none transition-colors duration-200
                ${borderClass('fasta_filename')}`}
            />
            <ErrorMessage message={errors.fasta_filename?.message} />
          </div>

          {/* fasta_sequence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Secuencia FASTA</label>
              <div className="flex items-center gap-2">
                {aaCount > 0 && (
                  <span className="text-xs text-gray-400">{aaCount} aa</span>
                )}
                <FieldBadge
                  isValid={!errors.fasta_sequence}
                  isDirty={!!dirtyFields.fasta_sequence}
                />
              </div>
            </div>
            <textarea
              {...register('fasta_sequence')}
              rows={10}
              placeholder={'>sp|P12345|PROT_HUMAN Nombre de la proteína\nMKTLLLTLVVVTIVTASYGDR...'}
              className={`w-full rounded-lg border-2 px-3 py-2.5 font-mono text-sm bg-white
                focus:outline-none transition-colors duration-200 resize-y
                ${borderClass('fasta_sequence')}`}
            />
            <ErrorMessage message={errors.fasta_sequence?.message} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                ${isValid
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Enviar a predicción →
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="py-2.5 px-4 rounded-lg text-sm font-medium border border-gray-200
                text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}