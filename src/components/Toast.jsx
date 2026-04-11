import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ isVisible, onClose, onAction }) {
  if (!isVisible) return null;

  // Auto-cerrar después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-4 bg-gray-900 border border-gray-700 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300">
      <CheckCircle2 className="text-green-500 w-6 h-6" />
      <div>
        <p className="font-bold text-sm">¡Tu predicción está lista! 🧬</p>
        <p className="text-xs text-gray-400 mt-0.5">AlphaFold2 ha finalizado el análisis.</p>
      </div>
      <div className="flex items-center gap-3 ml-4 border-l border-gray-700 pl-4">
        <button 
          onClick={onAction}
          className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          Ver resultados
        </button>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}