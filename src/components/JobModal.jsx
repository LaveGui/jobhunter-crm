import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Save, Link as LinkIcon, UserPlus, Clock, Heart, 
  FileText, Send, Palette, Building2, Phone, Mail, MessageSquare, 
  StickyNote, Euro, Check, ChevronDown, ChevronUp, BrainCircuit, 
  Sparkles, ListChecks, Gift, Cpu, MapPin, ExternalLink
} from 'lucide-react'; 

export default function JobModal({ job, isOpen, onClose, onSave, initialTab = 'activity', initialLogType = 'note' }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(null); // Empezamos null para validar carga
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showRawDesc, setShowRawDesc] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState(initialTab); // 'contacts' | 'activity'

  // Contact & Log States (Temporales para inputs nuevos)
  const [newContact, setNewContact] = useState({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
  const [logType, setLogType] = useState(initialLogType);
  const [logContact, setLogContact] = useState('');
  const [logMessage, setLogMessage] = useState('');

  // --- INIT ---
  useEffect(() => {
    if (job) {
      const data = {
        ...job,
        contacts: typeof job.contacts === 'string' ? JSON.parse(job.contacts || '[]') : (job.contacts || []),
        activity_log: typeof job.activity_log === 'string' ? JSON.parse(job.activity_log || '[]') : (job.activity_log || []),
        enthusiasm: Number(job.enthusiasm) || 3,
        // Asegurar campos
        notes: job.notes || '',
        tech_stack: job.tech_stack || '',
        ai_summary: job.ai_summary || '',
        ai_requirements: job.ai_requirements || '',
        ai_benefits: job.ai_benefits || ''
      };
      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);
      setActiveBottomTab(initialTab);
      setLogType(initialLogType);
    }
  }, [job, isOpen]);

  // Detector de cambios
  useEffect(() => {
    if (originalData && formData) {
      setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
    }
  }, [formData, originalData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- HANDLERS GUARDADO ---
  const handleSubmit = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    const payload = {
      ...formData,
      contacts: JSON.stringify(formData.contacts),
      activity_log: JSON.stringify(formData.activity_log),
      last_updated: new Date().toISOString()
    };
    // No enviamos campos IA para proteger fórmulas de Sheets
    delete payload.ai_summary; delete payload.ai_requirements; delete payload.ai_benefits; delete payload.tech_stack;

    await onSave(payload);
    setOriginalData(formData);
    setHasChanges(false);
    setIsSaving(false);
  };

  // --- HANDLERS UI ---
  const handleCloseAttempt = () => {
    if (hasChanges) {
      if (window.confirm('⚠️ Cambios sin guardar. ¿Cerrar?')) onClose();
    } else {
      onClose();
    }
  };

  // --- LOGICA CONTACTOS Y BITACORA (Igual que antes) ---
  const addContact = () => {
    if (!newContact.name) return;
    setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
    setNewContact({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
  };
  const removeContact = (idx) => {
    const c = [...formData.contacts]; c.splice(idx, 1); setFormData({ ...formData, contacts: c });
  };
  const handleLogSubmit = () => {
    if (!logMessage) return;
    const icons = { message: '👔', call: '📞', email: '📧', note: '📝' };
    const newLog = {
      date: new Date().toLocaleString('es-ES'), type: logType, text: logMessage, contact: logContact, icon: icons[logType] || '📝'
    };
    setFormData({ ...formData, activity_log: [newLog, ...formData.activity_log] });
    setLogMessage('');
  };
  const markAsApplied = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    const todayLog = new Date().toLocaleString('es-ES');
    setFormData({ ...formData, status: 'Aplicado', date_applied: todayISO, activity_log: [{ date: todayLog, type: 'apply', text: '✅ CV Enviado', icon: '🚀' }, ...formData.activity_log] });
  };
  const handleGoToCV = () => {
    if (hasChanges && !window.confirm("Guardar cambios?")) return;
    navigate('/cv', { state: { jobContext: formData } });
  };

  // Helpers visuales
  const getTechBadges = () => formData?.tech_stack ? formData.tech_stack.split(',').map(t => t.trim()).filter(t => t) : [];
  const inputDisguise = "bg-transparent border border-transparent hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-500 rounded px-1 transition-all outline-none";

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-2 md:p-6 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-6xl min-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        
        {/* --- HEADER TIPO DASHBOARD --- */}
        <div className="bg-white p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                 <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    className={`text-2xl md:text-3xl font-black text-slate-800 w-full ${inputDisguise}`} 
                    placeholder="Título del Puesto"
                 />
                 {/* Hearts */}
                 <div className="flex shrink-0 gap-0.5 bg-slate-100 p-1 rounded-full">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <button key={l} onClick={() => setFormData({...formData, enthusiasm: l})} className={`${formData.enthusiasm >= l ? 'text-yellow-400' : 'text-slate-300'} hover:scale-110 transition`}><Heart size={18} fill="currentColor"/></button>
                    ))}
                 </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                 <div className="flex items-center gap-1">
                    <Building2 size={16} className="text-slate-400"/>
                    <input name="company" value={formData.company} onChange={handleChange} className={`font-bold text-slate-700 w-40 ${inputDisguise}`}/>
                 </div>
                 <div className="h-4 w-px bg-slate-300"></div>
                 <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-slate-400"/>
                    <input name="location_type" value={formData.location_type} onChange={handleChange} className={`w-32 ${inputDisguise}`}/>
                 </div>
                 <div className="flex items-center gap-1">
                    <Euro size={16} className="text-slate-400"/>
                    <input name="salary" value={formData.salary} onChange={handleChange} className={`w-32 ${inputDisguise}`} placeholder="Salario"/>
                 </div>
                 
                 {formData.job_link && (
                   <a href={formData.job_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-full text-xs font-bold">
                     <LinkIcon size={12}/> Ver Oferta <ExternalLink size={10}/>
                   </a>
                 )}
              </div>
           </div>

           <div className="flex flex-col items-end gap-3 shrink-0">
              <button onClick={handleCloseAttempt} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={28}/></button>
              <div className="mt-8 md:mt-0">
                <select name="status" value={formData.status} onChange={handleChange} className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm cursor-pointer hover:bg-slate-800 outline-none border-4 border-slate-100 shadow-lg">
                  <option>Prospecto</option><option>Aplicado</option><option>Entrevista</option><option>Oferta</option><option>Descartado</option>
                </select>
              </div>
           </div>
        </div>

        {/* --- BODY: DASHBOARD GRID --- */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* COLUMNA 1 y 2: INTELIGENCIA & ANÁLISIS (2/3 ancho) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Tech Stack Badges */}
              {formData.tech_stack && (
                <div className="flex flex-wrap gap-2">
                   {getTechBadges().map((t, i) => (
                     <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-md shadow-sm flex items-center gap-1">
                       <Cpu size={12} className="text-blue-500"/> {t}
                     </span>
                   ))}
                </div>
              )}

              {/* Cards IA (Resumen, Requisitos, Beneficios) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-5 rounded-xl">
                    <h3 className="text-purple-800 font-bold text-sm flex items-center gap-2 mb-2"><BrainCircuit size={16}/> Resumen Ejecutivo</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {formData.ai_summary || <span className="text-slate-400 italic">Esperando análisis de Google Sheets... (Asegúrate de pegar la descripción abajo)</span>}
                    </p>
                 </div>
                 
                 <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                    <h3 className="text-slate-600 font-bold text-xs uppercase flex items-center gap-2 mb-3"><ListChecks size={14}/> Requisitos Clave</h3>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                       {formData.ai_requirements || "..."}
                    </div>
                 </div>

                 <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                    <h3 className="text-slate-600 font-bold text-xs uppercase flex items-center gap-2 mb-3"><Gift size={14}/> Beneficios</h3>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                       {formData.ai_benefits || "..."}
                    </div>
                 </div>
              </div>

              {/* Raw Description (Accordion) */}
              <div className="border-t border-slate-200 pt-4">
                 <button onClick={() => setShowRawDesc(!showRawDesc)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-blue-600 transition-colors">
                    {showRawDesc ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                    {showRawDesc ? 'Ocultar Texto Original' : 'Ver Descripción Completa (Texto Original)'}
                 </button>
                 {showRawDesc && (
                   <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      className="w-full mt-2 p-3 text-xs text-slate-500 font-mono bg-slate-50 rounded border border-slate-200 h-64 focus:border-blue-400 outline-none"
                      placeholder="Pega aquí el texto de la oferta para que la IA lo analice..."
                   />
                 )}
              </div>
           </div>

           {/* COLUMNA 3: ESTRATEGIA & ACCIÓN (1/3 ancho) */}
           <div className="space-y-6">
              
              {/* Mis Notas */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-sm">
                 <label className="text-yellow-800 font-bold text-xs uppercase mb-2 flex items-center gap-2"><StickyNote size={14}/> Mis Notas</label>
                 <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    className="w-full bg-yellow-100/50 border-0 rounded p-2 text-sm text-slate-800 h-32 focus:ring-2 focus:ring-yellow-400 outline-none resize-none placeholder-yellow-800/30"
                    placeholder="Pros y contras..."
                 />
              </div>

              {/* CV Action */}
              <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Palette size={16}/> CV Status</h3>
                    {formData.date_applied ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">ENVIADO</span> : <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">PENDIENTE</span>}
                 </div>
                 <button onClick={handleGoToCV} className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded hover:bg-indigo-100 transition-colors mb-2">
                    {formData.id ? '🖊️ Ir al CV Studio' : '💾 Guardar para Editar CV'}
                 </button>
                 {!formData.date_applied && (
                   <button onClick={markAsApplied} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 transition-colors">
                      Marcar como Enviado
                   </button>
                 )}
              </div>

              {/* Mini-Bitácora (Resumen) */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col h-64">
                 <div className="flex border-b border-slate-100 mb-2">
                    <button onClick={() => setActiveBottomTab('activity')} className={`flex-1 pb-2 text-xs font-bold ${activeBottomTab === 'activity' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Bitácora</button>
                    <button onClick={() => setActiveBottomTab('contacts')} className={`flex-1 pb-2 text-xs font-bold ${activeBottomTab === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Contactos ({formData.contacts.length})</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto">
                    {activeBottomTab === 'activity' ? (
                       <div className="space-y-2">
                          <div className="flex gap-1 mb-2">
                             <input value={logMessage} onChange={(e) => setLogMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogSubmit()} className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Nota rápida..."/>
                             <button onClick={handleLogSubmit} className="bg-slate-900 text-white p-1 rounded"><Send size={12}/></button>
                          </div>
                          {/* Listado Logs Simplificado */}
                          {formData.activity_log.map((log, i) => (
                             <div key={i} className="text-xs p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="mr-1">{log.icon}</span> <span className="text-slate-600">{log.text}</span>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="space-y-2">
                          <div className="flex gap-1 mb-2">
                             <input value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Nombre contacto..."/>
                             <button onClick={addContact} className="bg-blue-600 text-white p-1 rounded"><UserPlus size={12}/></button>
                          </div>
                          {formData.contacts.map((c, i) => (
                             <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded">
                                <div className="font-bold text-slate-700">{c.name}</div>
                                <button onClick={() => removeContact(i)} className="text-red-400"><X size={12}/></button>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* --- FOOTER FLOTANTE --- */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3">
           <button onClick={handleCloseAttempt} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800">Cerrar</button>
           <button onClick={handleSubmit} disabled={!hasChanges && !isSaving} className={`px-8 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 ${hasChanges ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
           </button>
        </div>

      </div>
    </div>
  );
}