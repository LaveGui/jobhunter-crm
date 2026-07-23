import React, { useState } from 'react';

export const AddJobModal = ({ isOpen, onClose, RENDER_API_URL, onToastTrigger }) => {
  const [jobUrl, setJobUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobUrl.trim()) return;

    const urlToSend = jobUrl.trim();
    setJobUrl(''); // Limpiamos el input
    onClose();      // Cerramos el modal inmediatamente para no interrumpir tu flujo

    // Disparamos el toast de "En proceso"
    onToastTrigger({
      type: 'info',
      message: '🚀 ¡Procesando oferta! En un par de minutos estará disponible en tu CRM.'
    });

    try {
      // Petición en segundo plano a Render
      await fetch(`${RENDER_API_URL}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToSend }),
      });
      
      // Opcional: Podrías disparar un toast de éxito si el backend responde rápido,
      // o dejar que Apps Script actualice la tabla automáticamente en el siguiente refetch.
    } catch (error) {
      console.error('Error enviando la URL a Render:', error);
      onToastTrigger({
        type: 'error',
        message: '❌ Hubo un problema al enviar la oferta a Render.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            ⚡ Añadir rápida desde LinkedIn
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Enlace de la vacante:
            </label>
            <input
              type="url"
              required
              placeholder="https://www.linkedin.com/jobs/view/..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-2"
            >
              Procesar oferta
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};