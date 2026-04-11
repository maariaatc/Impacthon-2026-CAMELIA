import FastaForm from './components/FastaForm'

function App() {
  const handleValidatedData = (data) => {
    // Punto de handoff con Persona 3 (submit a la API)
    console.log('Datos validados:', data)
  }

  return <FastaForm onValidSubmit={handleValidatedData} />
}

export default App