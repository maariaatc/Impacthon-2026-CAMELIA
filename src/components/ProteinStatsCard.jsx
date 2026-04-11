import React from 'react';
import { Scale, Fingerprint, Zap, Droplets, MapPin, Activity, Beaker } from 'lucide-react';

export default function ProteinStatsCard({ aiData }) {
  // Si no hay datos de la IA aún, mostramos un estado de carga o nada
  if (!aiData) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem', opacity: 0.5 }}>
        <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Calculando métricas bioquímicas...</p>
      </div>
    );
  }

  // Mapeamos los datos del JSON que definimos antes
  const stats = [
    { 
      label: 'Peso Molecular', 
      value: aiData.peso_molecular_kda ? `${aiData.peso_molecular_kda} kDa` : 'N/A', 
      icon: <Scale size={16}/>, 
      color: '#60a5fa' 
    },
    { 
      label: 'Punto Isoeléctrico', 
      value: aiData.punto_isoelectrico || 'N/A', 
      icon: <Zap size={16}/>, 
      color: '#fbbf24' 
    },
    { 
      label: 'Longitud', 
      value: aiData.longitud_aminoacidos ? `${aiData.longitud_aminoacidos} aa` : 'N/A', 
      icon: <Fingerprint size={16}/>, 
      color: '#a78bfa' 
    },
    { 
      label: 'Hidrofobicidad', 
      value: aiData.grand_average_hydropathicity || 'N/A', 
      icon: <Droplets size={16}/>, 
      color: '#34d399' 
    }
  ];

  return (
    <div className="glass-panel" style={{ 
      padding: '1.5rem', 
      marginTop: '1rem', 
      background: 'rgba(30, 41, 59, 0.3)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '16px'
    }}>
      <h3 style={{ 
        fontSize: '0.8rem', 
        color: '#9ca3af', 
        textTransform: 'uppercase', 
        marginBottom: '1rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        letterSpacing: '0.5px'
      }}>
        <Activity size={16} color="#6366f1" /> Caracterización Bioquímica
      </h3>
      
      {/* Rejilla de métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '0.8rem', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.03)' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#64748b', 
              fontSize: '0.65rem', 
              marginBottom: '0.3rem',
              textTransform: 'uppercase'
            }}>
              {s.icon} {s.label}
            </div>
            <div style={{ color: s.color, fontWeight: '700', fontSize: '1.1rem' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Información extra de localización y función */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: 'rgba(99, 102, 241, 0.05)', 
        borderRadius: '12px', 
        border: '1px solid rgba(99, 102, 241, 0.1)' 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Localización:</span>
            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={12} color="#f87171" /> {aiData.localizacion_subcelular_probable || 'No determinada'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Función:</span>
            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Beaker size={12} color="#60a5fa" /> {aiData.funcion_molecular_probable || 'Desconocida'}
            </span>
          </div>
        </div>
      </div>

      <p style={{ 
        fontSize: '0.6rem', 
        color: '#4b5563', 
        marginTop: '0.8rem', 
        textAlign: 'center', 
        fontStyle: 'italic' 
      }}>
        * Valores calculados mediante inferencia computacional de secuencia.
      </p>
    </div>
  );
}