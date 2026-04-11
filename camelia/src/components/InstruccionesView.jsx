import { HelpCircle, ChevronRight } from 'lucide-react';

export default function InstruccionesView() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <HelpCircle color="var(--accent-blue)" /> Manual de Uso
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Guía rápida para utilizar BioHack y la API del CESGA.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
           <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>1. Preparar Secuencia FASTA</h3>
           <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
             La secuencia debe comenzar con un identificador iniciado por <code>&gt;</code>, seguido de un salto de línea y la cadena peptídica de letras mayúsculas válidas de aminoácidos. Nuestro editor incluye validación en vivo para confirmarlo.
           </p>
        </div>
        <div style={{ height: '1px', background: 'var(--surface-border)' }} />
        <div>
           <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>2. El Proceso Computacional</h3>
           <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
             Al enviar, BioHack negocia una cola prioritaria en el Supercomputador FinisTerrae. AlphaFold2 recibe tu secuencia, realiza un alineamiento MSA exhaustivo, y ejecuta inferencia en GPUs de alto requerimiento tensorial. Esto demora habitualmente unos minutos, aunque la demo lo acelerará gracias al simulador desarrollado interactivo.
           </p>
        </div>
        <div style={{ height: '1px', background: 'var(--surface-border)' }} />
        <div>
           <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>3. Interpretación de Confianza (pLDDT)</h3>
           <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, listStyle: 'none' }}>
             <li><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> <strong style={{color: 'var(--accent-blue)'}}>&gt; 90:</strong> Precisión altísima, equivalente a cristalografía.</li>
             <li><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> <strong style={{color: 'var(--accent-green)'}}>70 - 90:</strong> Predicción correcta del plegamiento principal.</li>
             <li><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> <strong style={{color: 'var(--accent-orange)'}}>50 - 70:</strong> Baja confianza, posible loop flexible.</li>
             <li><ChevronRight size={14} style={{verticalAlign: 'middle'}}/> <strong style={{color: 'var(--accent-red)'}}>&lt; 50:</strong> Regiones fuertemente desestructuradas.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
