import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Trash2, PlusCircle, Printer, ArrowLeft, LayoutTemplate, Globe, Download, ScanEye, Settings, Type, AlignJustify, Briefcase, Save, History, Sparkles } from 'lucide-react'; 
import useGoogleSheets from './hooks/useGoogleSheets';

// --- COMPONENTE AUXILIAR PARA NEGRITAS Y LISTAS ---
const RichText = ({ text, className, style }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className={`whitespace-pre-wrap ${className}`} style={style}>
      {lines.map((line, index) => {
        const isList = line.trim().startsWith('- ') || line.trim().startsWith('• ');
        const cleanLine = isList ? line.trim().replace(/^[-•]\s*/, '') : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const content = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        if (isList) {
          return (
            <div key={index} className="flex items-start gap-2 ml-1 relative my-0.5">
              <span className="mt-[0.45em] w-1 h-1 rounded-full bg-current shrink-0 opacity-70"></span>
              <span className="flex-1">{content}</span>
            </div>
          );
        }
        return <div key={index} className="min-h-[1em]">{content}</div>;
      })}
    </div>
  );
};

// --- FUNCIÓN DE EXPORTACIÓN (TEXTO PLANO PARA EXCEL) ---
const cvToString = (cv) => {
  let text = `*** PERFIL ***\n${cv.personal.summary}\n\n`;
  text += `*** EXPERIENCIA ***\n`;
  cv.experience.forEach(exp => {
    text += `• ${exp.company} | ${exp.role} | ${exp.date}\n${exp.description}\n\n`;
  });
  text += `*** SKILLS ***\n${cv.skills.join(', ')}`;
  return text;
};

// --- DICCIONARIO PARA PASAR SECCIONES AL INGLÉS ---
const TRANSLATIONS = {
  es: {
    profile: "Perfil",
    contact: "Contacto",
    skills: "Skills",
    education: "Educación",
    languages: "Idiomas",
    experience: "Experiencia Profesional",
    "Español": "Spanish",
    "Inglés": "English",
    "Nativo": "Native",
    "Avanzado": "Advanced"
  },
  en: {
    profile: "Profile",
    contact: "Personal Information",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
    experience: "Professional Experience",
    "Español": "Spanish",
    "Inglés": "English",
    "Nativo": "Native",
    "Avanzado": "Advanced"
  }
};

