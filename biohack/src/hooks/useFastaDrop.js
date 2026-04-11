import { useCallback, useState } from 'react'

export function useFastaDrop(onFileLoaded) {
  const [isDragging, setIsDragging] = useState(false)
  const [dropError, setDropError] = useState(null)

  const processFile = useCallback(
    (file) => {
      setDropError(null)
      if (!file.name.endsWith('.fasta')) {
        setDropError('Solo se aceptan archivos con extensión .fasta')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        onFileLoaded({
          content: e.target.result,
          filename: file.name,
        })
      }
      reader.readAsText(file)
    },
    [onFileLoaded]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e) => {
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