import FastaForm from './components/FastaForm'
import { FastaFormData } from './schemas/fastaSchema'

function App() {
  const handleValidatedData = (data: FastaFormData) => {
    // ── PUNTO DE HANDOFF CON PERSONA 6 (Integración) ──
    // Aquí Persona 6 conecta su fetch a la API del CESGA.
    // `data` llega 100% validado por Zod:
    // {
    //   fasta_filename: "proteina.fasta",
    //   fasta_sequence: ">sp|P12345...\nMKTLL..."
    // }
    console.log('Datos validados listos para la API:', data)
  }

  return <FastaForm onValidSubmit={handleValidatedData} />
}

export default App