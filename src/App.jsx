import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import JobModal from './JobModal';

// ⚠️ TU URL AQUÍ
const API_URL = "https://script.google.com/macros/s/AKfycbwAbjv_WQZI3rTdaBho5BI1yYYhRxnfXzX_NC-NRXDCEA1BLc7cB0FBdkhDEukJzuFMfA/exec"; 

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    fetch(API_URL).then(res => res.json()).then(data => {
      // Nos aseguramos de ordenar los datos para que no "bailen" al renderizar
      const sortedData = Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
      setProspects(sortedData);
      setLoading(false);
    });
  };

  const handleOpenCreate = () => { setCurrentJob(null); setIsModalOpen(true); };
  const handleOpenEdit = (job) => { setCurrentJob(job); setIsModalOpen(true); };

  const handleSaveJob = (jobData) => {
    setLoading(true);
    const action = currentJob ? 'update' : 'create';
    const payload = { action, ...jobData, id: currentJob?.id, last_updated: new Date() }; 

    // Optimismo UI: Actualizamos localmente antes de esperar al servidor
    if (action === 'create') {
        // Inventamos un ID temporal para que se vea ya
        setProspects(prev => [...prev, { ...jobData, id: `temp-${Date.now()}`, created_at: new Date() }]);
    } else {
        setProspects(prev => prev.map(p => p.id === currentJob.id ? { ...p, ...jobData } : p));
    }
    
    // Enviamos a Google Sheets
    fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(() => {
      fetchData(); // Sincronizamos ID real y datos finales
      setIsModalOpen(false);
    })
    .catch(err => {
      console.error(err);
      alert("Error al guardar");
      setLoading(false);
    });
  };

  // Calcular días desde la última actualización
  const getDaysInactive = (dateString) => {
    if (!dateString) return 0;
    const lastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  // --- LÓGICA DE DRAG & DROP ---
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // 1. Si se soltó fuera del tablero o en el mismo sitio, no hacemos nada
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 2. Buscamos el trabajo que se movió
    const movedJob = prospects.find(p => p.id.toString() === draggableId);
    if (!movedJob) return;

    // 3. ACTUALIZACIÓN OPTIMISTA (Feedback instantáneo)
    // Creamos una copia del array cambiando solo el estado de esa tarjeta
    const newStatus = destination.droppableId;
    
    const updatedProspects = prospects.map(p => 
      p.id.toString() === draggableId ? { ...p, status: newStatus } : p
    );
    setProspects(updatedProspects);

    // 4. Enviar cambio a la API (Google Sheets) en segundo plano
    const payload = {
        action: 'update',
        ...movedJob,
        status: newStatus, 
        last_updated: new Date()
    };

    fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
      .catch(err => {
          console.error("Error moviendo tarjeta", err);
          alert("Hubo un error al mover la tarjeta. Recarga la página.");
          fetchData(); // Revertimos si falla
      });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 hidden md:block">JobHunter CRM</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenCreate} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-2">
            <span>+</span> <span className="hidden md:inline">Nueva Oportunidad</span>
          </button>
          <Link to="/cv" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold">CV Studio</Link>
        </div>
      </header>

      {/* CONTEXTO DE ARRASTRE */}
      <DragDropContext onDragEnd={onDragEnd}>
        <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-200/50">
          <div className="h-full flex flex-col md:flex-row p-4 gap-4 md:min-w-max overflow-y-auto md:overflow-y-hidden">
            
            {loading && <div className="text-center w-full mt-10">Cargando...</div>}

            {!loading && PIPELINE_STAGES.map((stage) => {
              // Filtramos las tarjetas de esta columna
              const columnProspects = prospects.filter(p => p.status === stage.name);

              return (
                <div key={stage.name} className="w-full md:w-80 flex flex-col h-fit md:h-full shrink-0">
                  
                  {/* CABECERA */}
                  <div className={`flex justify-between items-center px-4 py-3 rounded-t-lg border-b-2 font-bold text-gray-700 ${stage.color}`}>
                    <span>{stage.name}</span>
                    <span className="bg-white/60 px-2 rounded text-xs">{columnProspects.length}</span>
                  </div>

                  {/* ZONA DROPPABLE (Donde soltamos) */}
                  <Droppable droppableId={stage.name}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-2 rounded-b-lg border border-gray-200 overflow-y-auto min-h-[100px] md:min-h-0 transition-colors
                          ${snapshot.isDraggingOver ? 'bg-blue-50/80' : 'bg-gray-100/50'}`}
                      >
                        {columnProspects.map((job, index) => (
                          
                          /* TARJETA DRAGGABLE (Lo que arrastramos) */
                          <Draggable key={job.id} draggableId={job.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleOpenEdit(job)}
                                style={{ ...provided.draggableProps.style }} // Estilo necesario para que funcione el arrastre
                                className={`bg-white p-3 rounded-lg shadow-sm mb-3 border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative
                                  ${snapshot.isDragging ? 'shadow-2xl rotate-2 ring-2 ring-blue-400 z-50' : ''}`}
                              >
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-gray-800 leading-tight">{job.role}</h3>
                                  {job.location_type === 'Remoto' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">🏠</span>}
                                </div>
                                <p className="text-blue-600 text-sm font-medium mb-2">{job.company}</p>
                                <div className="text-xs text-gray-500 space-y-1">
                                  {job.salary && <p>💰 {job.salary}</p>}
                                  {job.interview_date && (
                                    <p className="text-orange-600 font-semibold">📅 {new Date(job.interview_date).toLocaleDateString()}</p>
                                  )}
                                  <p className="text-blue-600 text-sm font-medium mb-2">{job.company}</p>

{/* ALERTA DE INACTIVIDAD (NUEVO) */}
{getDaysInactive(job.last_updated) > 7 && (
   <div className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded mb-2 flex items-center gap-1 border border-red-100">
      ⚠️ {getDaysInactive(job.last_updated)} días sin actividad
   </div>
)}
                                </div>
                              </div>
                            )}
                          </Draggable>

                        ))}
                        {provided.placeholder} {/* Hueco necesario para que no colapse */}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </main>
      </DragDropContext>

      <JobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveJob} jobToEdit={currentJob} />
    </div>
  )
}

export default App