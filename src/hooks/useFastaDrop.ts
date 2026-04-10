import { useCallback, useState } from 'react'

interface FileLoadedPayload {
  content: string
  filename: string
}

export function useFastaDrop(onFileLoaded: (payload: FileLoadedPayload) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      setDropError(null)

      if (!file.name.endsWith('.fasta')) {
        setDropError('Solo se aceptan archivos con extensión .fasta')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        onFileLoaded({
          content: e.target?.result as string,
          filename: file.name,
        })
      }
      reader.readAsText(file)
    },
    [onFileLoaded]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  return {
    isDragging,
    dropError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
  }
}