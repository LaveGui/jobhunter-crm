import { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Printer, ArrowLeft, LayoutTemplate, Globe } from 'lucide-react';

export default function CVBuilder() {
  // --- ESTADO INICIAL ---
  const [cv, setCv] = useState({
    themeColor: '#2563eb',
    personal: {
      name: "Guido Lavesari",
      title: "Product Marketing Manager",
      email: "guido@lavesari.com.ar",
      phone: "+34 666 110 145",
      location: "Valencia, España",
      linkedin: "/in/guidolavesari",
      photoUrl: "", 
      summary: "Profesional enfocado en Sales Enablement y Arquitectura de Software..."
    },
    experience: [
      { id: 1, role: "Product Marketing Specialist", company: "Jeff App", date: "2022 - 2023", description: "Retención: Estrategia con Braze para base de 100k+ usuarios..." }
    ],
    education: [
      { id: 1, degree: "Master IA e Innovación", school: "Founderz", date: "2024" },
      { id: 2, degree: "Postgrado Marketing Digital", school: "Digital House", date: "2016" },
      { id: 3, degree: "Lic. en Marketing", school: "UADE (Arg)", date: "2015" }
    ],
    languages: [
      { id: 1, language: "Español", level: "Nativo" },
      { id: 2, language: "Inglés", level: "C1 - Avanzado" }
    ],
    skills: ["HubSpot", "Braze", "Salesforce", "Zapier"]
  });

  // --- CONTROLADORES ---
  const handlePersonalChange = (e) => setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  const handleSkillsChange = (e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  const addItem = (section, template) => setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  const removeItem = (section, id) => setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };

  // --- IMPRESIÓN NATIVA ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* --- CSS PARA IMPRESIÓN --- */}
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; background: white; }
          /* Ocultar interfaz */
          aside, .print-hidden-button, .page-break-marker { display: none !important; }
          /* Resetear layout para impresión */
          main { 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important;
            height: auto !important;
          }
          /* El contenedor del CV ocupa toda la hoja */
          .cv-container {
            width: 210mm !important;
            min-height: 297mm !important;
            box-shadow: none !important;
            margin: 0 !important;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* ================= EDITOR (IZQUIERDA) ================= */}
      <aside className="w-full md:w-[450px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:bg-slate-700 p-2 rounded"><ArrowLeft size={20}/></Link>
            <h2 className="font-bold">CV Studio</h2>
          </div>
          <button 
            onClick={handlePrint} 
            className="print-hidden-button bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-bold flex gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Printer size={16}/> Imprimir / PDF
          </button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          <section className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Color Tema</label>
               <input type="color" value={cv.themeColor} onChange={(e) => setCv({...cv, themeColor: e.target.value})} className="w-full h-10 rounded cursor-pointer border-0"/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto URL</label>
               <input name="photoUrl" placeholder="https://..." value={cv.personal.photoUrl} onChange={handlePersonalChange} className="w-full border p-2 rounded text-xs"/>
             </div>
          </section>

          {/* PERSONAL */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">👤 Personal</h3>
            <input name="name" placeholder="Nombre" value={cv.personal.name} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm font-bold" />
            <input name="title" placeholder="Título" value={cv.personal.title} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm" />
            <textarea name="summary" placeholder="Perfil..." value={cv.personal.summary} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm h-24" />
            <div className="grid grid-cols-2 gap-2 text-xs">
               <input name="email" placeholder="Email" value={cv.personal.email} onChange={handlePersonalChange} className="border p-2 rounded" />
               <input name="phone" placeholder="Teléfono" value={cv.personal.phone} onChange={handlePersonalChange} className="border p-2 rounded" />
               <input name="location" placeholder="Ciudad" value={cv.personal.location} onChange={handlePersonalChange} className="border p-2 rounded" />
               <input name="linkedin" placeholder="LinkedIn" value={cv.personal.linkedin} onChange={handlePersonalChange} className="border p-2 rounded" />
            </div>
          </section>

          {/* EXPERIENCIA */}
          <section className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase">💼 Experiencia</h3>
              <button onClick={() => addItem('experience', { role: '', company: '', date: '', description: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center hover:bg-blue-50 px-2 py-1 rounded"><PlusCircle size={14}/> Añadir</button>
            </div>
            {cv.experience.map((exp) => (
              <div key={exp.id} className="bg-gray-50 p-3 rounded border relative group hover:border-blue-300 transition-colors">
                <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                <input placeholder="Cargo" value={exp.role} onChange={(e) => updateItem('experience', exp.id, 'role', e.target.value)} className="w-full bg-white border p-1 rounded text-sm font-bold mb-1" />
                <div className="grid grid-cols-2 gap-2 mb-1">
                    <input placeholder="Empresa" value={exp.company} onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                    <input placeholder="Fechas" value={exp.date} onChange={(e) => updateItem('experience', exp.id, 'date', e.target.value)} className="bg-white border p-1 rounded text-xs text-right" />
                </div>
                <textarea placeholder="Logros..." value={exp.description} onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)} className="w-full bg-white border p-1 rounded text-xs h-20 resize-y" />
              </div>
            ))}
          </section>

          {/* EDUCACIÓN */}
          <section className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase">🎓 Educación</h3>
              <button onClick={() => addItem('education', { degree: '', school: '', date: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center hover:bg-blue-50 px-2 py-1 rounded"><PlusCircle size={14}/> Añadir</button>
            </div>
            {cv.education.map((edu) => (
              <div key={edu.id} className="bg-gray-50 p-3 rounded border relative group">
                <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                <input placeholder="Título / Grado" value={edu.degree} onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)} className="w-full bg-white border p-1 rounded text-sm font-bold mb-1" />
                <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Institución" value={edu.school} onChange={(e) => updateItem('education', edu.id, 'school', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                    <input placeholder="Año" value={edu.date} onChange={(e) => updateItem('education', edu.id, 'date', e.target.value)} className="bg-white border p-1 rounded text-xs text-right" />
                </div>
              </div>
            ))}
          </section>

          {/* IDIOMAS */}
          <section className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase">🌍 Idiomas</h3>
              <button onClick={() => addItem('languages', { language: '', level: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center hover:bg-blue-50 px-2 py-1 rounded"><PlusCircle size={14}/> Añadir</button>
            </div>
            {cv.languages.map((lang) => (
              <div key={lang.id} className="bg-gray-50 p-2 rounded border relative group grid grid-cols-2 gap-2">
                <button onClick={() => removeItem('languages', lang.id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-400 opacity-0 group-hover:opacity-100 shadow border"><Trash2 size={12}/></button>
                <input placeholder="Idioma (Inglés)" value={lang.language} onChange={(e) => updateItem('languages', lang.id, 'language', e.target.value)} className="bg-white border p-1 rounded text-xs font-bold" />
                <input placeholder="Nivel (C1)" value={lang.level} onChange={(e) => updateItem('languages', lang.id, 'level', e.target.value)} className="bg-white border p-1 rounded text-xs" />
              </div>
            ))}
          </section>

           {/* SKILLS */}
           <section className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">⚡ Skills</h3>
            <textarea value={cv.skills.join(', ')} onChange={handleSkillsChange} className="w-full border p-2 rounded text-sm h-16" />
          </section>
        </div>
      </aside>

      {/* ================= PREVIEW (DERECHA) ================= */}
      <main className="flex-1 bg-gray-500 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:bg-white">
        
        <div className="relative">
          {/* GUÍA VISUAL DE CORTE DE PÁGINA (SOLO visible en pantalla, NO sale en impresión) */}
          <div className="page-break-marker absolute left-0 w-full border-b-2 border-dashed border-red-400 z-50 flex items-end justify-end pointer-events-none opacity-50" 
               style={{ top: '297mm', width: '210mm' }}>
            <span className="bg-red-400 text-white text-[10px] px-2 py-0.5 rounded-t font-bold">FIN DE PÁGINA A4</span>
          </div>

          {/* HOJA DE CV */}
          <div 
            className="cv-container bg-white shadow-2xl w-[210mm] min-h-[297mm] flex items-stretch overflow-hidden"
            style={{ 
              background: `linear-gradient(90deg, ${cv.themeColor} 0%, ${cv.themeColor} 32%, #ffffff 32%, #ffffff 100%)`
            }} 
          >
            
            {/* COLUMNA IZQUIERDA */}
            <div className="w-[32%] p-6 pt-10 flex flex-col shrink-0 text-white">
              {/* Foto */}
              <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white/30 bg-white/20">
                 {cv.personal.photoUrl ? (
                   <img src={cv.personal.photoUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                   <span className="text-4xl font-bold">{cv.personal.name.charAt(0)}</span>
                 )}
              </div>

              <div className="space-y-8 text-sm flex-1">
                {/* CONTACTO */}
                <div>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs border-b border-white/30 text-white/90">Contacto</h3>
                  <ul className="space-y-3 text-xs text-white/90">
                    <li className="flex items-center gap-3">
                      <div className="shrink-0"><Phone size={14}/></div> 
                      <span>{cv.personal.phone}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="shrink-0"><Mail size={14}/></div> 
                      <span className="break-all">{cv.personal.email}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="shrink-0"><MapPin size={14}/></div> 
                      <span>{cv.personal.location}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="shrink-0"><Linkedin size={14}/></div> 
                      <span className="break-all">{cv.personal.linkedin}</span>
                    </li>
                  </ul>
                </div>
                
                {/* SKILLS */}
                <div>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs border-b border-white/30 text-white/90">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {cv.skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded text-[10px] bg-white/20 text-white flex items-center justify-center">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* EDUCACIÓN */}
                <div>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs border-b border-white/30 text-white/90">Educación</h3>
                  {cv.education.map((edu) => (
                     <div key={edu.id} className="mb-4 text-white/90">
                       <p className="font-bold text-xs mb-0.5">{edu.degree}</p>
                       <p className="text-[10px] opacity-80">{edu.school}</p>
                       <p className="text-[10px] opacity-80">{edu.date}</p>
                     </div>
                  ))}
                </div>

                {/* IDIOMAS */}
                {cv.languages.length > 0 && (
                  <div>
                    <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs border-b border-white/30 text-white/90">Idiomas</h3>
                    {cv.languages.map((lang) => (
                      <div key={lang.id} className="mb-2 flex justify-between items-baseline text-xs text-white/90">
                        <span className="font-semibold">{lang.language}</span>
                        <span className="text-[10px] opacity-80">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className="w-[68%] p-8 pt-10 flex flex-col text-slate-800">
              <header className="mb-8 pb-4 shrink-0 border-b-2" style={{ borderColor: cv.themeColor }}>
                <h1 className="text-4xl font-extrabold uppercase tracking-tight leading-none mb-2 text-slate-900">{cv.personal.name}</h1>
                <h2 className="text-lg font-bold tracking-wide" style={{ color: cv.themeColor }}>{cv.personal.title}</h2>
              </header>

              <section className="mb-8 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-600">
                  <span className="p-1 rounded flex items-center justify-center w-5 h-5 text-white" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> 
                  <span className="mt-[1px]">Perfil</span>
                </h3>
                <p className="text-xs leading-relaxed text-justify text-slate-600">{cv.personal.summary}</p>
              </section>

              <section className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2 text-slate-600">
                  <span className="p-1 rounded flex items-center justify-center w-5 h-5 text-white" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> 
                  <span className="mt-[1px]">Experiencia</span>
                </h3>
                
                <div className="space-y-6">
                  {cv.experience.map((exp) => (
                    <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: cv.themeColor + '40' }}>
                      <div className="absolute top-[5px] w-2 h-2 rounded-full -left-[5px]" style={{ backgroundColor: cv.themeColor }}></div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm text-slate-900">{exp.role}</h4>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 whitespace-nowrap">
                          {exp.date}
                        </span>
                      </div>
                      
                      <p className="text-xs font-bold mb-2" style={{ color: cv.themeColor }}>{exp.company}</p>
                      <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}