import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print'; // Necesitaremos instalar esto luego

export default function CVBuilder() {
  // ESTADO: Aquí viven los datos de tu CV
  const [cvData, setCvData] = useState({
    name: "TU NOMBRE",
    role: "Senior Software Architect",
    phone: "+34 600 000 000",
    email: "email@ejemplo.com",
    linkedin: "linkedin.com/in/tu-perfil",
    summary: "Arquitecto de software con más de 8 años de experiencia creando soluciones escalables...",
    skills: ["React", "Node.js", "AWS", "Sales Enablement", "System Design"],
    experience: [
      {
        company: "Empresa Actual",
        role: "Lead Developer",
        date: "2021 - Presente",
        desc: "Liderando la migración a microservicios..."
      },
      {
        company: "Empresa Anterior",
        role: "Frontend Developer",
        date: "2018 - 2021",
        desc: "Desarrollo de interfaces complejas con React..."
      }
    ]
  });

  // ESTADO PARA LA OFERTA ACTUAL (Lo que personalizas)
  const [targetRole, setTargetRole] = useState("Arquitecto de Soluciones");
  const [targetCompany, setTargetCompany] = useState("Google");

  // REFERENCIA PARA IMPRIMIR
  const componentRef = useRef();

  // FUNCIÓN IMPRIMIR (Nativa del navegador, truco simple)
const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `CV_${cvData.name}`,
  });

  return (
    <div className="min-h-screen bg-gray-500 p-8 flex gap-8 print:p-0 print:bg-white">
      
      {/* 1. PANEL DE EDICIÓN (Izquierda - Se oculta al imprimir) */}
      <aside className="w-1/3 bg-white p-6 rounded-xl shadow-lg h-fit sticky top-8 print:hidden">
        <h2 className="text-xl font-bold mb-4 text-gray-800">🛠️ Personalizar CV</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Empresa Objetivo</label>
            <input 
              value={targetCompany} 
              onChange={e => setTargetCompany(e.target.value)}
              className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Rol Objetivo</label>
            <input 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)}
              className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Perfil / Resumen</label>
            <textarea 
              value={cvData.summary} 
              onChange={e => setCvData({...cvData, summary: e.target.value})}
              className="w-full border p-2 rounded h-32 text-sm" 
            />
          </div>
          
          <button 
            onClick={handlePrint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-colors mt-4"
          >
            🖨️ Descargar PDF
          </button>
          
          <p className="text-xs text-center text-gray-400 mt-2">
            (En la ventana de impresión, elige "Guardar como PDF" y activa "Gráficos de fondo")
          </p>
        </div>
      </aside>

      {/* 2. VISTA PREVIA DEL CV (Derecha - Formato A4) */}
      <main className="flex-1 flex justify-center">
        <div 
          ref={componentRef}
          id="cv-preview"
          className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-0 flex print:shadow-none print:w-full"
        >
          {/* COLUMNA LATERAL (Oscura) */}
          <div className="w-1/3 bg-slate-900 text-white p-8 pt-12">
            
            {/* Foto (Opcional) */}
            <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-8 overflow-hidden border-4 border-slate-800">
               {/* <img src="..." /> Poner tu foto aquí si quieres */}
               <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-blue-400 font-bold uppercase tracking-wider mb-2">Contacto</h3>
                <p className="opacity-80">{cvData.phone}</p>
                <p className="opacity-80">{cvData.email}</p>
                <p className="opacity-80">{cvData.linkedin}</p>
              </div>

              <div>
                <h3 className="text-blue-400 font-bold uppercase tracking-wider mb-2">Skills</h3>
                <ul className="list-disc list-inside opacity-80 space-y-1">
                  {cvData.skills.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* COLUMNA PRINCIPAL (Blanca) */}
          <div className="w-2/3 p-10 pt-12 text-slate-800">
            
            <header className="border-b-2 border-slate-200 pb-6 mb-6">
              <h1 className="text-4xl font-extrabold uppercase tracking-tight text-slate-900">{cvData.name}</h1>
              <h2 className="text-xl text-blue-600 font-medium mt-1">{targetRole}</h2> 
              {/* ^ Aquí usamos el rol objetivo dinámicamente */}
            </header>

            <section className="mb-8">
              <h3 className="text-md font-bold uppercase tracking-wider border-b border-slate-200 pb-1 mb-3 text-slate-900">Perfil Profesional</h3>
              <p className="text-sm leading-relaxed text-slate-600 text-justify">
                {cvData.summary}
              </p>
            </section>

            <section>
              <h3 className="text-md font-bold uppercase tracking-wider border-b border-slate-200 pb-1 mb-4 text-slate-900">Experiencia Laboral</h3>
              
              <div className="space-y-6">
                {cvData.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-lg text-slate-800">{exp.role}</h4>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{exp.date}</span>
                    </div>
                    <p className="text-blue-600 text-sm font-medium mb-2">{exp.company}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {exp.desc}
                    </p>
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