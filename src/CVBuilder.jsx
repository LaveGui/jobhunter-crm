import { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import html2pdf from 'html2pdf.js';
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Printer, ArrowLeft, LayoutTemplate, Globe, Download, ScanEye } from 'lucide-react';

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

  const [isDownloading, setIsDownloading] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // <--- NUEVO ESTADO DEBUG
  const componentRef = useRef();

  // --- CONTROLADORES ---
  const handlePersonalChange = (e) => setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  const handleSkillsChange = (e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  const addItem = (section, template) => setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  const removeItem = (section, id) => setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };

  // --- GENERADOR PDF ---
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const element = componentRef.current;

    try {
        const elementHeightPx = element.scrollHeight;
        const pdfHeightMm = (elementHeightPx * 0.264583) + 2;

        const opt = {
          margin: 0,
          filename: `CV_${cv.personal.name.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0,
            backgroundColor: '#ffffff',
            letterRendering: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: [210, pdfHeightMm], 
            orientation: 'portrait' 
          }
        };

        await html2pdf().set(opt).from(element).save();
        setIsDownloading(false);

    } catch (err) {
        console.error("PDF Error:", err);
        setIsDownloading(false);
        alert(`❌ Error: ${err.message}`);
    }
  };

  // --- CLASES PARA DEBUGGING VISUAL ---
  // Si debugMode es true, añadimos bordes rojos a todo
  const debugClass = debugMode ? "outline outline-1 outline-red-500/50 bg-red-500/10" : "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ================= EDITOR (IZQUIERDA) ================= */}
      <aside className="w-full md:w-[450px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        {/* Header con Toggle Debug */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:bg-slate-700 p-2 rounded"><ArrowLeft size={20}/></Link>
            <h2 className="font-bold">CV Studio</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* BOTÓN DEBUG */}
            <button 
              onClick={() => setDebugMode(!debugMode)}
              className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 transition-all
                ${debugMode ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-gray-400 border-gray-600 hover:text-white'}`}
            >
              <ScanEye size={12}/> {debugMode ? 'Regla ON' : 'Regla OFF'}
            </button>

            <button 
              onClick={handleDownloadPDF} 
              disabled={isDownloading}
              className={`px-3 py-1.5 rounded text-sm font-bold flex gap-2 shadow-lg transition-all 
                ${isDownloading ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
            >
              {isDownloading ? '...' : <><Download size={16}/> PDF</>}
            </button>
          </div>
        </div>

        {/* Formulario */}
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
      <main className="flex-1 bg-gray-500 overflow-y-auto p-4 md:p-8 flex justify-center">
        
        {/* HOJA DE CV */}
        <div 
          ref={componentRef}
          className={`shadow-2xl w-[210mm] flex items-stretch min-h-[297mm] ${debugClass}`}
          style={{ 
            height: 'fit-content', 
            background: `linear-gradient(90deg, ${cv.themeColor} 0%, ${cv.themeColor} 32%, #ffffff 32%, #ffffff 100%)`,
            color: '#000000' 
          }} 
        >
          
          {/* COLUMNA IZQUIERDA */}
          <div 
            className={`w-[32%] p-6 pt-10 flex flex-col shrink-0 ${debugClass}`}
            style={{ color: '#ffffff' }}
          >
            {/* Foto */}
            <div className={`w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden flex items-center justify-center shrink-0 ${debugClass}`} style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.3)' }}>
               {cv.personal.photoUrl ? (
                 <img src={cv.personal.photoUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
               ) : (
                 <span className="text-4xl font-bold" style={{ color: '#ffffff' }}>{cv.personal.name.charAt(0)}</span>
               )}
            </div>

            <div className="space-y-8 text-sm flex-1">
              
              {/* CONTACTO */}
              <div className={debugClass}>
                <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}>Contacto</h3>
                <ul className="space-y-3 text-xs" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {/* ALINEACIÓN: flex items-center estricto */}
                  <li className={`flex items-center gap-3 ${debugClass}`}>
                    <div className="shrink-0 flex items-center justify-center w-4 h-4"><Phone size={14}/></div> 
                    <span className="leading-none">{cv.personal.phone}</span>
                  </li>
                  <li className={`flex items-center gap-3 ${debugClass}`}>
                    <div className="shrink-0 flex items-center justify-center w-4 h-4"><Mail size={14}/></div> 
                    <span className="break-all leading-none">{cv.personal.email}</span>
                  </li>
                  <li className={`flex items-center gap-3 ${debugClass}`}>
                    <div className="shrink-0 flex items-center justify-center w-4 h-4"><MapPin size={14}/></div> 
                    <span className="leading-none">{cv.personal.location}</span>
                  </li>
                  <li className={`flex items-center gap-3 ${debugClass}`}>
                    <div className="shrink-0 flex items-center justify-center w-4 h-4"><Linkedin size={14}/></div> 
                    <span className="break-all leading-none">{cv.personal.linkedin}</span>
                  </li>
                </ul>
              </div>
              
              {/* SKILLS */}
              <div className={debugClass}>
                <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}>Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((s, i) => (
                    // CENTRADO: flex center + leading-none + padding exacto
                    <span key={i} className={`px-2 py-1.5 rounded text-[10px] flex items-center justify-center leading-none ${debugClass}`} style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* EDUCACIÓN */}
              <div className={debugClass}>
                <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}>Educación</h3>
                {cv.education.map((edu) => (
                   <div key={edu.id} className={`mb-4 ${debugClass}`} style={{ color: 'rgba(255,255,255,0.9)' }}>
                     <p className="font-bold text-xs mb-0.5 leading-tight">{edu.degree}</p>
                     <p className="text-[10px] leading-tight" style={{ opacity: 0.8 }}>{edu.school}</p>
                     <p className="text-[10px] leading-tight" style={{ opacity: 0.8 }}>{edu.date}</p>
                   </div>
                ))}
              </div>

              {/* IDIOMAS */}
              {cv.languages.length > 0 && (
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-2 text-xs" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}>Idiomas</h3>
                  {cv.languages.map((lang) => (
                    <div key={lang.id} className={`mb-2 flex justify-between items-baseline text-xs ${debugClass}`} style={{ color: 'rgba(255,255,255,0.9)' }}>
                      <span className="font-semibold">{lang.language}</span>
                      <span className="text-[10px]" style={{ opacity: 0.8 }}>{lang.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className={`w-[68%] p-8 pt-10 flex flex-col ${debugClass}`} style={{ backgroundColor: 'transparent', color: '#1e293b' }}>
            {/* Header */}
            <header className={`mb-8 pb-4 shrink-0 ${debugClass}`} style={{ borderBottom: `2px solid ${cv.themeColor}` }}>
              <h1 className="text-4xl font-extrabold uppercase tracking-tight leading-none mb-2" style={{ color: '#1e293b' }}>{cv.personal.name}</h1>
              <h2 className="text-lg font-bold tracking-wide leading-none" style={{ color: cv.themeColor }}>{cv.personal.title}</h2>
            </header>

            {/* Perfil */}
            <section className={`mb-8 shrink-0 ${debugClass}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#334155' }}>
                <span className="p-1 rounded flex items-center justify-center w-5 h-5" style={{ backgroundColor: cv.themeColor, color: '#ffffff' }}><LayoutTemplate size={12}/></span> 
                <span className="leading-none mt-[1px]">Perfil</span>
              </h3>
              <p className="text-xs leading-relaxed text-justify" style={{ color: '#475569' }}>{cv.personal.summary}</p>
            </section>

            {/* Experiencia */}
            <section className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: '#334155' }}>
                <span className="p-1 rounded flex items-center justify-center w-5 h-5" style={{ backgroundColor: cv.themeColor, color: '#ffffff' }}><LayoutTemplate size={12}/></span> 
                <span className="leading-none mt-[1px]">Experiencia</span>
              </h3>
              
              <div className="space-y-6">
                {cv.experience.map((exp) => (
                  <div key={exp.id} className={`relative pl-4 ${debugClass}`} style={{ borderLeft: `2px solid ${cv.themeColor}40` }}>
                    
                    {/* Punto del Timeline - Posición absoluta estricta */}
                    <div className="absolute top-[6px] w-2 h-2 rounded-full" style={{ backgroundColor: cv.themeColor, left: '-5px' }}></div>
                    
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm leading-none" style={{ color: '#1e293b' }}>{exp.role}</h4>
                      {/* Fecha Badge */}
                      <span className="text-[10px] font-bold px-2 py-1 rounded flex items-center justify-center leading-none whitespace-nowrap" style={{ backgroundColor: '#f3f4f6', color: '#64748b' }}>
                        {exp.date}
                      </span>
                    </div>
                    
                    <p className="text-xs font-bold mb-2 leading-tight" style={{ color: cv.themeColor }}>{exp.company}</p>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#475569' }}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}