export default function CVBuilder() {
  const location = useLocation();
  const { jobs, updateJob } = useGoogleSheets();
  
  // --- ESTADO INICIAL DEL CV ---
  const [cv, setCv] = useState({
    themeColor: '#2563eb',
    personal: {
      name: "Guido Lavesari",
      title: "Product Marketing Manager",
      email: "glavesari@gmail.com",
      phone: "+34 666 110 145",
      location: "Valencia, España",
      linkedin: "/in/guidolavesari",
      photoUrl: "https://raw.githubusercontent.com/LaveGui/jobhunter-crm/43074c8a146e29faebb4f02e9259359799cd2d6b/public/foto-guido.jpg", 
      summary: "Profesional enfocado en **Sales Enablement** y **Arquitectura de Software**.\n- Experto en CRM\n- Liderazgo de equipos ágiles"
    },
    experience: [
      { id: 1, role: "Product Marketing Specialist", company: "Jeff App", date: "2022 - 2023", description: "- Lideré estrategia de **Retención** con Braze.\n- Aumenté el ROI un 20% en 3 meses." }
    ],
    education: [
      { id: 1, degree: "Master IA e Innovación", school: "Founderz", date: "2024" },
      { id: 2, degree: "Postgrado Marketing Digital", school: "Digital House", date: "2016" },
      { id: 3, degree: "Licenciatura en Marketing", school: "UADE", date: "2015" }
    ],
    languages: [
      { id: 1, language: "Español", level: "Nativo" },
      { id: 2, language: "Inglés", level: "C1 - Avanzado" }
    ],
    skills: ["HubSpot", "Braze", "Salesforce", "Zapier"]
  });

  const [design, setDesign] = useState({
    nameSize: 32, roleSize: 14, companySize: 12, textSize: 9, lineHeight: 1.3, sectionGap: 16,
    leftTextSize: 10, leftLineHeight: 1.4,
    paddingTop: 32, headerMarginBottom: 24, headerToExpGap: 20,
  });
  const [loadingQA, setLoadingQA] = useState(false);
  const [qaResult, setQaResult] = useState(null); // Guardará el objeto de feedback de Groq
  const [showQaModal, setShowQaModal] = useState(false); // Para abrir/cerrar la ventana de resultados

  const [targetJob, setTargetJob] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); 
  const [debugMode, setDebugMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lang, setLang] = useState('es');
  const [loadingIA, setLoadingIA] = useState(false);

  // Estados de importación JSON
  const [mostrarImportJson, setMostrarImportJson] = useState(false);
  const [jsonImport, setJsonImport] = useState('');
  const [errorJson, setErrorJson] = useState('');

  useEffect(() => {
    if (location.state?.jobContext) {
      setTargetJob(location.state.jobContext);
    }
  }, [location]);

  const t = (key) => TRANSLATIONS[lang][key] || key;

  // --- FUNCIÓN CONECTADA CON APPS SCRIPT ---
  const generarEstrategiaIA = async () => {
    if (!targetJob) return;
    setLoadingIA(true);
    
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzKzkPB0Rm_vqLFNRQocEAsfLcw7aIAZcRdceJmWRJmLLG0QA5qUx3vjFpi3PnlknJWvQ/exec"; 

    try {
      const response = await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "generarPromptCV",
          company: targetJob.company || "",
          title: targetJob.role || targetJob.title || "",
          description: targetJob.description || ""
        })
      });

      const resultado = await response.json();

      if (resultado.error || resultado.result === "error") {
        throw new Error(resultado.message || "Error devuelto por Apps Script");
      }

      const promptParaCopiar = resultado.prompt_final;

      if (promptParaCopiar) {
        await navigator.clipboard.writeText(promptParaCopiar);
        alert("🚀 ¡Estrategia personalizada y Prompt Final copiados al portapapeles listos para tu Gem!");
      } else {
        alert("⚠️ La IA se ejecutó pero no devolvió el campo 'prompt_final'. Revisa los logs de Apps Script.");
      }

    } catch (error) {
      console.error("Error al conectar con la IA de Apps Script:", error);
      alert("❌ Error al generar el prompt con IA. Asegúrate de haber publicado la última versión del script como Web App pública.");
    } finally {
      setLoadingIA(false);
    }
  };

  const generarYAutocompletarCV = async () => {
  if (!targetJob) {
    alert("⚠️ Vincula primero una oportunidad.");
    return;
  }
  setLoadingQA(true);

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzKzkPB0Rm_vqLFNRQocEAsfLcw7aIAZcRdceJmWRJmLLG0QA5qUx3vjFpi3PnlknJWvQ/exec";

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "generarCVCompleto",
        company: targetJob.company || "",
        title: targetJob.role || targetJob.title || "",
        description: targetJob.description || ""
      })
    });

    const resultado = await response.json();
    if (resultado.result !== "success") throw new Error(resultado.message);

    const datos = resultado.cv_json;

    setCv(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        title: datos.titulo_profesional || prev.personal.title,
        summary: datos.summary || prev.personal.summary
      },
      skills: Array.isArray(datos.skills) ? datos.skills : prev.skills,
      experience: Array.isArray(datos.experiences)
        ? datos.experiences.map((exp, i) => ({
            id: Date.now() + i,
            role: exp.role || '',
            company: exp.company || '',
            date: exp.date || '',
            description: Array.isArray(exp.bullets)
              ? exp.bullets.map(b => `- ${b}`).join('\n')
              : (exp.description || '')
          }))
        : prev.experience,
      education: Array.isArray(datos.education)
        ? datos.education.map((edu, i) => ({
            id: Date.now() + i + 50,
            degree: edu.degree || '',
            school: edu.school || '',
            date: edu.date || ''
          }))
        : prev.education
    }));

    alert("✅ CV generado y cargado. Revisa, ajusta y descarga.");

  } catch (error) {
    alert("❌ Error: " + error.message);
    console.error(error);
  } finally {
    setLoadingQA(false);
  }
};

  const importarDesdeJson = () => {
    setErrorJson('');
    let datos;
    try {
      datos = JSON.parse(jsonImport);
    } catch(e) {
      setErrorJson('JSON inválido. Revisa que esté bien formateado (comillas dobles, comas, etc.).');
      return;
    }

    try {
      const listaExperiencias = datos.experiencias || datos.experiences;
      const listaHerramientas = datos.herramientas || datos.skills || datos.skills_list;
      const resumenPerfil = datos.summary || datos.resumen || datos.perfil;
      const tituloPro = datos.titulo_profesional || datos.title || datos.professional_title;
      const listaEducacion = datos.educacion || datos.education;

      setCv(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          title: tituloPro || prev.personal.title,
          summary: resumenPerfil || prev.personal.summary
        },
        skills: Array.isArray(listaHerramientas) ? listaHerramientas : prev.skills,
        
        experience: listaExperiencias 
          ? listaExperiencias.map((exp, index) => {
              let textDescription = '';
              if (Array.isArray(exp.bullets)) {
                textDescription = exp.bullets
                  .map(b => b.trim().startsWith('-') || b.trim().startsWith('•') ? b : `- ${b}`)
                  .join('\n');
              } else {
                textDescription = exp.descripcion || exp.description || '';
              }

              return {
                id: Date.now() + index,
                role: exp.rol || exp.role || '', 
                company: exp.empresa || exp.company || '', 
                date: exp.periodo || exp.date || '', 
                description: textDescription
              };
            })
          : prev.experience,

        education: listaEducacion
          ? listaEducacion.map((edu, index) => ({
              id: Date.now() + index + 50,
              degree: edu.titulo || edu.degree || '',
              school: edu.institucion || edu.school || '',
              date: edu.periodo || edu.date || ''
            }))
          : prev.education
      }));

      setMostrarImportJson(false);
      setJsonImport('');

    } catch(e) {
      setErrorJson('Error al mapear los campos del JSON. Revisa las llaves de mapeo.');
      console.error(e);
    }
  };

  // --- HANDLERS BÁSICOS ---
  const handlePersonalChange = (e) => setCv({ ...cv, personal: { ...cv.personal, [e.target.name]: e.target.value } });
  const handleSkillsChange = (e) => setCv({ ...cv, skills: e.target.value.split(',').map(s => s.trim()) });
  const addItem = (section, template) => setCv({ ...cv, [section]: [...cv[section], { ...template, id: Date.now() }] });
  const removeItem = (section, id) => setCv({ ...cv, [section]: cv[section].filter(i => i.id !== id) });
  const updateItem = (section, id, field, value) => {
    const updated = cv[section].map(i => i.id === id ? { ...i, [field]: value } : i);
    setCv({ ...cv, [section]: updated });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    let suffix = "";
    if (targetJob?.company) {
      const initials = targetJob.company.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      suffix = `_${initials}`;
    }
    document.title = `CV_GuidoLavesari${suffix}`;
    window.print();
    document.title = originalTitle;
  };

  const handleSave = async () => {
    if (!targetJob) return;
    const cvTextDump = cvToString(cv);
    const isAlreadyApplied = ['Aplicado', 'Entrevista', 'Oferta'].includes(targetJob.status);
    let newStatus = targetJob.status;
    let newDateApplied = targetJob.date_applied;

    if (!isAlreadyApplied) {
      if (window.confirm(`¿Quieres marcar la oferta en "${targetJob.company}" como APLICADA además de guardar el CV?`)) {
        newStatus = 'Aplicado';
        newDateApplied = new Date().toISOString().split('T')[0];
      }
    }

    try {
      const payload = { ...targetJob, status: newStatus, cv_text: cvTextDump, date_applied: newDateApplied, last_updated: new Date().toISOString() };
      await updateJob(payload);
      setTargetJob(payload);
      alert("✅ ¡CV guardado correctamente en tu base de datos!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Hubo un error al guardar. Revisa tu conexión a Sheets.");
    }
  };

  const importCVFromHistory = (historyText) => {
    if (!historyText) return;
    if (!window.confirm("⚠️ Esto sobrescribirá el Perfil, Experiencia y Skills actuales con los datos seleccionados. ¿Continuar?")) return;

    try {
      const summaryMatch = historyText.match(/\*\*\* PERFIL \*\*\*\n([\s\S]*?)\n\n\*\*\*/);
      const newSummary = summaryMatch ? summaryMatch[1].trim() : cv.personal.summary;
      const skillsMatch = historyText.match(/\*\*\* SKILLS \*\*\*\n([\s\S]*)/);
      const newSkills = skillsMatch ? skillsMatch[1].split(',').map(s => s.trim()) : cv.skills;
      const expBlockMatch = historyText.match(/\*\*\* EXPERIENCIA \*\*\*\n([\s\S]*?)\n\*\*\* SKILLS/);
      let newExperience = [];
      
      if (expBlockMatch) {
        const expRaw = expBlockMatch[1];
        const expParts = expRaw.split('•').filter(p => p.trim().length > 0);
        newExperience = expParts.map((part, index) => {
          const firstLineEnd = part.indexOf('\n');
          const header = part.substring(0, firstLineEnd).trim(); 
          const description = part.substring(firstLineEnd).trim();
          let company = "Empresa", role = "Rol", date = "Fecha";
          
          if (header.includes('|')) {
            const headerParts = header.split('|').map(s => s.trim());
            company = headerParts[0] || company;
            role = headerParts[1] || role;
            if (headerParts[2]) date = headerParts[2];
          }
          return { id: Date.now() + index, company, role, date, description };
        });
      }

      setCv(prev => ({ ...prev, personal: { ...prev.personal, summary: newSummary }, skills: newSkills, experience: newExperience.length > 0 ? newExperience : cv.experience }));
      setShowHistory(false);
      alert("✅ Contenido importado con éxito.");
    } catch (e) {
      alert("❌ No se pudo importar este formato.");
    }
  };

  const pendingJobs = jobs.filter(j => j.status === 'Prospecto');
  const historyJobs = jobs.filter(j => j.cv_text && j.cv_text.length > 10); 
  const debugClass = debugMode ? "debug-box" : "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      <style>{`.debug-box { outline: 1px solid #ff0000 !important; } @media print { @page { margin: 0; size: A4; } body { -webkit-print-color-adjust: exact; background: white; } aside, .print-hidden { display: none !important; } main { margin: 0 !important; padding: 0 !important; width: 100% !important; } .cv-container { width: 210mm !important; min-height: 297mm !important; height: auto !important; margin: 0 !important; box-shadow: none !important; break-inside: avoid; } .experience-item { break-inside: avoid; } }`}</style>

      {/* EDITOR */}
      <aside className="w-full md:w-[450px] bg-white h-screen overflow-y-auto border-r border-gray-200 shadow-xl z-10 print:hidden flex flex-col">
        
        {/* TOP BAR */}
        <div className="bg-slate-900 text-white p-3 sticky top-0 z-30 shadow-md">
           <div className="flex items-center justify-between mb-2">
              <Link to="/" className="hover:bg-slate-700 p-1.5 rounded flex items-center gap-1 text-xs text-slate-300"><ArrowLeft size={14}/> Volver</Link>
              <div className="flex items-center gap-2">
                  <button onClick={() => setDebugMode(!debugMode)} className={`p-1 rounded border border-slate-600 text-slate-400 ${debugMode ? 'bg-red-500 text-white border-red-500' : ''}`}><ScanEye size={14}/></button>
              </div>
           </div>

          <div className="flex-1 flex items-center gap-2 bg-slate-800 p-1.5 rounded border border-slate-700 mb-3">
            <Globe size={14} className="text-slate-400 ml-1" />
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full">
              <option value="es" className="text-slate-900">🇪🇸 Español (ES)</option>
              <option value="en" className="text-slate-900">🇬🇧 Inglés (EN)</option>
            </select>
          </div>

           <div className="flex gap-2 mb-3">
             <button onClick={() => setShowHistory(!showHistory)} className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border transition-colors ${showHistory ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}><History size={14}/> Historial CVs</button>
             <button onClick={() => setMostrarImportJson(true)} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors">📋 Importar JSON</button>
           </div>

           {showHistory && (
             <div className="bg-white text-slate-800 rounded shadow-xl border border-slate-200 mb-3 overflow-hidden animate-fadeIn">
               <div className="bg-slate-100 p-2 text-xs font-bold text-slate-500 uppercase border-b">Reutilizar contenido de:</div>
               <div className="max-h-40 overflow-y-auto">
                 {historyJobs.length === 0 ? (
                   <div className="p-3 text-xs text-gray-400 text-center">No tienes CVs guardados todavía.</div>
                 ) : (
                   historyJobs.map(job => (
                     <button key={job.id} onClick={() => importCVFromHistory(job.cv_text)} className="w-full text-left p-2 hover:bg-blue-50 border-b last:border-0 text-xs flex justify-between items-center group">
                       <span className="font-bold truncate max-w-[180px]">{job.company}</span>
                       <span className="text-[10px] text-gray-400 group-hover:text-blue-600">{job.role}</span>
                     </button>
                   ))
                 )}
               </div>
             </div>
           )}
          </div>

          {/* TARGET JOB VINCULACIÓN */}
          <div className="bg-slate-800 rounded p-2 border border-slate-700">
  {targetJob ? (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="flex items-center gap-2 text-green-400"><Briefcase size={14}/> Editando para:</span>
        <button 
          onClick={generarEstrategiaIA}
          disabled={loadingIA}
          className={`${loadingIA ? 'bg-purple-800 opacity-70 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors active:scale-95`}
          title="Solicitar prompt optimizado a la API de tu Web App"
        >
          <Sparkles size={11} className={loadingIA ? "animate-spin" : ""}/>
          {loadingIA ? "Procesando..." : "Generar Prompt IA"}
        </button>
      </div>
      
      <div className="font-bold text-sm truncate text-slate-100">{targetJob.company}</div>
      
      {/* FILA 1: PDF y Guardar CV Clásico */}
      <div className="flex gap-2 mt-1">
        <button onClick={handlePrint} className="flex-1 bg-white text-slate-900 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100">
          <Download size={14}/> PDF
        </button>
        <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition-colors">
          <Save size={14}/> Guardar CV
        </button>
      </div>

      {/* FILA 2: Tu nuevo súper botón de Guardar & QA ocupando todo el ancho disponible para que luzca bien */}
      <button
      onClick={generarYAutocompletarCV}
  disabled={loadingQA || !targetJob}
  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
    {loadingQA
    ? <><span className="animate-spin inline-block">⚙️</span> Groq + Gemini (~25s)...</>
    : <><Sparkles size={15}/> Generar CV con IA</>
    }
    </button>

    </div>
  ) : (
    <div className="flex flex-col gap-2">
       <select className="w-full bg-slate-900 border border-slate-600 rounded text-xs p-1.5 text-white" onChange={(e) => { const j = jobs.find(x => x.id === e.target.value); if(j) setTargetJob(j); }} defaultValue="">
         <option value="" disabled>-- Vincular Oportunidad --</option>
         {pendingJobs.map(j => <option key={j.id} value={j.id}>{j.company}</option>)}
       </select>
       <button onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-700 py-1.5 rounded text-xs font-bold mt-1 flex items-center justify-center gap-2"><Printer size={14}/> PDF Genérico</button>
    </div>
  )}
