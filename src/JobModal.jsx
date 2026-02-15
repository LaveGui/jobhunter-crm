import { useState, useEffect } from 'react';

export default function JobModal({ isOpen, onClose, onSave, jobToEdit }) {
  // Estado inicial del formulario
  const initialForm = {
    company: '', role: '', status: 'Prospecto', link: '',
    contact_name: '', salary: '', location_type: 'Híbrido',
    interview_date: '', notes: '', activities: '' // Bitácora
  };

  const [formData, setFormData] = useState(initialForm);

  // Si nos pasan un trabajo para editar, rellenamos el formulario
  useEffect(() => {
    if (jobToEdit) {
      setFormData(jobToEdit);
    } else {
      setFormData(initialForm);
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {jobToEdit ? '✏️ Editar Oportunidad' : '🚀 Nueva Oportunidad'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* FORMULARIO (con Scroll si es muy largo) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Fila 1: Empresa y Rol */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Empresa</label>
              <input required className="w-full border p-2 rounded" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Rol / Puesto</label>
              <input required className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
            </div>
          </div>

          {/* Fila 2: Estado y Modalidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Estado</label>
              <select className="w-full border p-2 rounded bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option>Prospecto</option>
                <option>Aplicado</option>
                <option>Entrevista</option>
                <option>Oferta</option>
                <option>Descartado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Modalidad</label>
              <select className="w-full border p-2 rounded bg-white" value={formData.location_type} onChange={e => setFormData({...formData, location_type: e.target.value})}>
                <option>Remoto</option>
                <option>Híbrido</option>
                <option>Presencial</option>
              </select>
            </div>
          </div>

          {/* Fila 3: Salario y Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Salario (Rango)</label>
              <input placeholder="ej: 40k - 50k" className="w-full border p-2 rounded" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Enlace Oferta</label>
              <input type="url" className="w-full border p-2 rounded" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
            </div>
          </div>

          {/* Fila 4: Próxima Entrevista */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
             <label className="block text-xs font-bold text-blue-800 uppercase mb-1">📅 Próxima Entrevista / Hito</label>
             <input type="datetime-local" className="w-full border p-2 rounded" value={formData.interview_date} onChange={e => setFormData({...formData, interview_date: e.target.value})} />
          </div>

          {/* Área de Notas / Actividades */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">📝 Bitácora & Notas</label>
            <textarea 
              placeholder="Pega aquí descripciones, notas de llamadas, feedback..." 
              className="w-full border p-2 rounded h-24 text-sm" 
              value={formData.activities} 
              onChange={e => setFormData({...formData, activities: e.target.value})}
            />
          </div>

        </form>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
          {/* En el Footer del Modal */}
<button 
  type="button"
  onClick={() => {
    // Añadir línea a la bitácora automáticamente
    const today = new Date().toLocaleDateString();
    setFormData({
      ...formData, 
      activities: `✅ CV Enviado el ${today}\n` + (formData.activities || '')
    });
  }}
  className="mr-auto text-xs bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 border border-green-200 font-bold"
>
  ✅ Registrar CV Enviado
</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}