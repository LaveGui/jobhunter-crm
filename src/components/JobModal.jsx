import { useState, useEffect } from 'react';
import { X, Save, Linkedin, Link as LinkIcon, UserPlus, MessageSquare, Clock, Heart, FileText, Send } from 'lucide-react';

export default function JobModal({ job, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    company: '', title: '', status: 'Prospecto', 
    salary: '', location_type: 'Híbrido', job_link: '', description: '',
    enthusiasm: 3, contacts: [], activity_log: [], cv_text: '', date_applied: ''
  });

  const [activeTab, setActiveTab] = useState('details'); // details | contacts | activity
  const [newContact, setNewContact] = useState({ name: '', linkedin: '', role: 'Recruiter' });
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        ...job,
        contacts: typeof job.contacts === 'string' ? JSON.parse(job.contacts || '[]') : (job.contacts || []),
        activity_log: typeof job.activity_log === 'string' ? JSON.parse(job.activity_log || '[]') : (job.activity_log || []),
        enthusiasm: Number(job.enthusiasm) || 3
      });
    } else {
      // Reset para nueva oportunidad
      setFormData({
        company: '', title: '', status: 'Prospecto', 
        salary: '', location_type: 'Híbrido', job_link: '', description: '',
        enthusiasm: 3, contacts: [], activity_log: [], cv_text: '', date_applied: ''
      });
    }
  }, [job, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- GESTIÓN DE CONTACTOS ---
  const addContact = () => {
    if (!newContact.name) return;
    setFormData({ ...formData, contacts: [...formData.contacts, newContact] });
    setNewContact({ name: '', linkedin: '', role: 'Recruiter' });
  };

  const removeContact = (index) => {
    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData({ ...formData, contacts: updated });
  };

  // --- GESTIÓN DE ACTIVIDAD (LOGS) ---
  const logActivity = (type) => {
    const log = {
      date: new Date().toLocaleString(),
      type: type, // 'message', 'apply', 'update'
      text: type === 'message' ? `Mensaje LinkedIn: ${newMessage}` : 'Actividad registrada'
    };
    
    // Si es mensaje, limpiar input
    if (type === 'message') {
      if(!newMessage) return;
      setNewMessage('');
    }

    const updatedLogs = [log, ...formData.activity_log];
    
    // Actualizamos el log y también la fecha de 'last_updated' implícitamente al guardar
    setFormData({ ...formData, activity_log: updatedLogs });
  };

  const markAsApplied = () => {
    const today = new Date().toLocaleDateString();
    setFormData({
      ...formData,
      status: 'Aplicado',
      date_applied: today,
      activity_log: [{ date: new Date().toLocaleString(), type: 'apply', text: `✅ CV Enviado el ${today}` }, ...formData.activity_log]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convertir arrays a string para Google Sheets
    const payload = {
      ...formData,
      contacts: JSON.stringify(formData.contacts),
      activity_log: JSON.stringify(formData.activity_log),
      last_updated: new Date()
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER: Info Clave Siempre Visible */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="Título del Puesto" 
                className="bg-transparent text-2xl font-bold placeholder-slate-400 border-none focus:ring-0 p-0 w-full"
              />
              {/* Selector de Entusiasmo */}
              <div className="flex gap-1 bg-white/10 p-1 rounded-full">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button 
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, enthusiasm: level})}
                    className={`p-1 rounded-full hover:scale-110 transition ${formData.enthusiasm >= level ? 'text-yellow-400' : 'text-gray-500'}`}
                  >
                    <Heart size={16} fill={formData.enthusiasm >= level ? "currentColor" : "none"}/>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-sm text-slate-300">
              <input 
                name="company" 
                value={formData.company} 
                onChange={handleChange} 
                placeholder="Empresa" 
                className="bg-transparent font-semibold placeholder-slate-500 border-none focus:ring-0 p-0"
              />
              <span>|</span>
              <select name="status" value={formData.status} onChange={handleChange} className="bg-slate-800 rounded border-none text-xs py-0">
                <option>Prospecto</option>
                <option>Aplicado</option>
                <option>Entrevista</option>
                <option>Oferta</option>
                <option>Descartado</option>
              </select>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* NAVEGACIÓN TABS */}
        <div className="flex border-b bg-slate-50 shrink-0">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-500'}`}>
            <FileText size={16}/> Detalles & Oferta
          </button>
          <button onClick={() => setActiveTab('contacts')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-500'}`}>
            <UserPlus size={16}/> Contactos ({formData.contacts.length})
          </button>
          <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'activity' ? 'border-b-2 border-blue-600 text-blue-600 bg-white' : 'text-slate-500'}`}>
            <Clock size={16}/> Bitácora & Mensajes
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* TAB 1: DETALLES */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Enlace Oferta</label>
                  <div className="flex mt-1">
                    <input name="job_link" value={formData.job_link} onChange={handleChange} placeholder="https://linkedin.com/jobs/..." className="flex-1 border p-2 rounded-l text-sm" />
                    {formData.job_link && (
                      <a href={formData.job_link} target="_blank" rel="noreferrer" className="bg-blue-100 text-blue-600 p-2 rounded-r hover:bg-blue-200">
                        <LinkIcon size={18}/>
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Modalidad & Salario</label>
                  <div className="flex gap-2 mt-1">
                    <select name="location_type" value={formData.location_type} onChange={handleChange} className="border p-2 rounded text-sm w-1/3">
                      <option>Remoto</option>
                      <option>Híbrido</option>
                      <option>Presencial</option>
                    </select>
                    <input name="salary" value={formData.salary} onChange={handleChange} placeholder="Ej: 40k - 50k" className="border p-2 rounded text-sm flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Descripción del Puesto</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Pega aquí la descripción completa..." className="w-full border p-2 rounded mt-1 h-32 text-sm" />
              </div>

              {/* SECCIÓN CV Y POSTULACIÓN */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-blue-800">🚀 Zona de Postulación</h3>
                  {formData.date_applied ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Postulado el: {formData.date_applied}</span>
                  ) : (
                    <button type="button" onClick={markAsApplied} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-bold">
                      Marcar como Enviado Hoy
                    </button>
                  )}
                </div>
                <textarea name="cv_text" value={formData.cv_text} onChange={handleChange} placeholder="Pega aquí el texto del CV que enviaste o el enlace al PDF..." className="w-full border p-2 rounded text-sm h-20 bg-white" />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTOS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex gap-2 bg-white p-3 rounded shadow-sm border">
                <input 
                  placeholder="Nombre" 
                  value={newContact.name} 
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})} 
                  className="flex-1 border p-1 rounded text-sm"
                />
                <input 
                  placeholder="URL LinkedIn" 
                  value={newContact.linkedin} 
                  onChange={(e) => setNewContact({...newContact, linkedin: e.target.value})} 
                  className="flex-1 border p-1 rounded text-sm"
                />
                <select 
                  value={newContact.role} 
                  onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                  className="border p-1 rounded text-sm"
                >
                  <option>Recruiter</option>
                  <option>Hiring Manager</option>
                  <option>Equipo</option>
                  <option>Conocido</option>
                </select>
                <button type="button" onClick={addContact} className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"><UserPlus size={18}/></button>
              </div>

              <div className="space-y-2">
                {formData.contacts.map((contact, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs
                        ${contact.role === 'Recruiter' ? 'bg-purple-500' : contact.role === 'Hiring Manager' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{contact.name}</p>
                        <div className="flex gap-2 text-xs text-gray-500 items-center">
                          <span className="bg-gray-100 px-1 rounded">{contact.role}</span>
                          {contact.linkedin && (
                            <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                              <Linkedin size={10}/> Perfil
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeContact(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                  </div>
                ))}
                {formData.contacts.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No hay contactos guardados aún.</p>}
              </div>
            </div>
          )}

          {/* TAB 3: BITÁCORA */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Input Rápido de Mensaje */}
              <div className="bg-white p-3 rounded border shadow-sm">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Registrar Mensaje / Actividad</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Ej: Envié mensaje a Juan sobre la oferta..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border p-2 rounded text-sm"
                  />
                  <button type="button" onClick={() => logActivity('message')} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 flex items-center gap-2 font-bold text-sm">
                    <Send size={14}/> Guardar
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-6 mt-4">
                {formData.activity_log.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white
                      ${log.type === 'apply' ? 'bg-green-500' : 'bg-blue-400'}`}></div>
                    <p className="text-xs text-gray-400 mb-0.5">{log.date}</p>
                    <p className="text-sm text-slate-700 bg-white p-2 rounded border inline-block">{log.text}</p>
                  </div>
                ))}
                {formData.activity_log.length === 0 && <p className="text-gray-400 text-sm italic">Sin actividad registrada.</p>}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white flex justify-end shrink-0">
          <button 
            onClick={handleSubmit} 
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>

      </div>
    </div>
  );
}