</div>

        {/* TABS */}
        <div className="flex border-b sticky top-[180px] bg-white z-20"> 
          <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><LayoutTemplate size={14}/> Contenido</button>
          <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><Settings size={14}/> Diseño</button>
        </div>

        <div className="p-6 space-y-8 pb-20">
          {activeTab === 'content' && (
            <>
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
                    <textarea placeholder="Logros... (Usa ** para negrita y - para lista)" value={exp.description} onChange={(e) => updateItem('experience', exp.id, 'description', e.target.value)} className="w-full bg-white border p-1 rounded text-xs h-20 resize-y" />
                  </div>
                ))}
              </section>

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

              <section className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">🌍 Idiomas</h3>
                  <button onClick={() => addItem('languages', { language: '', level: '' })} className="text-blue-600 text-xs font-bold flex gap-1 items-center"><PlusCircle size={14}/> Añadir</button>
                </div>
                {cv.languages.map((langItem) => (
                  <div key={langItem.id} className="bg-gray-50 p-2 rounded border relative group grid grid-cols-2 gap-2">
                    <button onClick={() => removeItem('languages', langItem.id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-400 opacity-0 group-hover:opacity-100 shadow border"><Trash2 size={12}/></button>
                    <input placeholder="Idioma" value={langItem.language} onChange={(e) => updateItem('languages', langItem.id, 'language', e.target.value)} className="bg-white border p-1 rounded text-xs font-bold" />
                    <input placeholder="Nivel" value={langItem.level} onChange={(e) => updateItem('languages', langItem.id, 'level', e.target.value)} className="bg-white border p-1 rounded text-xs" />
                  </div>
                ))}
              </section>

              <section className="space-y-2 border-t pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase">⚡ Skills</h3>
                <textarea value={cv.skills.join(', ')} onChange={handleSkillsChange} className="w-full border p-2 rounded text-sm h-16" />
              </section>
            </>
          )}

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
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-4 flex items-center gap-2"><AlignJustify size={14}/> Espaciado (Columna Derecha)</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Interlineado <span>{design.lineHeight}</span></label><input type="range" min="1" max="2" step="0.05" value={design.lineHeight} onChange={(e) => setDesign({...design, lineHeight: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Separación entre experiencias <span>{design.sectionGap}px</span></label><input type="range" min="4" max="40" value={design.sectionGap} onChange={(e) => setDesign({...design, sectionGap: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Espacio encabezado → experiencia <span>{design.headerToExpGap}px</span></label><input type="range" min="4" max="48" value={design.headerToExpGap} onChange={(e) => setDesign({...design, headerToExpGap: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Margen superior (ambas columnas) <span>{design.paddingTop}px</span></label><input type="range" min="8" max="80" value={design.paddingTop} onChange={(e) => setDesign({...design, paddingTop: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Margen bajo nombre/título <span>{design.headerMarginBottom}px</span></label><input type="range" min="4" max="48" value={design.headerMarginBottom} onChange={(e) => setDesign({...design, headerMarginBottom: Number(e.target.value)})} className="w-full accent-gray-600"/></div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-4 flex items-center gap-2"><AlignJustify size={14}/> Columna Izquierda</h3>
                <div className="space-y-4">
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Tamaño texto perfil/info <span>{design.leftTextSize}px</span></label><input type="range" min="7" max="14" value={design.leftTextSize} onChange={(e) => setDesign({...design, leftTextSize: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                  <div><label className="flex justify-between text-xs font-semibold text-gray-600 mb-1">Interlineado columna izq. <span>{design.leftLineHeight}</span></label><input type="range" min="1" max="2" step="0.05" value={design.leftLineHeight} onChange={(e) => setDesign({...design, leftLineHeight: Number(e.target.value)})} className="w-full accent-blue-600"/></div>
                </div>
              </div>
              <button
                onClick={() => setDesign({ nameSize: 32, roleSize: 14, companySize: 12, textSize: 9, lineHeight: 1.3, sectionGap: 16, leftTextSize: 10, leftLineHeight: 1.4, paddingTop: 32, headerMarginBottom: 24, headerToExpGap: 20 })}
                className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg py-2 hover:bg-slate-50"
              >
                ↺ Restablecer diseño por defecto
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* PREVIEW */}
      <main className="flex-1 bg-gray-500 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:bg-white">
        <div className="relative">
          <div className="print-hidden absolute left-0 border-b-2 border-dashed border-red-500 z-50 flex items-end justify-end pointer-events-none" style={{ top: '297mm', width: '210mm' }}><span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-t font-bold">⚠ FIN PÁGINA 1</span></div>
          <div className="cv-container bg-white shadow-2xl w-[210mm] min-h-[297mm] flex items-stretch overflow-hidden" style={{ background: `linear-gradient(90deg, ${cv.themeColor} 0%, ${cv.themeColor} 32%, #ffffff 32%, #ffffff 100%)` }}>
            
            {/* COLUMNA IZQUIERDA */}
            <div className={`w-[32%] p-6 flex flex-col shrink-0 text-white ${debugClass}`} style={{ paddingTop: `${design.paddingTop}px` }}>
              <div className={`w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white/30 bg-white/20 ${debugClass}`}>
                 {cv.personal.photoUrl ? <img src={cv.personal.photoUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-4xl font-bold">{cv.personal.name.charAt(0)}</span>}
              </div>
              <div className="space-y-6 flex-1">
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-2 pb-1 text-xs border-b border-white/30 text-white/90 flex items-center gap-2"><LayoutTemplate size={12}/> {t('profile')}</h3>
                  <RichText text={cv.personal.summary} className="text-white/90 text-justify" style={{ fontSize: `${design.leftTextSize}px`, lineHeight: design.leftLineHeight }} />
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">{t('contact')}</h3>
                  <ul className="space-y-2 text-white/90" style={{ fontSize: `${design.leftTextSize}px` }}>
                    <li className="flex items-center gap-3"><div className="shrink-0"><Phone size={12}/></div> <span>{cv.personal.phone}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><Mail size={12}/></div> <span className="break-all">{cv.personal.email}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><MapPin size={12}/></div> <span>{cv.personal.location}</span></li>
                    <li className="flex items-center gap-3"><div className="shrink-0"><Linkedin size={12}/></div> <span className="break-all">{cv.personal.linkedin}</span></li>
                  </ul>
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">{t('skills')}</h3>
                  <div className="flex flex-wrap gap-1.5">{cv.skills.map((s, i) => <span key={i} className="px-2 py-0.5 rounded bg-white/20 text-white flex items-center justify-center" style={{ fontSize: `${design.leftTextSize}px` }}>{s}</span>)}</div>
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">{t('education')}</h3>
                  {cv.education.map((edu) => (
                     <div key={edu.id} className="mb-3 text-white/90"><p className="font-bold mb-0.5" style={{ fontSize: `${design.leftTextSize}px` }}>{edu.degree}</p><p className="opacity-80" style={{ fontSize: `${Math.max(7, design.leftTextSize - 1)}px` }}>{edu.school}</p><p className="opacity-80" style={{ fontSize: `${Math.max(7, design.leftTextSize - 1)}px` }}>{edu.date}</p></div>
                  ))}
                </div>
                <div className={debugClass}>
                  <h3 className="font-bold uppercase tracking-wider mb-3 pb-1 text-xs border-b border-white/30 text-white/90">{t('languages')}</h3>
                  {cv.languages.map((langItem) => (
                    <div key={langItem.id} className="mb-1.5 flex justify-between items-baseline text-white/90" style={{ fontSize: `${design.leftTextSize}px` }}>
                      <span className="font-semibold">{t(langItem.language)}</span>
                      <span className="opacity-80">{t(langItem.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className={`w-[68%] p-8 flex flex-col text-slate-800 ${debugClass}`} style={{ paddingTop: `${design.paddingTop}px` }}>
              <header className="pb-4 shrink-0 border-b-2" style={{ borderColor: cv.themeColor, marginBottom: `${design.headerMarginBottom}px` }}>
                <h1 className="font-extrabold uppercase tracking-tight leading-none mb-2 text-slate-900" style={{ fontSize: `${design.nameSize}px` }}>{cv.personal.name}</h1>
                <h2 className="font-bold tracking-wide" style={{ color: cv.themeColor, fontSize: '18px' }}>{cv.personal.title}</h2>
              </header>
              <section className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600" style={{ marginBottom: `${design.headerToExpGap}px` }}>
                  <span className="p-1 rounded flex items-center justify-center w-5 h-5 text-white" style={{ backgroundColor: cv.themeColor }}>
                    <LayoutTemplate size={12}/>
                  </span> 
                  <span className="mt-[1px]">{t('experience')}</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${design.sectionGap}px` }}>
                  {cv.experience.map((exp) => (
                    <div key={exp.id} className={`experience-item relative pl-4 border-l-2 ${debugClass}`} style={{ borderColor: cv.themeColor + '40' }}>
                      <div className="absolute top-[5px] w-2 h-2 rounded-full -left-[5px]" style={{ backgroundColor: cv.themeColor }}></div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-slate-900" style={{ fontSize: `${design.roleSize}px` }}>{exp.role}</h4>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{exp.date}</span>
                      </div>
                      <p className="font-bold mb-2" style={{ color: cv.themeColor, fontSize: `${design.companySize}px` }}>{exp.company}</p>
                      <div className="text-slate-600" style={{ fontSize: `${design.textSize}px`, lineHeight: design.lineHeight }}>
                        <RichText text={exp.description} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>

      {/* MODAL DE RESULTADOS DE CALIDAD (GROQ QA) */}
{showQaModal && qaResult && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-200">
      
      {/* Cabecera */}
      <div className="p-6 border-b border-purple-100 bg-purple-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-purple-950 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600"/> Análisis de Calidad del CV
          </h3>
          <p className="text-xs text-purple-700 mt-0.5">Informe estratégico generado por Groq en base a la oferta.</p>
        </div>
        <button 
          onClick={() => setShowQaModal(false)}
          className="text-purple-400 hover:text-purple-700 text-sm font-bold bg-white border border-purple-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
        >
          ✕
        </button>
      </div>

      {/* Contenido del Reporte */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
        
        {/* Si tu backend maneja un score o puntuación, lo renderizamos aquí de forma vistosa */}
        {qaResult.score !== undefined && (
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border">
            <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-xl shadow">
              {qaResult.score}/100
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Puntuación de ajuste ATS</h4>
              <p className="text-xs text-slate-500">Mapeo semántico de palabras clave y densidad de competencias.</p>
            </div>
          </div>
        )}

        {/* Resumen de Acción / Feedback Principal */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnóstico General</h4>
          <div className="p-4 bg-slate-50 border rounded-lg text-sm leading-relaxed">
            {/* Si es un string directo o un objeto con campo resumen_accion */}
            <RichText text={qaResult.resumen_accion || qaResult.feedback || (typeof qaResult === 'string' ? qaResult : 'Análisis completado con éxito.')} />
          </div>
        </div>

        {/* Bloque dinámico por si devuelves arrays de puntos fuertes/débiles */}
        {qaResult.puntos_criticos && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Puntos Críticos a Corregir</h4>
            <div className="p-4 bg-red-50 text-red-950 border border-red-100 rounded-lg text-xs">
              <RichText text={qaResult.puntos_criticos} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button 
          onClick={() => setShowQaModal(false)} 
          className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow transition-colors"
        >
          Entendido, voy a optimizarlo
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL JSON */}
      {mostrarImportJson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Importar CV desde JSON</h3>
              <p className="text-sm text-slate-500 mt-1">Pega el bloque JSON generado por tu IA.</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <textarea value={jsonImport} onChange={e => setJsonImport(e.target.value)} placeholder={`{\n  "titulo_profesional": "MarTech Specialist",\n  "summary": "...",\n  "herramientas": ["React", "Apps Script"],\n  "experiences": []\n}`} className="w-full flex-1 min-h-[250px] p-3 font-mono text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              {errorJson && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs font-medium text-red-600">⚠️ {errorJson}</p></div>}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setMostrarImportJson(false); setJsonImport(''); setErrorJson(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button>
              <button onClick={importarDesdeJson} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">✅ Importar Datos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}