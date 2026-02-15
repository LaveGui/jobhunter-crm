import { useState, useRef } from 'react';
import { Link } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Printer, ArrowLeft, LayoutTemplate, GraduationCap } from 'lucide-react';

export default function CVBuilder() {
  // --- ESTADO INICIAL ---
  const [cv, setCv] = useState({
    themeColor: '#2563eb',
    personal: {
      name: "TU NOMBRE",
      title: "Tu Cargo Objetivo",
      email: "email@ejemplo.com",
      phone: "+34 600 000 000",
      location: "Madrid, España",
      linkedin: "linkedin.com/in/tu-perfil",
      photoUrl: "https://media.licdn.com/dms/image/v2/D4D03AQHeo6jBDnImhg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1719770203810?e=1772668800&v=beta&t=bpce329V0MDDEgr3KpEUot8XPT4bDR11HJc4E4KNVgY", // URL de la foto
      summary: "Resumen profesional..."
    },
    experience: [
      { id: 1, role: "Cargo", company: "Empresa", date: "2021 - Presente", description: "Descripción de logros..." }
    ],
    education: [
      { id: 1, degree: "Grado / Máster", school: "Universidad / Institución", date: "2018" }
    ],
    skills: ["Habilidad 1", "Habilidad 2"]
  });

  // --- CONTROLADORES ---
  const handlePersonalChange = (e) => {
    setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  };

  const handleSkillsChange = (e) => {
    setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  };

  // Generic Handlers for Arrays (Experience & Education)
  const addItem = (section, template) => {
    setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  };

  const removeItem = (section, id) => {
    setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  };

  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };

  // --- IMPRESIÓN ---
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `CV_${cv.personal.name}`,
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ----------------- EDITOR (IZQUIERDA) ----------------- */}
      <aside className="w-full md:w-[420px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:bg-slate-700 p-2 rounded"><ArrowLeft size={20}/></Link>
            <h2 className="font-bold">CV Studio</h2>
          </div>
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-bold flex gap-2"><Printer size={16}/> PDF</button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          {/* TEMA & FOTO */}
          <section className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Color Tema</label>
               <input type="color" value={cv.themeColor} onChange={(e) => setCv({...cv, themeColor: e.target.value})} className="w-full h-10 rounded cursor-pointer border-0"/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Foto (URL)</label>
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
            <div className="flex justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase">💼 Experiencia</h3>
              <button onClick={() => addItem('experience', { role: '', company: '', date: '', description: '' })} className="text-blue-600 text-xs font-bold flex gap-1"><PlusCircle size={14}/> Añadir</button>
            </div>
            {cv.experience.map((exp) => (
              <div key={exp.id} className="bg-gray-50 p-3 rounded border relative group">
                <button onClick={() => removeItem('experience', exp.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                <input placeholder="Cargo" value={exp.role} onChange={(e) => updateItem('experience', exp.id, 'role', e.target.value)} className="w-full bg-white border p-1 rounded text-sm font-bold mb-1" />
                <div className="grid grid-cols-2 gap-2 mb-1">
                    <input placeholder="Empresa" value={exp.company} onChange={(e) => updateItem('experience', exp.id, 'company', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                    <input placeholder="Fechas" value={exp.date} onChange={(e) => updateItem('experience', exp.id, 'date', e.target.value)} className="bg-white border p-1 rounded text-xs text-right" />
                </div>
                <textarea placeholder="Logros..." value={exp.description} onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)} className="w-full bg-white border p-1 rounded text-xs h-16" />
              </div>
            ))}
          </section>

          {/* EDUCACIÓN (NUEVO) */}
          <section className="space-y-4 border-t pt-4">
            <div className="flex justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase">🎓 Educación</h3>
              <button onClick={() => addItem('education', { degree: '', school: '', date: '' })} className="text-blue-600 text-xs font-bold flex gap-1"><PlusCircle size={14}/> Añadir</button>
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

           {/* SKILLS */}
           <section className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">⚡ Skills (separar con comas)</h3>
            <textarea value={cv.skills.join(', ')} onChange={handleSkillsChange} className="w-full border p-2 rounded text-sm h-16" />
          </section>
        </div>
      </aside>

      {/* ----------------- PREVIEW A4 (DERECHA) ----------------- */}
      <main className="flex-1 bg-gray-500 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:bg-white">
        <div ref={componentRef} className="bg-white shadow-2xl w-[210mm] min-h-[297mm] flex print:w-full print:shadow-none">
          
          {/* SIDEBAR IZQUIERDA (Color) */}
          <div style={{ backgroundColor: cv.themeColor }} className="w-[32%] text-white p-8 pt-12">
            
            {/* FOTO (Si hay URL, se muestra. Si no, inicial) */}
            <div className="w-28 h-28 bg-white/20 rounded-full mx-auto mb-6 overflow-hidden border-4 border-white/30 flex items-center justify-center">
               {cv.personal.photoUrl ? (
                 <img src={cv.personal.photoUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-4xl font-bold">{cv.personal.name.charAt(0)}</span>
               )}
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90">Contacto</h3>
                <ul className="space-y-2 text-white/80 text-xs">
                  <li className="flex items-center gap-2"><Phone size={12}/> {cv.personal.phone}</li>
                  <li className="flex items-center gap-2"><Mail size={12}/> <span className="break-all">{cv.personal.email}</span></li>
                  <li className="flex items-center gap-2"><MapPin size={12}/> {cv.personal.location}</li>
                  <li className="flex items-center gap-2"><Linkedin size={12}/> <span className="truncate w-32">{cv.personal.linkedin}</span></li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {cv.skills.map((s, i) => <span key={i} className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{s}</span>)}
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-wider mb-2 border-b border-white/30 pb-1 text-white/90">Educación</h3>
                {cv.education.map((edu) => (
                   <div key={edu.id} className="mb-3 text-white/80">
                     <p className="font-bold text-xs">{edu.degree}</p>
                     <p className="text-[10px] opacity-70">{edu.school}</p>
                     <p className="text-[10px] opacity-70">{edu.date}</p>
                   </div>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="w-[68%] p-8 pt-12 text-slate-800">
            <header className="mb-6 border-b-2 pb-4" style={{ borderColor: cv.themeColor }}>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight leading-none mb-1">{cv.personal.name}</h1>
              <h2 className="text-lg font-medium" style={{ color: cv.themeColor }}>{cv.personal.title}</h2>
            </header>

            <section className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="p-1 text-white rounded" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> Perfil
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">{cv.personal.summary}</p>
            </section>

            <section>
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