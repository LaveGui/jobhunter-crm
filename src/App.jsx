import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";

// --------------------------------------------------------
// TU URL (Asegúrate de que sea la misma que ya te funcionaba)
const API_URL = "https://script.google.com/macros/s/AKfycbwAbjv_WQZI3rTdaBho5BI1yYYhRxnfXzX_NC-NRXDCEA1BLc7cB0FBdkhDEukJzuFMfA/exec"; 
// --------------------------------------------------------

// Definimos las etapas de tu embudo de ventas personal
const PIPELINE_STAGES = [
  { name: 'Prospecto', color: 'bg-gray-100 border-gray-300' },
  { name: 'Aplicado', color: 'bg-blue-50 border-blue-200' },
  { name: 'Entrevista', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'Oferta', color: 'bg-green-50 border-green-200' },
  { name: 'Descartado', color: 'bg-red-50 border-red-200' }
];

function App() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // Para mostrar spinner al guardar

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setProspects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => console.error(e));
  };

  // Función para mover de etapa (Enviar cambio a Google Sheets)
  const handleStatusChange = (job, newStatus) => {
    setUpdating(job.id); // Activar estado de carga en esa tarjeta
    
    // Optimismo UI: Actualizamos localmente primero para que se sienta rápido
    const originalProspects = [...prospects];
    const updatedProspects = prospects.map(p => 
      p.id === job.id ? { ...p, status: newStatus } : p
    );
    setProspects(updatedProspects);

    // Preparamos los datos para enviar
    // NOTA: Enviamos todo el objeto actualizado
    const payload = {
      action: 'update',
      ...job,
      status: newStatus
    };

    // Enviamos a Google Sheets (usando un truco para evitar CORS en POST simple)
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    })
    .then(() => {
      setUpdating(null);
      console.log("Actualizado en Google Sheets");
    })
    .catch(err => {
      console.error("Error guardando:", err);
      setProspects(originalProspects); // Revertimos si falla
      setUpdating(null);
      alert("Hubo un error al guardar los cambios.");
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <h1 className="text-xl font-bold text-gray-800">JobHunter CRM</h1>
        </div>
        <button 
          onClick={fetchData} 
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          Actualizar Tablero ⟳
        </button> <Link to="/cv" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold ml-4">
  Crear CV Nuevo
</Link>
      </header>

      {/* MAIN BOARD (Horizontal Scroll) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex p-6 gap-6 min-w-max">
          
          {loading ? (
            <div className="text-center w-full mt-20 text-gray-500">Cargando tu imperio...</div>
          ) : (
            PIPELINE_STAGES.map((stage) => (
              <div key={stage.name} className="w-80 flex flex-col h-full">
                {/* Cabecera de Columna */}
                <div className={`flex justify-between items-center px-4 py-3 rounded-t-lg border-b-2 font-semibold text-gray-700 ${stage.color}`}>
                  <span>{stage.name}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded text-xs text-gray-600">
                    {prospects.filter(p => p.status === stage.name).length}
                  </span>
                </div>

                {/* Área de Tarjetas */}
                <div className="bg-gray-100/50 flex-1 p-2 rounded-b-lg border border-gray-200 overflow-y-auto min-h-[500px]">
                  
                  {prospects.filter(p => p.status === stage.name).map((job) => (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-200 hover:shadow-md transition-all group">
                      
                      {/* Empresa y Rol */}
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-800 leading-tight">{job.role}</h3>
                        <p className="text-blue-600 text-sm font-medium">{job.company}</p>
                      </div>

                      {/* Info extra */}
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        {job.contact_name && <p>👤 {job.contact_name}</p>}
                        {job.tech_stack && <p>💻 {job.tech_stack}</p>}
                      </div>

                      {/* Controles */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-2">
                         <a href={job.link} target="_blank" className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase">
                           Ver Oferta
                         </a>
                         
                         {/* Selector de Estado */}
                         <div className="relative">
                            {updating === job.id && <span className="absolute -top-6 right-0 text-xs text-blue-500">Guardando...</span>}
                            <select 
                              value={job.status} 
                              onChange={(e) => handleStatusChange(job, e.target.value)}
                              className="text-xs border rounded px-1 py-1 bg-gray-50 text-gray-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              {PIPELINE_STAGES.map(s => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                         </div>
                      </div>

                    </div>
                  ))}

                  {/* Placeholder si está vacío */}
                  {prospects.filter(p => p.status === stage.name).length === 0 && (
                    <div className="text-center py-10 text-gray-300 text-sm italic border-2 border-dashed border-gray-200 rounded">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

        </div>
      </main>
    </div>
  )
}

export default App