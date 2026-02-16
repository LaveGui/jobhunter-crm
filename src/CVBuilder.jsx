import { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Printer, ArrowLeft, LayoutTemplate, Globe, Download, ScanEye, Settings, Type, AlignJustify, Bot, Sparkles } from 'lucide-react';
import { generateCVContent } from './services/ai'; // <--- IMPORTANTE

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
      { id: 2, degree: "Postgrado Marketing Digital", school: "Digital House", date: "2016" }
    ],
    languages: [
      { id: 1, language: "Español", level: "Nativo" },
      { id: 2, language: "Inglés", level: "C1 - Avanzado" }
    ],
    skills: ["HubSpot", "Braze", "Salesforce", "Zapier"]
  });

  const [design, setDesign] = useState({
    nameSize: 32, roleSize: 14, companySize: 12, textSize: 10, lineHeight: 1.4, sectionGap: 20,
  });

  // --- NUEVO ESTADO PARA IA ---
  const [aiConfig, setAiConfig] = useState({
    apiKey: '',
    context: '', // Aquí pegarás el contenido de tu Google Doc
    jobDescription: '' // Aquí pegarás la oferta actual
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeTab, setActiveTab] = useState('content'); // content | design | ai
  const [debugMode, setDebugMode] = useState(false);
  const componentRef = useRef();

  // --- CARGAR CONFIGURACIÓN AL INICIO (Local Storage) ---
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedContext = localStorage.getItem('gemini_context');
    if (savedKey || savedContext) {
      setAiConfig(prev => ({ ...prev, apiKey: savedKey || '', context: savedContext || '' }));
    }
  }, []);

  // --- HANDLERS ---
  const handlePersonalChange = (e) => setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  const handleSkillsChange = (e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  const addItem = (section, template) => setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  const removeItem = (section, id) => setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };
  const handlePrint = () => window.print();

  // --- HANDLER IA ---
  const handleSaveAiConfig = () => {
    localStorage.setItem('gemini_api_key', aiConfig.apiKey);
    localStorage.setItem('gemini_context', aiConfig.context);
    alert("Configuración IA guardada en tu navegador 🧠");
  };

  const handleGenerateCV = async () => {
    if (!aiConfig.apiKey || !aiConfig.context || !aiConfig.jobDescription) {
      alert("Faltan datos: Asegúrate de tener API Key, tu Contexto y la Descripción de la oferta.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCVContent(aiConfig.apiKey, aiConfig.context, aiConfig.jobDescription);
      
      // Aplicar cambios mágicos
      setCv(prev => ({
        ...prev,
        personal: { ...prev.personal, summary: result.summary },
        skills: result.skills || prev.skills,
        experience: [
          { 
            id: Date.now(), 
            role: result.experience.role, 
            company: result.experience.company, 
            date: result.experience.date || "Presente", 
            description: result.experience.description 
          },
          ...prev.experience // Mantenemos las anteriores abajo o las puedes borrar
        ]
      }));
      alert("¡CV Adaptado con éxito! Revisa el Perfil y la primera Experiencia.");
      setActiveTab('content'); // Volver a la pestaña de contenido para ver los cambios
    } catch (error) {
      alert("Error al generar: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const debugClass = debugMode ? "debug-box" : "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      <style>{`.debug-box { outline: 1px solid #ff0000 !important; } @media print { @page { margin: 0; size: A4; } body { -webkit-print-color-adjust: exact; background: white; } aside, .print-hidden { display: none !important; } main { margin: 0 !important; padding: 0 !important; width: 100% !important; } .cv-container { width: 210mm !important; min-height: 297mm !important; height: auto !important; margin: 0 !important; box-shadow: none !important; } }`}</style>

      {/* EDITOR */}
      <aside className="w-full md:w-[450px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-2"><Link to="/" className="hover:bg-slate-700 p-2 rounded"><ArrowLeft size={20}/></Link><h2 className="font-bold">CV Studio</h2></div>
          <div className="flex items-center gap-2">
             <button onClick={() => setDebugMode(!debugMode)} className={`text-[10px] px-2 py-1 rounded border ${debugMode ? 'bg-red-500 border-red-500' : 'border-gray-600 text-gray-400'}`}><ScanEye size={14}/></button>
             <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-bold flex gap-2"><Printer size={16}/> PDF</button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b sticky top-[60px] bg-white z-10">
          <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><LayoutTemplate size={14}/> Contenido</button>
          <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><Settings size={14}/> Diseño</button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-400'}`}><Bot size={14}/> IA Config</button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          
          {/* === TAB: IA CONFIG === */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-xs font-bold text-purple-800 uppercase mb-4 flex items-center gap-2"><Settings size={14}/> Configuración del Cerebro</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tu API Key de Gemini</label>
                    <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})} className="w-full border p-2 rounded text-xs" placeholder="Pega aquí tu clave (AIza...)" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tu Contexto Maestro (Drive Doc)</label>
                    <textarea value={aiConfig.context} onChange={(e) => setAiConfig({...aiConfig, context: e.target.value})} className="w-full border p-2 rounded text-xs h-32" placeholder="Copia y pega aquí TODO el contenido de tu documento de Google Drive con tu perfil, logros e historia..." />
                  </div>
                  <button onClick={handleSaveAiConfig} className="w-full bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-slate-700">Guardar Configuración</button>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-4 flex items-center gap-2"><Sparkles size={14}/> Generador de Adaptación</h3>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descripción de la Oferta (Job Description)</label>
                  <textarea value={aiConfig.jobDescription} onChange={(e) => setAiConfig({...aiConfig, jobDescription: e.target.value})} className="w-full border p-2 rounded text-xs h-32 mb-3" placeholder="Pega aquí la descripción del puesto..." />
                  
                  <button 
                    onClick={handleGenerateCV} 
                    disabled={isGenerating}
                    className={`w-full py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-white
                      ${isGenerating ? 'bg-purple-300 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 hover:scale-[1.02]'}`}
                  >
                    {isGenerating ? 'Analizando y Redactando...' : <><Bot size={18}/> Generar CV Adaptado</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === TAB: CONTENIDO === */}
          {activeTab === 'content' && (
            <>
              {/* TEMA & FOTO */}
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
                <h3 className="text-xs font-bold text-gray-400 uppercase">👤 Personal & Perfil</h3>
                <input name="name" placeholder="Nombre" value={cv.personal.name} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm font-bold" />
                <input name="title" placeholder="Título" value={cv.personal.title} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm" />
                
                <label className="block text-[10px] text-gray-400 uppercase font-bold mt-2">Resumen Perfil (Barra Lateral)</label>
                <textarea name="summary" placeholder="Perfil profesional..." value={cv.personal.summary} onChange={handlePersonalChange} className="w-full border p-2 rounded text-sm h-24" />
                
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
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
                  <button onClick={() => addItem('education', { degree: '', school: '', date: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center"><PlusCircle size={14}/> Añadir</button>
                </div>
                {cv.education.map((edu) => (
                  <div key={edu.id} className="bg-gray-50 p-3 rounded border relative group">
                    <button onClick={() => removeItem('education', edu.id)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    <input placeholder="Título" value={edu.degree} onChange={(e) => updateItem('education', edu.id, 'degree', e.target.value)} className="w-full bg-white border p-1 rounded text-sm font-bold mb-1" />
                    <input placeholder="Institución" value={edu.school} onChange={(e) => updateItem('education', edu.id, 'school', e.target.value)} className="bg-white border p-1 rounded text-xs mb-1" />
                    <input placeholder="Año" value={edu.date} onChange={(e) => updateItem('education', edu.id, 'date', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                  </div>
                ))}
              </section>

              {/* IDIOMAS */}
              <section className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">🌍 Idiomas</h3>
                  <button onClick={() => addItem('languages', { language: '', level: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center"><PlusCircle size={14}/> Añadir</button>
                </div>
                {cv.languages.map((lang) => (
                  <div key={lang.id} className="bg-gray-50 p-2 rounded border relative group grid grid-cols-2 gap-2">
                    <button onClick={() => removeItem('languages', lang.id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-400 opacity-0 group-hover:opacity-100 shadow border"><Trash2 size={12}/></button>
                    <input placeholder="Idioma" value={lang.language} onChange={(e) => updateItem('languages', lang.id, 'language', e.target.value)} className="bg-white border p-1 rounded text-xs font-bold" />
                    <input placeholder="Nivel" value={lang.level} onChange={(e) => updateItem('languages', lang.id, 'level', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                  </div>
                ))}
              </section>

              <section className="space-y-2 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase">⚡ Skills</h3>
                <textarea value={cv.skills.join(', ')} onChange={handleSkillsChange} className="w-full border p-2 rounded text-sm h-16" />
              </section>
            </>
          )}

          {/* === TAB: DISEÑO === */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-4 flex items-center gap-2"><Type size={14}/> Tipografía</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Nombre Principal <span>{design.nameSize}px</span></label><input type="range" min="20" max="60" value={design.nameSize} onChange={(e) => setDesign({...design, nameSize: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Cargo / Título <span>{design.roleSize}px</span></label><input type="range" min="10" max="24" value={design.roleSize} onChange={(e) => setDesign({...design, roleSize: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Empresa <span>{design.companySize}px</span></label><input type="range" min="8" max="18" value={design.companySize} onChange={(e) => setDesign({...design, companySize: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Texto Descripciones <span>{design.textSize}px</span></label><input type="range" min="8" max="16" value={design.textSize} onChange={(e) => setDesign({...design, textSize: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-4 flex items-center gap-2"><AlignJustify size={14}/> Espaciado</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Interlineado <span>{design.lineHeight}</span></label><input type="range" min="1" max="2" step="0.1" value={design.lineHeight} onChange={(e) => setDesign({...design, lineHeight: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Separación Secciones <span>{design.sectionGap}px</span></label><input type="range" min="5" max="50" value={design.sectionGap} onChange={(e) => setDesign({...design, sectionGap: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* PREVIEW */}
      <main className="flex-1 bg-gray-500 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:bg-white">
        <div className="relative">
          <div className="print-hidden absolute left-0 w-full border-b-2 border-dashed border-red-400 z-50 flex items-end justify-end pointer-events-none opacity-50" style={{ top: '297mm', width: '210mm' }}><span className="bg-red-400 text-white text-[10px] px-2 py-0.5 rounded-t font-bold">FIN DE PÁGINA 1</span></div>
          <div className="cv-container bg-white shadow-2xl w-[210mm] min-h-[297mm] flex items-stretch overflow-hidden" style={{ background: `linear-gradient(90deg, ${cv.themeColor} 0%, ${cv.themeColor} 32%, #ffffff 32%, #ffffff 100%)` }}>
            
            {/* IZQUIERDA */}
            <div className={`w-[32%] p-6 pt-10 flex flex-col shrink-0 text-white ${debugClass}`}>
              <div className={`w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white/30 bg-white/20 ${debugClass}`}>
                 {cv.personal.photoUrl ? <img src={cv.personal.photoUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-4xl font-bold">{cv.personal.name.charAt(0)}</span>}
              </div>
              <div className="space-y-8 flex-1">
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90 flex items-center gap-2"><LayoutTemplate size={12}/> Perfil</h3>
                  <p className="text-[10px] leading-relaxed text-white/90 text-justify whitespace-pre-line">{cv.personal.summary}</p>
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">Contacto</h3>
                  <ul className="space-y-3 text-[10px] text-white/90">
                    <li className="flex items-center gap-3"><div className="shrink-0"><Phone size={12}/></div> <span>{cv.personal.phone}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><Mail size={12}/></div> <span className="break-all">{cv.personal.email}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><MapPin size={12}/></div> <span>{cv.personal.location}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><Linkedin size={12}/></div> <span className="break-all">{cv.personal.linkedin}</span></li>
                  </ul>
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">Skills</h3>
                  <div className="flex flex-wrap gap-2">{cv.skills.map((s, i) => <span key={i} className="px-2 py-1 rounded text-[10px] bg-white/20 text-white flex items-center justify-center">{s}</span>)}</div>
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">Educación</h3>
                  {cv.education.map((edu) => (
                     <div key={edu.id} className="mb-4 text-white/90"><p className="font-bold text-[10px] mb-0.5">{edu.degree}</p><p className="text-[9px] opacity-80">{edu.school}</p><p className="text-[9px] opacity-80">{edu.date}</p></div>
                  ))}
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">Idiomas</h3>
                  {cv.languages.map((lang) => (
                    <div key={lang.id} className="mb-2 flex justify-between items-baseline text-[10px] text-white/90"><span className="font-semibold">{lang.language}</span><span className="opacity-80">{lang.level}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* DERECHA */}
            <div className={`w-[68%] p-8 pt-12 flex flex-col text-slate-800 ${debugClass}`}>
              <header className="mb-8 pb-4 shrink-0 border-b-2" style={{ borderColor: cv.themeColor }}>
                <h1 className="font-extrabold uppercase tracking-tight leading-none mb-2 text-slate-900" style={{ fontSize: `${design.nameSize}px` }}>{cv.personal.name}</h1>
                <h2 className="font-bold tracking-wide" style={{ color: cv.themeColor, fontSize: '18px' }}>{cv.personal.title}</h2>
              </header>
              <section className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-slate-600"><span className="p-1 rounded flex items-center justify-center w-5 h-5 text-white" style={{ backgroundColor: cv.themeColor }}><LayoutTemplate size={12}/></span> <span className="mt-[1px]">Experiencia Profesional</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${design.sectionGap}px` }}>
                  {cv.experience.map((exp) => (
                    <div key={exp.id} className={`relative pl-4 border-l-2 ${debugClass}`} style={{ borderColor: cv.themeColor + '40' }}>
                      <div className="absolute top-[5px] w-2 h-2 rounded-full -left-[5px]" style={{ backgroundColor: cv.themeColor }}></div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-900" style={{ fontSize: `${design.roleSize}px` }}>{exp.role}</h4>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{exp.date}</span>
                      </div>
                      <p className="font-bold mb-2" style={{ color: cv.themeColor, fontSize: `${design.companySize}px` }}>{exp.company}</p>
                      <p className="whitespace-pre-line text-slate-600" style={{ fontSize: `${design.textSize}px`, lineHeight: design.lineHeight }}>{exp.description}</p>
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