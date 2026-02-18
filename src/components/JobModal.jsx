import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Save, Link as LinkIcon, UserPlus, Clock, Heart, 
  FileText, Send, Palette, Building2, Phone, Mail, MessageSquare, 
  StickyNote, Euro, Check, ChevronDown, ChevronUp, BrainCircuit, 
  ListChecks, Gift, Cpu, MapPin, ExternalLink, ArrowLeft
} from 'lucide-react'; 

export default function JobModal({ job, isOpen, onClose, onSave, initialTab = 'activity', initialLogType = 'note' }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showRawDesc, setShowRawDesc] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [contactView, setContactView] = useState('list');

  // Bitácora States
  const [logType, setLogType] = useState(initialLogType);
  const [logContact, setLogContact] = useState('');
  const [logMessage, setLogMessage] = useState('');

  // Nuevo Contacto States
  const [newContact, setNewContact] = useState({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });

  // --- INIT ---
  useEffect(() => {
    if (job) {
      const data = {
        ...job,
        contacts: typeof job.contacts === 'string' ? JSON.parse(job.contacts || '[]') : (job.contacts || []),
        activity_log: typeof job.activity_log === 'string' ? JSON.parse(job.activity_log || '[]') : (job.activity_log || []),
        enthusiasm: Number(job.enthusiasm) || 3,
        notes: job.notes || '',
        tech_stack: job.tech_stack || '',
        ai_summary: job.ai_summary || '',
        ai_requirements: job.ai_requirements || '',
        ai_benefits: job.ai_benefits || ''
      };
      setFormData(data);
      setOriginalData(data);
      setHasChanges(false);
      setLogType(initialLogType);
    }
  }, [job, isOpen]);

  useEffect(() => {
    if (originalData && formData) {
      setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
    }
  }, [formData, originalData]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- HANDLERS ---
  const handleSubmit = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    const payload = {
      ...formData,
      contacts: JSON.stringify(formData.contacts),
      activity_log: JSON.stringify(formData.activity_log),
      last_updated: new Date().toISOString()
    };
    delete payload.ai_summary; delete payload.ai_requirements; delete payload.ai_benefits; delete payload.tech_stack;

    await onSave(payload);
    setOriginalData(formData);
    setHasChanges(false);
    setIsSaving(false);
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      if (window.confirm('⚠️ Cambios sin guardar. ¿Cerrar?')) onClose();
    } else {
      onClose();
    }
  };

  // --- LOGICA CONTACTOS ---
  const addContact = () => {
    if (!newContact.name) return;
    setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
    setNewContact({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
    setContactView('list'); 
  };
  const removeContact = (idx) => {
    const c = [...formData.contacts]; c.splice(idx, 1); setFormData({ ...formData, contacts: c });
  };

  // --- LOGICA BITACORA ---
  const handleLogSubmit = () => {
    if (!logMessage) return;
    
    let iconType = '📝';
    if (logType === 'message') iconType = '👔';
    if (logType === 'call') iconType = '📞';
    if (logType === 'email') iconType = '📧';

    const newLog = {
      date: new Date().toLocaleString('es-ES'), 
      type: logType, 
      text: logMessage, 
      contact: logContact, 
      icon: iconType
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

  const getTechBadges = () => formData?.tech_stack ? formData.tech_stack.split(',').map(t => t.trim()).filter(t => t) : [];
  const inputDisguise = "bg-transparent border border-transparent hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-500 rounded px-1 transition-all outline-none";

  if (!isOpen || !formData) return null;

  return (
    // FIX CSS: Usamos 'items-start' con padding superior para evitar cortes, y 'max-h' en la tarjeta
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-start pt-10 z-50 p-4 overflow-hidden">
      
      {/* TARJETA PRINCIPAL: Usamos 'max-h-[90vh]' para forzar scroll interno y no de pantalla */}
      <div className="bg-slate-50 w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700 relative">
        
        {/* --- HERO HEADER (FIJO) --- */}
        <div className="bg-white p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10 relative shadow-sm">
           <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                 <input name="title" value={formData.title} onChange={handleChange} className={`text-2xl md:text-3xl font-black text-slate-800 w-full ${inputDisguise}`} placeholder="Título del Puesto"/>
                 <div className="flex shrink-0 gap-0.5 bg-slate-100 p-1 rounded-full">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <button key={l} onClick={() => setFormData({...formData, enthusiasm: l})} className={`${formData.enthusiasm >= l ? 'text-yellow-400' : 'text-slate-300'} hover:scale-110 transition`}><Heart size={18} fill="currentColor"/></button>
                    ))}
                 </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                 <div className="flex items-center gap-1"><Building2 size={16} className="text-slate-400"/><input name="company" value={formData.company} onChange={handleChange} className={`font-bold text-slate-700 w-40 ${inputDisguise}`}/></div>
                 <div className="h-4 w-px bg-slate-300"></div>
                 <div className="flex items-center gap-1"><MapPin size={16} className="text-slate-400"/><input name="location_type" value={formData.location_type} onChange={handleChange} className={`w-32 ${inputDisguise}`}/></div>
                 <div className="flex items-center gap-1"><Euro size={16} className="text-slate-400"/><input name="salary" value={formData.salary} onChange={handleChange} className={`w-32 ${inputDisguise}`} placeholder="Salario"/></div>
                 {formData.job_link && (<a href={formData.job_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded-full text-xs font-bold"><LinkIcon size={12}/> Ver Oferta <ExternalLink size={10}/></a>)}
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-3 shrink-0">
              <button onClick={handleCloseAttempt} className="text-slate-400 hover:text-slate-800 p-1"><X size={28}/></button>
              <div className="mt-8 md:mt-0"><select name="status" value={formData.status} onChange={handleChange} className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm cursor-pointer hover:bg-slate-800 outline-none border-4 border-slate-100 shadow-lg"><option>Prospecto</option><option>Aplicado</option><option>Entrevista</option><option>Oferta</option><option>Descartado</option></select></div>
           </div>
        </div>

        {/* --- MAIN GRID (SCROLLABLE) --- */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50">
           
           {/* COLUMNA CENTRAL (2/3) */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* 1. RESUMEN EJECUTIVO (IA) */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-5 rounded-r-xl shadow-sm">
                 <h3 className="text-purple-900 font-bold text-sm flex items-center gap-2 mb-2"><BrainCircuit size={18}/> Análisis del Puesto</h3>
                 <p className="text-slate-800 leading-relaxed text-sm">
                   {formData.ai_summary || <span className="text-slate-400 italic">Esperando datos de Sheets... (Asegúrate de pegar la descripción abajo)</span>}
                 </p>
              </div>

              {/* 2. REQUISITOS Y BENEFICIOS (Colapsable) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                 <button onClick={() => setShowDetails(!showDetails)} className="w-full bg-slate-50 p-3 flex justify-between items-center hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2 font-bold text-slate-600 text-sm">
                       <ListChecks size={16}/> Requisitos & Beneficios <Gift size={16}/>
                    </div>
                    {showDetails ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                 </button>
                 {showDetails && (
                    <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn border-t border-slate-100">
                       <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Requisitos</h4>
                          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{formData.ai_requirements || "-"}</div>
                       </div>
                       <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Beneficios</h4>
                          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{formData.ai_benefits || "-"}</div>
                       </div>
                    </div>
                 )}
              </div>

              {/* 3. BITÁCORA COMPLETA */}
              <div className="space-y-4">
                 <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2"><Clock size={20} className="text-slate-400"/> Actividad Reciente</h3>
                 
                 {/* Input Area */}
                 <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                       <button onClick={() => setLogType('note')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${logType === 'note' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><StickyNote size={12}/> Nota</button>
                       <button onClick={() => setLogType('message')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${logType === 'message' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50'}`}><MessageSquare size={12}/> Mensaje</button>
                       <button onClick={() => setLogType('call')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${logType === 'call' ? 'bg-green-600 text-white border-green-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-green-50'}`}><Phone size={12}/> Llamada</button>
                       <button onClick={() => setLogType('email')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${logType === 'email' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-yellow-50'}`}><Mail size={12}/> Email</button>
                    </div>

                    {logType !== 'note' && (
                       <div className="mb-3">
                          <select value={logContact} onChange={(e) => setLogContact(e.target.value)} className="w-full text-sm p-2 rounded border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 text-slate-700">
                             <option value="">-- Vincular con un Contacto --</option>
                             {formData.contacts.map((c, i) => <option key={i} value={c.name}>{c.name} ({c.role})</option>)}
                          </select>
                       </div>
                    )}

                    <div className="flex gap-2">
                       <textarea 
                          value={logMessage} 
                          onChange={(e) => setLogMessage(e.target.value)} 
                          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLogSubmit(); }}}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-colors resize-none h-20" 
                          placeholder={`Escribe detalles de tu ${logType}...`}
                       />
                       <button onClick={handleLogSubmit} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-lg transition-colors flex items-center justify-center"><Send size={20}/></button>
                    </div>
                 </div>

                 {/* Timeline */}
                 <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                    {formData.activity_log.map((log, idx) => (
                       <div key={idx} className="relative group">
                          <div className={`absolute -left-[33px] top-0 w-8 h-8 rounded-full border-4 border-slate-50 flex items-center justify-center text-sm shadow-sm bg-white z-10 
                             ${log.type === 'apply' ? 'text-green-600' : log.type === 'message' ? 'text-blue-500' : log.type === 'call' ? 'text-green-500' : 'text-slate-500'}`}>
                             {log.icon}
                          </div>
                          <div className="flex items-baseline justify-between mb-1">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700 text-sm capitalize">{log.type === 'apply' ? 'Postulado' : log.type}</span>
                                {log.contact && <span className="text-xs text-slate-400 flex items-center gap-1">con <span className="font-semibold text-slate-600">{log.contact}</span></span>}
                             </div>
                             <span className="text-[10px] text-slate-400">{log.date}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm text-slate-600 leading-relaxed">
                             {log.text}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* 4. RAW DESCRIPTION */}
              <div className="border-t border-slate-200 pt-6">
                 <button onClick={() => setShowRawDesc(!showRawDesc)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-blue-600 transition-colors mb-2">
                    {showRawDesc ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                    {showRawDesc ? 'Ocultar Texto Original' : 'Ver Descripción Completa (Texto Original)'}
                 </button>
                 {showRawDesc && (
                   <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 text-xs text-slate-500 font-mono bg-slate-50 rounded border border-slate-200 h-96 focus:border-blue-400 outline-none leading-relaxed" placeholder="Pega aquí el texto..."/>
                 )}
              </div>
           </div>

           {/* COLUMNA LATERAL (1/3) */}
           <div className="space-y-6">
              
              {/* TECH STACK */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Cpu size={14}/> Tech Stack</h4>
                 {formData.tech_stack ? (
                   <div className="flex flex-wrap gap-2">
                      {getTechBadges().map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">{t}</span>
                      ))}
                   </div>
                 ) : <span className="text-xs text-slate-300 italic">Sin datos...</span>}
              </div>

              {/* MIS NOTAS */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-sm">
                 <label className="text-yellow-800 font-bold text-xs uppercase mb-2 flex items-center gap-2"><StickyNote size={14}/> Mis Notas Personales</label>
                 <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-yellow-100/50 border-0 rounded p-2 text-sm text-slate-800 h-32 focus:ring-2 focus:ring-yellow-400 outline-none resize-none placeholder-yellow-800/30" placeholder="Estrategia, pros, contras..."/>
              </div>

              {/* CV STATUS */}
              <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Palette size={16}/> CV Status</h3>
                    {formData.date_applied ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">ENVIADO</span> : <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">PENDIENTE</span>}
                 </div>
                 <button onClick={handleGoToCV} className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded hover:bg-indigo-100 transition-colors mb-2">{formData.id ? '🖊️ Ir al CV Studio' : '💾 Guardar para Editar'}</button>
                 {!formData.date_applied && (<button onClick={markAsApplied} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 transition-colors">Marcar como Enviado</button>)}
              </div>

              {/* CONTACTOS */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col h-[350px]">
                 <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><UserPlus size={14}/> Contactos ({formData.contacts.length})</h4>
                    {contactView === 'list' && (
                      <button onClick={() => setContactView('add')} className="text-blue-600 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors">+ Añadir</button>
                    )}
                    {contactView === 'add' && (
                      <button onClick={() => setContactView('list')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={16}/></button>
                    )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {contactView === 'list' ? (
                       <div className="space-y-2">
                          {formData.contacts.length === 0 && <div className="text-center text-xs text-slate-400 py-4 italic">No hay contactos guardados.</div>}
                          {formData.contacts.map((c, i) => (
                             <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100 hover:border-blue-200 transition-colors group relative">
                                <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                                <div className="text-xs text-slate-500">{c.role}</div>
                                <div className="flex gap-2 mt-1.5">
                                   {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700"><LinkIcon size={12}/></a>}
                                   {c.email && <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-slate-600"><Mail size={12}/></a>}
                                   {c.phone && <a href={`tel:${c.phone}`} className="text-slate-400 hover:text-slate-600"><Phone size={12}/></a>}
                                </div>
                                <button onClick={() => removeContact(i)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="space-y-3 animate-fadeIn">
                          <input value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Nombre Completo*"/>
                          <select value={newContact.role} onChange={(e) => setNewContact({...newContact, role: e.target.value})} className="w-full border p-2 rounded text-xs bg-white outline-none focus:border-blue-500"><option>Recruiter</option><option>Hiring Manager</option><option>Peer</option><option>Referido</option></select>
                          <input value={newContact.linkedin} onChange={(e) => setNewContact({...newContact, linkedin: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="LinkedIn URL"/>
                          <input value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Email"/>
                          <input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Teléfono"/>
                          <button onClick={addContact} className="w-full bg-slate-900 text-white py-2 rounded text-xs font-bold hover:bg-slate-800 transition-colors">Guardar Contacto</button>
                       </div>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* --- FOOTER (FIJO) --- */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0 z-10 relative">
           <button onClick={handleCloseAttempt} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800">Cerrar</button>
           <button onClick={handleSubmit} disabled={!hasChanges && !isSaving} className={`px-8 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 ${hasChanges ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
           </button>
        </div>

      </div>
    </div>
  );
}