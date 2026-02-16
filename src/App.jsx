import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Search, Building2, MapPin, Calendar, DollarSign, Heart } from 'lucide-react';
import useGoogleSheets from './hooks/useGoogleSheets';
import JobModal from './components/JobModal';
import { Link } from "react-router-dom";

export default function App() {
  const { jobs, loading, error, addJob, updateJob, deleteJob } = useGoogleSheets();
  const [columns, setColumns] = useState({
    'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sincronizar jobs con columnas
  useEffect(() => {
    if (jobs.length > 0) {
      const newCols = { 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] };
      jobs.forEach(job => {
        if (newCols[job.status]) {
          newCols[job.status].push(job);
        } else {
          newCols['Prospecto'].push(job);
        }
      });
      setColumns(newCols);
    }
  }, [jobs]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = [...columns[source.droppableId]];
      const destCol = [...columns[destination.droppableId]];
      const [movedJob] = sourceCol.splice(source.index, 1);
      
      const newStatus = destination.droppableId;
      destCol.splice(destination.index, 0, { ...movedJob, status: newStatus });

      setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });

      // Si movemos a Aplicado, podríamos marcar fecha automática si no existe
      let extraUpdates = {};
      if (newStatus === 'Aplicado' && !movedJob.date_applied) {
         extraUpdates.date_applied = new Date().toLocaleDateString();
      }

      updateJob({ 
        ...movedJob, 
        status: newStatus, 
        last_updated: new Date(),
        ...extraUpdates
      });
    }
  };

  const handleSaveJob = async (jobData) => {
    const action = currentJob ? 'update' : 'create';
    // Nos aseguramos de que last_updated siempre se envíe
    const payload = { 
      ...jobData, 
      id: currentJob?.id,
      last_updated: new Date()
    };
    
    if (action === 'create') {
      await addJob(payload);
    } else {
      await updateJob(payload);
    }
    setIsModalOpen(false);
  };

  // Función para calcular días sin actividad
  const getDaysInactive = (dateString) => {
    if (!dateString) return 0;
    const lastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold tracking-tight">JobHunter CRM</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/cv" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/50">
              CV Studio
            </Link>
            <button 
              onClick={() => { setCurrentJob(null); setIsModalOpen(true); }}
              className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Plus size={16} /> Nueva Oportunidad
            </button>
          </div>
        </div>
      </header>

      {/* FILTROS & BÚSQUEDA */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por empresa o puesto..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 border focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* KANBAN BOARD */}
      <main className="max-w-7xl mx-auto p-4 overflow-x-auto h-[calc(100vh-140px)]">
        {loading && <p className="text-center text-slate-500">Cargando tu pipeline...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 min-w-max h-full">
            {Object.keys(columns).map((colId) => (
              <Droppable key={colId} droppableId={colId}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-slate-200/50 rounded-xl p-4 w-80 flex flex-col h-full border border-slate-200"
                  >
                    <div className="flex justify-between items-center mb-4 px-1">
                      <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{colId}</h2>
                      <span className="bg-slate-300 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {columns[colId].filter(job => job.company.toLowerCase().includes(searchTerm.toLowerCase())).length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {columns[colId]
                        .filter(job => 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.title.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((job, index) => (
                        <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => { setCurrentJob(job); setIsModalOpen(true); }}
                              className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group relative hover:border-slate-300"
                            >
                              {/* Indicador de Inactividad */}
                              {getDaysInactive(job.last_updated) > 7 && (
                                <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full" title="Sin actividad reciente"></div>
                              )}

                              {/* Título y Empresa (CORREGIDO DUPLICADO) */}
                              <h3 className="font-bold text-slate-800 mb-1 leading-tight">{job.title}</h3>
                              <p className="text-blue-600 text-sm font-semibold flex items-center gap-1">
                                <Building2 size={12}/> {job.company}
                              </p>

                              {/* Metadatos Rápidos */}
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <MapPin size={12}/> {job.location_type || 'Híbrido'}
                                  </div>
                                  {job.salary && (
                                    <div className="flex items-center gap-1 text-green-600 font-medium">
                                      <DollarSign size={12}/> {job.salary}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                                  <div className="flex gap-0.5">
                                    {[...Array(Number(job.enthusiasm) || 0)].map((_, i) => (
                                      <Heart key={i} size={10} className="text-yellow-400 fill-current"/>
                                    ))}
                                  </div>
                                  {job.date_applied && (
                                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                      {job.date_applied}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>

      {isModalOpen && (
        <JobModal 
          job={currentJob} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveJob} 
        />
      )}
    </div>
  );
}