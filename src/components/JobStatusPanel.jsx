import React, { useEffect, useState } from 'react';
import { useJobStatus } from '../hooks/useJobStatus';
import { sendJobCompletedNotification } from '../services/browserNotifications';
import Toast from './Toast';
import { Hourglass, Settings, CheckCircle, AlertOctagon } from 'lucide-react';

export default function JobStatusPanel({ jobId, onCompleted }) {
  const { status, jobData, error } = useJobStatus(jobId);
  const [showToast, setShowToast] = useState(false);

  // Efecto para disparar notificaciones cuando cambia a COMPLETED
  useEffect(() => {
    if (status === 'COMPLETED') {
      setShowToast(true);
      sendJobCompletedNotification(jobId);
    }
  }, [status, jobId]);

  const handleViewResults = () => {
    setShowToast(false);
    if (onCompleted) onCompleted(jobId);
  };

  // Lógica visual del Stepper
  const steps = [
    { key: 'PENDING', label: 'En Cola', icon: Hourglass },
    { key: 'RUNNING', label: 'Ejecutando', icon: Settings },
    { key: 'COMPLETED', label: 'Completado', icon: CheckCircle },
  ];

  const getStepStatus = (stepKey) => {
    if (status === 'FAILED' || status === 'CANCELLED') return 'error';
    if (status === stepKey) return 'current';
    
    const states = ['PENDING', 'RUNNING', 'COMPLETED'];
    const currentIndex = states.indexOf(status);
    const stepIndex = states.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return 'done';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* TOAST FLOTANTE */}
      <Toast 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        onAction={handleViewResults} 
      />

      {/* CABECERA Y STEPPER */}
      <div className="p-6 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-lg font-semibold text-white mb-6">Estado de la Predicción</h3>
        
        <div className="flex items-center justify-between relative">
          {/* Línea conectora base */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-800 rounded-full z-0"></div>
          
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.key);
            const Icon = step.icon;
            
            // Estilos dinámicos basados en el estado usando Tailwind
            let bgClass = "bg-gray-800 border-gray-700 text-gray-500"; // Upcoming
            if (stepStatus === 'done') bgClass = "bg-green-500/20 border-green-500 text-green-500";
            if (stepStatus === 'current') {
              if (step.key === 'PENDING') bgClass = "bg-gray-700 border-gray-400 text-gray-300";
              if (step.key === 'RUNNING') bgClass = "bg-blue-500/20 border-blue-500 text-blue-400";
              if (step.key === 'COMPLETED') bgClass = "bg-green-500/20 border-green-500 text-green-500";
            }
            if (stepStatus === 'error') bgClass = "bg-red-500/20 border-red-500 text-red-500";

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 bg-gray-900 px-2">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${bgClass}`}>
                  <Icon className={`w-5 h-5 ${stepStatus === 'current' && step.key === 'RUNNING' ? 'animate-spin' : ''}`} />
                </div>
                <span className={`text-xs font-medium ${stepStatus === 'current' ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* MENSAJE DE ESTADO ACTUAL */}
        <div className="mt-6 text-center">
          {status === 'PENDING' && <p className="text-gray-400">Tu job está en la cola del CESGA...</p>}
          {status === 'RUNNING' && <p className="text-blue-400 animate-pulse">AlphaFold2 está calculando tu proteína...</p>}
          {status === 'COMPLETED' && <p className="text-green-500 font-semibold">¡Resultados listos para visualizar!</p>}
          {(status === 'FAILED' || error) && (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <AlertOctagon className="w-5 h-5" />
              <p>{error || "El proceso ha fallado en el clúster."}</p>
            </div>
          )}
        </div>
      </div>

      {/* TERMINAL DE LOGS */}
      <div className="p-4 bg-black">
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-gray-500 font-mono ml-2">cesga-node-output.log</span>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-800">
          {!jobData?.logs && status === 'PENDING' && (
            <span className="text-gray-500">Esperando asignación de recursos...</span>
          )}
          
          {jobData?.logs && (
            <pre className="text-green-400 whitespace-pre-wrap break-words">
              {jobData.logs}
            </pre>
          )}

          {status === 'RUNNING' && (
            <div className="flex items-center mt-2 text-gray-500">
              <span className="animate-pulse">_</span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}