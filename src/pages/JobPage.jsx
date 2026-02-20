import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Link as LinkIcon, UserPlus, Clock, Heart, 
  MessageSquare, StickyNote, Euro, Building2, MapPin, 
  ExternalLink, BrainCircuit, ListChecks, Gift, Cpu, 
  Palette, Phone, Mail, Send, Copy, Check, FileText, X, Zap,
  ChevronDown, ChevronUp // <--- Importamos flechas para desplegables
} from 'lucide-react'; 

export default function JobPage({ jobs, onSave, pendingTasks = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = jobs.find(j => String(j.id) === String(id));

  const [formData, setFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI States
  const [showRawDesc, setShowRawDesc] = useState(false); // Para oferta original
  const [showDetails, setShowDetails] = useState(false); // Para requisitos/beneficios (cerrado por defecto)
  const [contactView, setContactView] = useState('list');
  const [draftCopied, setDraftCopied] = useState(false); 

  const [logType, setLogType] = useState('note');
  const [logContact, setLogContact] = useState('');
  const [logMessage, setLogMessage] = useState('');

  const [newContact, setNewContact] = useState({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });

  const jobTasks = pendingTasks.filter(t => String(t.jobId) === String(id));

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        contacts: typeof job.contacts === 'string' ? JSON.parse(job.contacts || '[]') : (job.contacts || []),
        activity_log: typeof job.activity_log === 'string' ? JSON.parse(job.activity_log || '[]') : (job.activity_log || []),
        enthusiasm: Number(job.enthusiasm) || 3,
        notes: job.notes || '', 
        tech_stack: job.tech_stack || '', 
        message_drafts: job.message_drafts || '', 
        ai_summary: job.ai_summary || '', 
        ai_requirements: job.ai_requirements || '', 
        ai_benefits: job.ai_benefits || '',
        cv_text: job.cv_text || '' // <--- RECUPERADO ESTADO DEL CV
      });
    }
  }, [job]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setHasChanges(true); };

  const handleSubmit = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    const payload = { ...formData, contacts: JSON.stringify(formData.contacts), activity_log: JSON.stringify(formData.activity_log), last_updated: new Date().toISOString() };
    delete payload.ai_summary; delete payload.ai_requirements; delete payload.ai_benefits; delete payload.tech_stack;
    await onSave(payload);
    setHasChanges(false); setIsSaving(false);
  };

  const handleBack = () => {
    if (hasChanges) { if (window.confirm('⚠️ Tienes cambios sin guardar. ¿Salir?')) navigate('/'); } else { navigate('/'); }
  };

  const handleCopyDraft = () => { navigator.clipboard.writeText(formData.message_drafts); setDraftCopied(true); setTimeout(() => setDraftCopied(false), 2000); };

  const handleLogSubmit = () => {
    if (!logMessage) return;
    const icons = { note: '📝', visit: '👁️', connect: '🤝', message: '👔', email: '📧', call: '📞', viewed_me: '👀' };
    const newLog = { date: new Date().toLocaleString('es-ES'), type: logType, text: logMessage, contact: logContact, icon: icons[logType] || '📝' };
    setFormData({ ...formData, activity_log: [newLog, ...formData.activity_log] });
    setLogMessage(''); setHasChanges(true);
  };

  const addContact = () => {
    if (!newContact.name) return;
    setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
    setNewContact({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
    setContactView('list'); setHasChanges(true);
  };
  const removeContact = (idx) => { const c = [...formData.contacts]; c.splice(idx, 1); setFormData({ ...formData, contacts: c }); setHasChanges(true); };
  
  const markAsApplied = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    const todayLog = new Date().toLocaleString('es-ES');
    setFormData({ ...formData, status: 'Aplicado', date_applied: todayISO, activity_log: [{ date: todayLog, type: 'apply', text: '✅ CV Enviado', icon: '🚀' }, ...formData.activity_log] });
    setHasChanges(true);
  };

  const getLogsToRender = () => {
    if (!formData) return [];
    let logsToShow = [...formData.activity_log];
    if (!logsToShow.some(log => log.type === 'apply') && formData.date_applied) {
      logsToShow.push({ date: new Date(formData.date_applied).toLocaleDateString('es-ES'), type: 'apply', text: '✅ CV Enviado (Fecha registrada)', icon: '🚀', isVirtual: true });
    }
    return logsToShow;
  };

  const actionMap = { visit: '👁️ Visitar Perfil', connect: '🤝 Conectar', message: '👔 Mensaje', email: '📧 Email', call: '📞 Llamada' };
  const inputDisguise = "bg-transparent border border-transparent hover:border-slate-300 hover:bg-white focus:bg-white focus:border-blue-500 rounded px-1 transition-all outline-none";

  if (!job || !formData) return <div className="p-10 text-center text-slate-500">Cargando oportunidad...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"><ArrowLeft size={18}/> Volver</button>
        <div className="flex items-center gap-3">
            {hasChanges && <span className="text-xs text-orange-500 font-bold animate-pulse">● Cambios sin guardar</span>}
            <button onClick={handleSubmit} disabled={!hasChanges && !isSaving} className={`px-6 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${hasChanges ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{isSaving ? 'Guardando...' : <><Save size={16}/> Guardar</>}</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        
        {/* HERO HEADER */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 w-full space-y-3">
                 <input name="title" value={formData.title} onChange={handleChange} className={`text-3xl md:text-4xl font-black text-slate-800 w-full ${inputDisguise}`} placeholder="Título del Puesto"/>
                 <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-2"><Building2 size={18} className="text-slate-400"/><input name="company" value={formData.company} onChange={handleChange} className={`font-bold text-slate-700 text-lg w-48 ${inputDisguise}`}/></div>
                    <div className="h-5 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2"><MapPin size={18} className="text-slate-400"/><input name="location_type" value={formData.location_type} onChange={handleChange} className={`w-32 ${inputDisguise}`}/></div>
                    <div className="flex items-center gap-2"><Euro size={18} className="text-slate-400"/><input name="salary" value={formData.salary} onChange={handleChange} className={`w-32 ${inputDisguise}`} placeholder="Salario"/></div>
                    {formData.job_link && (<a href={formData.job_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-3 py-1 rounded-full text-xs font-bold"><LinkIcon size={14}/> Ver Oferta <ExternalLink size={12}/></a>)}
                 </div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                 <div className="flex bg-slate-100 p-1.5 rounded-full">{[1, 2, 3, 4, 5].map((l) => (<button key={l} onClick={() => {setFormData({...formData, enthusiasm: l}); setHasChanges(true);}} className={`${formData.enthusiasm >= l ? 'text-yellow-400' : 'text-slate-300'} hover:scale-110 transition`}><Heart size={24} fill="currentColor"/></button>))}</div>
                 <select name="status" value={formData.status} onChange={handleChange} className="bg-slate-900 text-white font-bold py-2.5 px-5 rounded-lg text-sm cursor-pointer hover:bg-slate-800 outline-none border-4 border-slate-100 shadow-xl"><option>Prospecto</option><option>Aplicado</option><option>Entrevista</option><option>Oferta</option><option>Descartado</option></select>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* LADO IZQUIERDO (2/3) */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* IA Summary (Resumen Puesto) */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 rounded-r-xl shadow-sm">
                 <h3 className="text-purple-900 font-bold text-sm flex items-center gap-2 mb-3"><BrainCircuit size={18}/> Análisis Inteligente</h3>
                 <p className="text-slate-800 leading-relaxed text-sm">{formData.ai_summary || <span className="text-slate-400 italic">... Esperando datos de Sheets ...</span>}</p>
                 
                 {/* RESTAURADO 1: REQUISITOS Y BENEFICIOS DESPLEGABLE */}
                 <div className="mt-6 border border-purple-200/50 rounded-xl overflow-hidden bg-white/50">
                    <button onClick={() => setShowDetails(!showDetails)} className="w-full p-3 flex justify-between items-center hover:bg-purple-100/50 transition-colors">
                       <div className="flex items-center gap-2 font-bold text-purple-800 text-xs uppercase">
                          <ListChecks size={14}/> Requisitos & Beneficios <Gift size={14}/>
                       </div>
                       {showDetails ? <ChevronUp size={16} className="text-purple-400"/> : <ChevronDown size={16} className="text-purple-400"/>}
                    </button>
                    {showDetails && (
                       <div className="p-5 bg-white grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn border-t border-purple-100">
                          <div>
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Requisitos Clave</h4>
                             <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{formData.ai_requirements || "-"}</div>
                          </div>
                          <div>
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Beneficios</h4>
                             <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{formData.ai_benefits || "-"}</div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* TAREA PENDIENTE ALERT */}
              {jobTasks.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-pulse">
                   <div className="bg-orange-200 p-2 rounded-full text-orange-600"><Zap size={20} className="fill-orange-600"/></div>
                   <div>
                      <h4 className="text-sm font-bold text-orange-900">Tarea Estratégica Pendiente: {jobTasks[0].taskLabel}</h4>
                      <p className="text-xs text-orange-700 mt-1">{jobTasks[0].taskDesc}</p>
                      <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-100/50 inline-block px-2 py-1 rounded">
                        💡 Registra un hito "{actionMap[jobTasks[0].actionType] || jobTasks[0].actionType}" abajo para completarla.
                      </p>
                   </div>
                </div>
              )}

              {/* BITACORA */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                 <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2"><Clock size={20} className="text-slate-400"/> Bitácora de Actividad</h3>
                 
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Acciones Proactivas</div>
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                       <button onClick={() => setLogType('note')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'note' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>📝 Nota</button>
                       <button onClick={() => setLogType('visit')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'visit' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 hover:bg-purple-50'}`}>👁️ Visitar Perfil</button>
                       <button onClick={() => setLogType('connect')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'connect' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 hover:bg-teal-50'}`}>🤝 Conectar</button>
                       <button onClick={() => setLogType('message')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'message' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-blue-50'}`}>👔 Mensaje</button>
                       <button onClick={() => setLogType('email')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'email' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-slate-600 hover:bg-yellow-50'}`}>📧 Email</button>
                    </div>
                    
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 border-t border-slate-200 pt-2">Eventos (Inbound)</div>
                    <div className="flex gap-2 mb-4">
                       <button onClick={() => setLogType('viewed_me')} className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-all border ${logType === 'viewed_me' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-600 hover:bg-pink-50'}`}>👀 Me visitó</button>
                    </div>

                    {logType !== 'note' && (
                       <div className="mb-3">
                          <select value={logContact} onChange={(e) => setLogContact(e.target.value)} className="w-full text-sm p-2 rounded border border-slate-200 bg-white outline-none focus:border-blue-400 text-slate-700">
                             <option value="">-- Vincular con un Contacto (Opcional) --</option>
                             {formData.contacts.map((c, i) => <option key={i} value={c.name}>{c.name} ({c.role})</option>)}
                          </select>
                       </div>
                    )}
                    <div className="flex gap-2">
                       <textarea value={logMessage} onChange={(e) => setLogMessage(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleLogSubmit(); }}} className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-colors resize-none h-16" placeholder="Detalles de la acción..."/>
                       <button onClick={handleLogSubmit} className="bg-slate-900 hover:bg-slate-800 text-white px-5 rounded-lg transition-colors flex items-center justify-center"><Send size={20}/></button>
                    </div>
                 </div>
                 <div className="pl-8 border-l-2 border-slate-100 space-y-6 pt-2">
                    {getLogsToRender().map((log, idx) => (
                       <div key={idx} className={`relative ${log.isVirtual ? 'opacity-75' : ''}`}>
                          <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-sm shadow-sm bg-slate-100 z-10">{log.icon}</div>
                          <div className="flex items-baseline justify-between mb-1">
                             <div className="font-bold text-slate-700 text-sm">{log.type === 'apply' ? 'Postulado' : log.type === 'viewed_me' ? 'Vieron mi perfil' : log.type.toUpperCase()} <span className="text-slate-400 font-normal text-xs ml-1">{log.contact ? `con ${log.contact}` : ''}</span></div>
                             <span className="text-[10px] text-slate-400">{log.date}</span>
                          </div>
                          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{log.text}</div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* RESTAURADO 2: OFERTA COMPLETA DESPLEGABLE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <button onClick={() => setShowRawDesc(!showRawDesc)} className="text-sm font-bold text-slate-500 flex items-center gap-2 hover:text-blue-600 transition-colors w-full justify-between">
                    <div className="flex items-center gap-2"><FileText size={18}/> Descripción Original de la Oferta</div>
                    {showRawDesc ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                 </button>
                 {showRawDesc && (
                   <textarea 
                     name="description" 
                     value={formData.description} 
                     onChange={handleChange} 
                     className="w-full mt-4 p-4 text-xs text-slate-500 font-mono bg-slate-50 rounded-lg border border-slate-200 h-96 focus:border-blue-400 outline-none leading-relaxed" 
                     placeholder="Pega aquí todo el texto original de la oferta..."
                   />
                 )}
              </div>
           </div>

           {/* LADO DERECHO (1/3) */}
           <div className="space-y-6">
              
              {/* Tech Stack */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Cpu size={14}/> Tech Stack</h4>
                 {formData.tech_stack ? (<div className="flex flex-wrap gap-2">{getTechBadges().map((t, i) => (<span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200">{t}</span>))}</div>) : <span className="text-xs text-slate-300 italic">Sin datos...</span>}
              </div>

              {/* RESTAURADO 3: CV STATUS & TEXTO DEL CV */}
              <div className="bg-white border border-indigo-100 p-5 rounded-xl shadow-sm flex flex-col">
                 <div className="flex justify-between items-center mb-4 pb-3 border-b border-indigo-50">
                    <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Palette size={16}/> Adaptación de CV</h3>
                    {formData.date_applied ? <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">ENVIADO</span> : <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">PENDIENTE</span>}
                 </div>
                 
                 <div className="mb-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Texto del CV Publicado</label>
                    <textarea 
                       name="cv_text" 
                       value={formData.cv_text} 
                       onChange={handleChange} 
                       placeholder="Aquí aparecerá el texto de tu CV cuando lo generes..." 
                       className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs h-32 text-slate-600 focus:border-indigo-400 outline-none resize-none"
                    />
                 </div>

                 <button onClick={() => navigate('/cv', { state: { jobContext: formData } })} className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded hover:bg-indigo-100 transition-colors mb-2">
                    {formData.id ? '🖊️ Ir al CV Studio' : '💾 Guardar para Editar'}
                 </button>
                 {!formData.date_applied && (
                    <button onClick={markAsApplied} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded hover:bg-indigo-700 transition-colors">
                       Marcar como Enviado
                    </button>
                 )}
              </div>

              {/* Borradores */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl shadow-sm relative group">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-blue-800 font-bold text-xs uppercase flex items-center gap-2"><MessageSquare size={14}/> Borradores LinkedIn</label>
                    <button onClick={handleCopyDraft} className="text-blue-400 hover:text-blue-700 transition-colors" title="Copiar al portapapeles">{draftCopied ? <Check size={14}/> : <Copy size={14}/>}</button>
                 </div>
                 <textarea name="message_drafts" value={formData.message_drafts} onChange={handleChange} className="w-full bg-white border-0 rounded-lg p-3 text-sm text-slate-700 h-40 focus:ring-2 focus:ring-blue-400 outline-none resize-none placeholder-blue-300" placeholder="Pega aquí los mensajes..."/>
              </div>

              {/* Notas */}
              <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl shadow-sm">
                 <label className="text-yellow-800 font-bold text-xs uppercase mb-2 flex items-center gap-2"><StickyNote size={14}/> Mis Notas Personales</label>
                 <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full bg-white border-0 rounded-lg p-3 text-sm text-slate-800 h-32 focus:ring-2 focus:ring-yellow-400 outline-none resize-none placeholder-yellow-800/30" placeholder="Estrategia, pros, contras..."/>
              </div>

              {/* Contactos */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><UserPlus size={14}/> Contactos ({formData.contacts.length})</h4>
                    {contactView === 'list' ? (<button onClick={() => setContactView('add')} className="text-blue-600 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors">+ Añadir</button>) : (<button onClick={() => setContactView('list')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={16}/></button>)}
                 </div>
                 <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {contactView === 'list' ? (
                       <div className="space-y-2">
                          {formData.contacts.map((c, i) => (
                             <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 group relative">
                                <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                                <div className="text-xs text-slate-500">{c.role}</div>
                                <div className="flex gap-3 mt-2">
                                   {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700"><LinkIcon size={14}/></a>}
                                   {c.email && <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-slate-600"><Mail size={14}/></a>}
                                   {c.phone && <a href={`tel:${c.phone}`} className="text-slate-400 hover:text-slate-600"><Phone size={14}/></a>}
                                </div>
                                <button onClick={() => removeContact(i)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="space-y-3">
                          <input value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Nombre Completo*"/>
                          <select value={newContact.role} onChange={(e) => setNewContact({...newContact, role: e.target.value})} className="w-full border p-2 rounded text-xs bg-white outline-none focus:border-blue-500"><option>Recruiter</option><option>Hiring Manager</option><option>Peer</option></select>
                          <input value={newContact.linkedin} onChange={(e) => setNewContact({...newContact, linkedin: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="LinkedIn URL"/>
                          <input value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Email"/>
                          <input value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full border p-2 rounded text-xs outline-none focus:border-blue-500" placeholder="Teléfono"/>
                          <button onClick={addContact} className="w-full bg-slate-900 text-white py-2 rounded text-xs font-bold hover:bg-slate-800 transition-colors">Guardar</button>
                       </div>
                    )}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}