import { useState } from 'react';
import { X, Save, Building2, Link as LinkIcon, MapPin, Euro, FileText, Heart, BrainCircuit } from 'lucide-react';

export default function QuickAddModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    job_link: '',
    salary: '',
    location_type: 'Híbrido',
    enthusiasm: 3,
    notes: '', // Notas iniciales
    description: '' // Raw description para que Sheets la procese
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.title) return alert("Empresa y Título son obligatorios");
    
    // Guardamos con estado inicial 'Prospecto'
    onSave({ ...formData, status: 'Prospecto' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">🚀 Nueva Oportunidad</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Bloque Principal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input name="company" autoFocus value={formData.company} onChange={handleChange} className="w-full border p-2 pl-10 rounded text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Google"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol / Título</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-2 rounded text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Product Manager"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enlace a la Oferta</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 text-slate-400" size={16}/>
              <input name="job_link" value={formData.job_link} onChange={handleChange} className="w-full border p-2 pl-10 rounded text-sm text-blue-600 underline focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://linkedin.com/jobs/..."/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
               <Euro className="absolute left-3 top-2.5 text-slate-400" size={16}/>
               <input name="salary" value={formData.salary} onChange={handleChange} className="w-full border p-2 pl-10 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Salario (Opcional)"/>
            </div>
            <div className="relative">
               <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16}/>
               <input name="location_type" value={formData.location_type} onChange={handleChange} className="w-full border p-2 pl-10 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Modalidad"/>
            </div>
          </div>

          {/* Notas y Entusiasmo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Interés Inicial</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button key={level} type="button" onClick={() => setFormData({...formData, enthusiasm: level})} className={`p-1 rounded-full transition ${formData.enthusiasm >= level ? 'text-yellow-400 scale-110' : 'text-slate-300'}`}>
                      <Heart size={20} fill={formData.enthusiasm >= level ? "currentColor" : "none"}/>
                    </button>
                  ))}
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas Rápidas</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full border p-2 rounded text-xs h-16 resize-none focus:border-yellow-400 outline-none" placeholder="Lejos de casa, buen stack..."/>
             </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
              <FileText size={14}/> Descripción (Para análisis IA)
            </label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-3 rounded text-xs h-32 focus:border-blue-500 outline-none font-mono" placeholder="Pega todo el texto de la oferta aquí..."/>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:text-slate-800">Cancelar</button>
          <button onClick={handleSubmit} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
            <Save size={16}/> Guardar y Analizar
          </button>
        </div>

      </div>
    </div>
  );
}