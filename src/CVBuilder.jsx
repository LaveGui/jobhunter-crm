import { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import html2pdf from 'html2pdf.js'; // <--- CAMBIO IMPORTANTE
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Download, ArrowLeft, LayoutTemplate, Globe } from 'lucide-react';

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

  // --- CONTROLADORES ---
  const handlePersonalChange = (e) => setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  const handleSkillsChange = (e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  const addItem = (section, template) => setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  const removeItem = (section, id) => setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };

 // --- LÓGICA DE DESCARGA PDF ---
  const componentRef = useRef();

  const handleDownloadPDF = () => {
    const element = componentRef.current;
    setIsDownloading(true);

    const elementHeightPx = element.scrollHeight;
    const pxToMm = 0.264583;
    const pdfHeightMm = Math.max(elementHeightPx * pxToMm + 10, 297); // +10mm de margen extra por seguridad

    const opt = {
      margin: 0,
      filename: `CV_${cv.personal.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, // Vital para fotos externas
        logging: true, // Para ver errores en consola si falla
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: [210, pdfHeightMm], 
        orientation: 'portrait' 
      }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsDownloading(false);
      })
      .catch((err) => {
        console.error("Error al generar PDF:", err);
        setIsDownloading(false);
        alert("❌ Error: No se pudo generar el PDF. \n\nCausa probable: La foto de perfil externa está bloqueando la descarga por seguridad del navegador.\n\nPrueba borrando la URL de la foto temporalmente.");
      });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ================= EDITOR (IZQUIERDA) ================= */}
      <aside className="w-full md:w-[450px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:bg-slate-700 p-2 rounded"><ArrowLeft size={20}/></Link>
            <h2 className="font-bold">CV Studio</h2>
          </div>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className={`px-3 py-1.5 rounded text-sm font-bold flex gap-2 shadow-lg transition-all 
              ${isDownloading ? 'bg-gray-500 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/50 cursor-pointer'}`}
          >
            <Download size={16}/> {isDownloading ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          {/* TEMA & FOTO */}
          <section className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Color Tema</label>
               <input type="color" value={cv.themeColor} onChange={(e) => setCv({...cv, themeColor: e.target.value})} className="w-full h-10 rounded cursor-pointer border-0"/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto URL</label>
               <input name="photoUrl" placeholder="https://..." value={cv.personal.photoUrl} onChange={handlePersonalChange} className="w-full border p-2 rounded text-xs"/>
               <p className="text-[10px] text-gray-400 mt-1">Si falla la descarga, borra esto.</p>
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
        
        {/* CONTENEDOR DE LA HOJA */}
        <div 
          ref={componentRef} 
          className="bg-white shadow-2xl w-[210mm] flex items-stretch min-h-[297mm]"
          style={{ height: 'fit-content' }} 
        >
          
          {/* COLUMNA IZQUIERDA */}
          <div style={{ backgroundColor: cv.themeColor }} className="w-[32%] text-white p-6 pt-10 flex flex-col shrink-0">
            <div className="w-28 h-28 bg-white/20 rounded-full mx-auto mb-6 overflow-hidden border-4 border-white/30 flex items-center justify-center shrink-0">
               {cv.personal.photoUrl ? (
                 <img 
                   src={cv.personal.photoUrl} 
                   alt="Profile" 
                   className="w-full h-full object-cover" 
                   crossOrigin="anonymous" // <--- ESTO ES CLAVE PARA QUE NO FALLE
                 />
               ) : (
                 <span className="text-4xl font-bold">{cv.personal.name.charAt(0)}</span>
               )}
            </div>

            <div className="space-y-6 text-sm flex-1">
              {/* Contacto */}
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90 text-xs">Contacto</h3>
                <ul className="space-y-2 text-white/80 text-xs">
                  <li className="flex items-center gap-2"><Phone size={12}/> {cv.personal.phone}</li>
                  <li className="flex items-center gap-2"><Mail size={12}/> <span className="break-all">{cv.personal.email}</span></li>
                  <li className="flex items-center gap-2"><MapPin size={12}/> {cv.personal.location}</li>
                  <li className="flex items-center gap-2"><Linkedin size={12}/> <span className="truncate w-32">{cv.personal.linkedin}</span></li>
                </ul>
              </div>
              
              {/* Skills */}
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90 text-xs">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {cv.skills.map((s, i) => <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{s}</span>)}
                </div>
              </div>

              {/* Educación */}
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90 text-xs">Educación</h3>
                {cv.education.map((edu) => (
                   <div key={edu.id} className="mb-3 text-white/80">
                     <p className="font-bold text-xs">{edu.degree}</p>
                     <p className="text-[10px] opacity-70">{edu.school}</p>
                     <p className="text-[10px] opacity-70">{edu.date}</p>
                   </div>
                ))}
              </div>

              {/* Idiomas */}
              {cv.languages.length > 0 && (
                <div>
                  <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90 text-xs">Idiomas</h3>
                  {cv.languages.map((lang) => (
                    <div key={lang.id} className="mb-2 flex justify-between items-baseline text-white/80 text-xs">
                      <span className="font-semibold">{lang.language}</span>
                      <span className="opacity-70 text-[10px]">{lang.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="w-[68%] p-8 pt-10 text-slate-800 bg-white flex flex-col">
            <header className="mb-6 border-b-2 pb-4 shrink-0" style={{ borderColor: cv.themeColor }}>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight leading-none mb-1">{cv.personal.name}</h1>
              <h2 className="text-lg font-medium" style={{ color: cv.themeColor }}>{cv.personal.title}</h2>
            </header>

            <section className="mb-6 shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="p-1 text-white rounded" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> Perfil
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">{cv.personal.summary}</p>
            </section>

            <section className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="p-1 text-white rounded" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> Experiencia
              </h3>
              <div className="space-y-5">
                {cv.experience.map((exp) => (
                  <div key={exp.id} className="relative pl-3 border-l-2" style={{ borderColor: cv.themeColor + '40' }}>
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: cv.themeColor }}></div>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-bold text-sm">{exp.role}</h4>
                      <span className="text-[10px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{exp.date}</span>
                    </div>
                    <p className="text-xs font-semibold mb-1" style={{ color: cv.themeColor }}>{exp.company}</p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
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