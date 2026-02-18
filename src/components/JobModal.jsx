import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Save, Linkedin, Link as LinkIcon, UserPlus, Clock, Heart, 
  FileText, Send, Palette, Building2, Phone, Mail, MessageSquare, 
  StickyNote, Euro, Check, ChevronDown, ChevronUp, BrainCircuit, Sparkles, ListChecks, Gift
} from 'lucide-react'; 
import { analyzeJobDescription } from '../utils/gemini'; // <--- IMPORT NUEVO

export default function JobModal({ job, isOpen, onClose, onSave, initialTab = 'details', initialLogType = 'note' }) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    company: '', title: '', status: 'Prospecto', 
    salary: '', location_type: 'Híbrido', job_link: '', description: '',
    notes: '', 
    // NUEVOS CAMPOS IA
    ai_summary: '', ai_requirements: '', ai_benefits: '',
    enthusiasm: 3, contacts: [], activity_log: [], cv_text: '', date_applied: ''
  });

  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Estado para loading de IA
  
  const [showDescription, setShowDescription] = useState(false);

  const [newContact, setNewContact] = useState({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
  const [logType, setLogType] = useState('note');
  const [logContact, setLogContact] = useState('');
  const [logMessage, setLogMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
        setLogType(initialLogType);
    }
  }, [isOpen, initialTab, initialLogType]);

  useEffect(() => {
    if (job) {
      const initialData = {
        ...job,
        contacts: typeof job.contacts === 'string' ? JSON.parse(job.contacts || '[]') : (job.contacts || []),
        activity_log: typeof job.activity_log === 'string' ? JSON.parse(job.activity_log || '[]') : (job.activity_log || []),
        enthusiasm: Number(job.enthusiasm) || 3,
        notes: job.notes || '',
        // Mapeo seguro de campos nuevos (por si son undefined al principio)
        ai_summary: job.ai_summary || '',
        ai_requirements: job.ai_requirements || '',
        ai_benefits: job.ai_benefits || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
      setShowDescription(!initialData.description);
    } else {
      const initialData = {
        company: '', title: '', status: 'Prospecto', 
        salary: '', location_type: 'Híbrido', job_link: '', description: '', notes: '',
        ai_summary: '', ai_requirements: '', ai_benefits: '',
        enthusiasm: 3, contacts: [], activity_log: [], cv_text: '', date_applied: ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
      setShowDescription(true);
    }
  }, [job, isOpen]);

  useEffect(() => {
    if (originalData) {
      setHasChanges(JSON.stringify(formData) !== JSON.stringify(originalData));
    }
  }, [formData, originalData]);

  // --- IA HANDLER ---
  const handleAnalyzeAI = async () => {
    if (!formData.description) {
      alert("⚠️ Primero pega la Descripción del Puesto.");
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeJobDescription(formData.description);
      
      // Convertimos arrays a strings con bullets si vienen como array
      const reqText = Array.isArray(analysis.requirements) ? analysis.requirements.map(r => `• ${r}`).join('\n') : analysis.requirements;
      const benText = Array.isArray(analysis.benefits) ? analysis.benefits.map(b => `• ${b}`).join('\n') : analysis.benefits;

      setFormData(prev => ({
        ...prev,
        ai_summary: analysis.summary,
        ai_requirements: reqText,
        ai_benefits: benText
      }));
    } catch (error) {
      alert("Error al analizar: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- HELPERS ---
  const formatDateNice = (dateString) => {
    if (!dateString) return '';
    try { const date = new Date(dateString); return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return dateString; }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      if (window.confirm('⚠️ Tienes cambios sin guardar. ¿Cerrar?')) onClose();
    } else {
      onClose();
    }
  };

  const addContact = () => {
    if (!newContact.name) return;
    setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
    setNewContact({ name: '', role: 'Recruiter', linkedin: '', email: '', phone: '' });
  };

  const removeContact = (index) => {
    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData({ ...formData, contacts: updated });
  };

  const handleLogSubmit = () => {
    if (!logMessage) return;
    let iconType = '📝';
    if (logType === 'message') iconType = '👔';
    if (logType === 'call') iconType = '📞';
    if (logType === 'email') iconType = '📧';

    const newLog = {
      date: new Date().toLocaleString('es-ES'),
      type: logType, text: logMessage, contact: logContact, icon: iconType
    };
    setFormData({ ...formData, activity_log: [newLog, ...formData.activity_log] });
    setLogMessage(''); setLogType('note'); setLogContact('');
  };

  const markAsApplied = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    const todayLog = new Date().toLocaleString('es-ES');
    setFormData({
      ...formData, status: 'Aplicado', date_applied: todayISO,
      activity_log: [{ date: todayLog, type: 'apply', text: '✅ CV Enviado y postulación realizada', icon: '🚀' }, ...formData.activity_log]
    });
  };

  const handleGoToCV = () => {
    if (hasChanges) { if(!window.confirm("Guarda cambios antes de ir al CV.")) return; }
    navigate('/cv', { state: { jobContext: formData } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;
    setIsSaving(true);
    const payload = {
      ...formData,
      contacts: JSON.stringify(formData.contacts),
      activity_log: JSON.stringify(formData.activity_log),
      last_updated: new Date().toISOString()
    };
    await onSave(payload);
    setOriginalData(formData);
    setHasChanges(false);
    setIsSaving(false);
  };

  const renderLogs = () => {
    let logsToShow = [...formData.activity_log];
    const hasApplyLog = logsToShow.some(log => log.type === 'apply');
    if (!hasApplyLog && formData.date_applied) {
      logsToShow.push({ date: formatDateNice(formData.date_applied), type: 'apply', text: '✅ CV Enviado (Registro histórico)', icon: '🚀', isVirtual: true });
    }
    return logsToShow;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between">
           <div className="flex-1">
             <input name="title" value={formData.title} onChange={handleChange} placeholder="Título del Puesto..." className="bg-transparent text-2xl font-bold placeholder-slate-500 border-none focus:ring-0 p-0 w-full text-white"/>
              <div className="flex gap-4 items-center mt-2 text-slate-400 text-sm">
                <div className="flex items-center gap-1"><span className="uppercase font-bold text-[10px] tracking-wider">Empresa:</span><input name="company" value={formData.company} onChange={handleChange} className="bg-transparent border-none focus:ring-0 p-0 font-semibold text-white w-40" placeholder="Nombre Empresa"/></div>
                <span>|</span>
                <select name="status" value={formData.status} onChange={handleChange} className="bg-slate-800 rounded border-none text-xs py-1 px-2 text-white font-bold cursor-pointer hover:bg-slate-700">
                  <option>Prospecto</option><option>Aplicado</option><option>Entrevista</option><option>Oferta</option><option>Descartado</option>
                </select>
              </div>
           </div>
           <div className="flex flex-col items-end gap-2">
             <button onClick={handleCloseAttempt} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
             <div className="flex gap-1 bg-white/10 p-1 rounded-full">{[1, 2, 3, 4, 5].map((level) => (<button key={level} type="button" onClick={() => setFormData({...formData, enthusiasm: level})} className={`p-1 rounded-full hover:scale-110 transition ${formData.enthusiasm >= level ? 'text-yellow-400' : 'text-slate-600'}`}><Heart size={16} fill={formData.enthusiasm >= level ? "currentColor" : "none"}/></button>))}</div>
           </div>
        </div>

        {/* TABS */}
        <div className="flex border-b bg-slate-50 shrink-0">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileText size={16}/> Detalles</button>
          
          {/* NUEVA TAB IA */}
          <button onClick={() => setActiveTab('ai_analysis')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'ai_analysis' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Sparkles size={16} className={activeTab === 'ai_analysis' ? "text-purple-600" : "text-slate-400"}/> Análisis IA
          </button>

          <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><UserPlus size={16}/> Contactos ({formData.contacts.length})</button>
          <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'activity' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Clock size={16}/> Bitácora</button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* TAB 1: DETALLES */}
          {activeTab === 'details' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Bloques de Datos Básicos (Empresa, Salario...) */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Empresa</label><div className="relative group"><Building2 className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16}/><input name="company" value={formData.company} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 pl-10 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold" placeholder="Nombre"/></div></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Enlace Oferta</label><div className="relative group"><LinkIcon className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16}/><input name="job_link" value={formData.job_link} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 pl-10 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-blue-600 underline" placeholder="https://..." /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Salario (€)</label><div className="relative group"><Euro className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16}/><input name="salary" value={formData.salary} onChange={handleChange} placeholder="Ej: 45.000 €" className="w-full border border-slate-300 rounded-lg p-2 pl-10 text-sm focus:border-blue-500 outline-none transition-all"/></div></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modalidad</label><input name="location_type" value={formData.location_type} onChange={handleChange} placeholder="Híbrido..." className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none"/></div>
              </div>

              {/* ANÁLISIS PERSONAL (PROS / CONTRAS) */}
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 flex items-center gap-2">
                  <BrainCircuit size={14}/> Mis Notas / Análisis Personal
                </label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  className="w-full bg-white border border-yellow-200 rounded p-2 text-sm h-20 outline-none focus:border-yellow-400 text-slate-700"
                  placeholder="Ej: Pros: Buen stack. Contras: Lejos de casa. Perfil más Senior de lo que soy..."
                />
              </div>

              {/* JOB DESCRIPTION */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setShowDescription(!showDescription)} className="w-full bg-slate-50 p-3 flex justify-between items-center text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  <span className="uppercase">Descripción del Puesto (Raw)</span>
                  {showDescription ? <div className="flex items-center gap-1"><ChevronUp size={14}/> Ocultar</div> : <div className="flex items-center gap-1"><ChevronDown size={14}/> Ver Completa</div>}
                </button>
                {showDescription ? (
                  <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-3 text-sm h-48 outline-none font-mono text-slate-600 leading-relaxed resize-y border-t border-slate-100" placeholder="Pega aquí la descripción..."></textarea>
                ) : (
                  formData.description && <div className="p-3 text-xs text-slate-400 italic border-t border-slate-100 bg-white">{formData.description.substring(0, 150)}...</div>
                )}
              </div>

              {/* ZONA CV */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col gap-3">
                 <div className="flex justify-between items-center"><h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2"><Palette size={16}/> Adaptación de CV</h3>{formData.date_applied && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase tracking-wide">Postulado: {formatDateNice(formData.date_applied)}</span>}</div>
                 <div className="flex gap-3">
                    <button type="button" onClick={handleGoToCV} className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">{formData.id ? '🖊️ Diseñar CV' : '💾 Guarda primero'}</button>
                    {!formData.date_applied && <button type="button" onClick={markAsApplied} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-transform active:scale-95">Marcar Enviado</button>}
                 </div>
                 <div className="relative"><textarea name="cv_text" value={formData.cv_text} onChange={handleChange} placeholder="Aquí aparecerá el texto de tu CV..." className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-xs h-20 text-slate-500 focus:border-indigo-400 outline-none"/></div>
              </div>
            </div>
          )}

          {/* TAB 2: ANÁLISIS IA (NUEVA) */}
          {activeTab === 'ai_analysis' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* BOTÓN DE ACCIÓN */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center gap-2 text-center">
                <div className="text-purple-800 font-bold text-sm">¿Mucho texto? Deja que la IA lo resuma.</div>
                <button 
                  onClick={handleAnalyzeAI} 
                  disabled={isAnalyzing || !formData.description}
                  className={`px-6 py-2 rounded-full font-bold text-white shadow-lg flex items-center gap-2 transition-all
                    ${isAnalyzing ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 active:scale-95'}
                    ${!formData.description ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isAnalyzing ? <><Sparkles size={16} className="animate-spin"/> Analizando...</> : <><Sparkles size={16}/> Analizar Oferta con IA</>}
                </button>
                {!formData.description && <p className="text-xs text-red-400">* Pega la descripción en la pestaña Detalles primero.</p>}
              </div>

              {/* RESULTADOS */}
              {(formData.ai_summary || isAnalyzing) && (
                <div className="space-y-4">
                  
                  {/* RESUMEN */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><BrainCircuit size={14}/> Resumen Ejecutivo</label>
                    <textarea 
                      name="ai_summary" 
                      value={formData.ai_summary} 
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 focus:border-purple-400 outline-none bg-white leading-relaxed"
                      placeholder="El resumen aparecerá aquí..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* REQUISITOS */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><ListChecks size={14}/> Requisitos Clave</label>
                      <textarea 
                        name="ai_requirements" 
                        value={formData.ai_requirements} 
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm h-40 focus:border-purple-400 outline-none bg-white leading-relaxed"
                        placeholder="• Requisito 1..."
                      />
                    </div>

                    {/* BENEFICIOS */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Gift size={14}/> Beneficios</label>
                      <textarea 
                        name="ai_benefits" 
                        value={formData.ai_benefits} 
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm h-40 focus:border-purple-400 outline-none bg-white leading-relaxed"
                        placeholder="• Beneficio 1..."
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACTOS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><UserPlus size={14}/> Nuevo Contacto</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                     <input placeholder="Nombre" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                     <select value={newContact.role} onChange={(e) => setNewContact({...newContact, role: e.target.value})} className="border p-2 rounded text-sm bg-white outline-none focus:border-blue-500"><option>Recruiter</option><option>Hiring Manager</option><option>Peer</option></select>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                     <input placeholder="LinkedIn URL" value={newContact.linkedin} onChange={(e) => setNewContact({...newContact, linkedin: e.target.value})} className="border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                     <input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                     <input placeholder="Teléfono" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <button type="button" onClick={addContact} className="w-full bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"><UserPlus size={16}/> Guardar</button>
              </div>
              <div className="space-y-3">
                {formData.contacts.map((contact, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group relative">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">{contact.name.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-slate-800">{contact.name}</p>
                          <p className="text-xs text-slate-500 bg-slate-50 inline-block px-1.5 rounded mb-1">{contact.role}</p>
                          <div className="flex gap-3 text-xs text-slate-400 mt-1">
                             {contact.email && <span className="flex items-center gap-1 hover:text-slate-600"><Mail size={12}/> {contact.email}</span>}
                             {contact.phone && <span className="flex items-center gap-1 hover:text-slate-600"><Phone size={12}/> {contact.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Linkedin size={16}/></a>}
                        <button type="button" onClick={() => removeContact(idx)} className="text-slate-300 hover:text-red-500 p-1.5"><X size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Registrar Actividad</h4>
                 <div className="flex gap-2 mb-3">
                    <button onClick={() => setLogType('note')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${logType === 'note' ? 'bg-slate-100 border-slate-300 text-slate-800' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><StickyNote size={14}/> Nota</button>
                    <button onClick={() => setLogType('message')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${logType === 'message' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><MessageSquare size={14}/> Mensaje</button>
                    <button onClick={() => setLogType('call')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${logType === 'call' ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><Phone size={14}/> Llamada</button>
                    <button onClick={() => setLogType('email')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${logType === 'email' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><Mail size={14}/> Email</button>
                 </div>
                 {(logType !== 'note') && (
                   <div className="mb-3">
                      <select value={logContact} onChange={(e) => setLogContact(e.target.value)} className="w-full text-xs p-2 rounded border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 text-slate-600">
                        <option value="">-- Vincular con un Contacto --</option>
                        {formData.contacts.map((c, i) => <option key={i} value={c.name}>{c.name} ({c.role})</option>)}
                      </select>
                   </div>
                 )}
                 <div className="flex gap-2">
                   <input className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-colors" placeholder="Detalles..." value={logMessage} onChange={(e) => setLogMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogSubmit()}/>
                   <button onClick={handleLogSubmit} className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg transition-colors"><Send size={18}/></button>
                 </div>
              </div>
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 mt-6 ml-2 pb-4">
                 {renderLogs().map((log, idx) => (
                   <div key={idx} className={`relative group ${log.isVirtual ? 'opacity-70' : ''}`}>
                      <div className={`absolute -left-[32px] top-1 w-8 h-8 rounded-full border-4 border-slate-50 flex items-center justify-center text-xs shadow-sm bg-white z-10 ${log.type === 'apply' ? 'text-green-600' : 'text-slate-500'}`}>{log.icon || '📝'}</div>
                      <div className="flex items-baseline justify-between mb-1">
                         <div className="flex items-center gap-2">
                           <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${log.type === 'message' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{log.type === 'apply' ? 'Hito' : log.type.toUpperCase()}</span>
                           {log.contact && <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><UserPlus size={10}/> con {log.contact}</span>}
                         </div>
                         <span className="text-[10px] text-slate-400">{log.date}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm text-slate-700">{log.text}</div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white flex justify-end shrink-0 gap-3">
          <button onClick={handleCloseAttempt} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={!hasChanges && !isSaving} className={`px-6 py-2 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${!hasChanges ? 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed' : isSaving ? 'bg-green-600 text-white cursor-wait' : 'bg-slate-900 hover:bg-slate-800 text-white transform active:scale-95 hover:shadow-xl'}`}>
             {isSaving ? <><Check size={18} className="animate-bounce"/> ¡Guardado!</> : <><Save size={18}/> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}