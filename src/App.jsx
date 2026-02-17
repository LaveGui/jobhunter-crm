import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Search, Building2, MapPin, DollarSign, Heart, Calendar, ArrowDownWideNarrow, ArrowUpAZ, Activity } from 'lucide-react'; // Iconos nuevos
import useGoogleSheets from './hooks/useGoogleSheets';
import JobModal from './components/JobModal';
import { Link } from "react-router-dom";

export default function App() {
  const { jobs, loading, error, addJob, updateJob } = useGoogleSheets();
  const [columns, setColumns] = useState({
    'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': []
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // ESTADO PARA ORDENAMIENTO
  const [sortBy, setSortBy] = useState('last_updated'); // 'last_updated' | 'enthusiasm' | 'alpha'

  // Función auxiliar para formatear fecha (Ej: "17 feb")
  const formatDate = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) {
      return isoString;
    }
  };

  // Función para ordenar trabajos
  const sortJobs = (jobsList) => {
    return [...jobsList].sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.company.localeCompare(b.company);
      }
      if (sortBy === 'enthusiasm') {
        return (Number(b.enthusiasm) || 0) - (Number(a.enthusiasm) || 0);
      }
      if (sortBy === 'last_updated') {
        // Prioridad a la fecha de última actualización o creación
        const dateA = new Date(a.last_updated || a.created_at || 0);
        const dateB = new Date(b.last_updated || b.created_at || 0);
        return dateB - dateA; // Más reciente primero
      }
      return 0;
    });
  };

  // Sincronizar jobs con columnas + APLICAR FILTROS Y ORDEN
  useEffect(() => {
    if (jobs.length > 0) {
      const newCols = { 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] };
      
      // 1. Filtrar por búsqueda
      const filteredJobs = jobs.filter(job => 
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // 2. Distribuir en columnas
      filteredJobs.forEach(job => {
        if (newCols[job.status]) {
          newCols[job.status].push(job);
        } else {
          newCols['Prospecto'].push(job); // Fallback
        }
      });

      // 3. Ordenar cada columna independientemente
      Object.keys(newCols).forEach(col => {
        newCols[col] = sortJobs(newCols[col]);
      });

      setColumns(newCols);
    }
  }, [jobs, searchTerm, sortBy]); // Se ejecuta cuando cambian jobs, búsqueda u orden

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Si soltamos en la misma columna y misma posición, no hacemos nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Clonamos las columnas actuales para manipulación optimista
    const sourceCol = [...columns[source.droppableId]];
    const destCol = [...columns[destination.droppableId]];
    
    // Obtenemos el job movido
    const [movedJob] = sourceCol.splice(source.index, 1);
    const newStatus = destination.droppableId;

    // Actualizamos localmente (Optimistic UI)
    // Nota: Al soltar, React volverá a re-ordenar según el criterio seleccionado (sortBy)
    // esto puede hacer que la tarjeta "salte" a su posición ordenada, lo cual es correcto en este modelo.
    
    // Insertamos en destino (aunque el useEffect luego lo reordenará)
    if (source.droppableId === destination.droppableId) {
        sourceCol.splice(destination.index, 0, movedJob);
        setColumns({ ...columns, [source.droppableId]: sourceCol });
    } else {
        destCol.splice(destination.index, 0, { ...movedJob, status: newStatus });
        setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    }

    // Lógica de actualización de datos
    let extraUpdates = {};
    if (newStatus === 'Aplicado' && !movedJob.date_applied) {
       extraUpdates.date_applied = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD para Excel
    }

    updateJob({ 
      ...movedJob, 
      status: newStatus, 
      last_updated: new Date().toISOString(),
      ...extraUpdates
    });
  };

  const handleSaveJob = async (jobData) => {
    const action = currentJob ? 'update' : 'create';
    const payload = { 
      ...jobData, 
      id: currentJob?.id,
      last_updated: new Date().toISOString()
    };
    
    if (action === 'create') {
      await addJob(payload);
    } else {
      await updateJob(payload);
    }
  };

  const getDaysInactive = (dateString) => {
    if (!dateString) return 0;
    const lastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col h-screen">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 z-20">
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

      {/* BARRA DE HERRAMIENTAS (BUSCADOR + ORDENAR) */}
      <div className="bg-white border-b border-slate-200 p-3 shadow-sm shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Buscador */}
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar empresa, puesto..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ordenar por:</span>
                <button 
                    onClick={() => setSortBy('last_updated')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'last_updated' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Activity size={14}/> Actividad
                </button>
                <button 
                    onClick={() => setSortBy('enthusiasm')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'enthusiasm' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Heart size={14}/> Interés
                </button>
                <button 
                    onClick={() => setSortBy('alpha')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'alpha' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <ArrowDownWideNarrow size={14}/> A-Z
                </button>
            </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {loading && <div className="flex justify-center items-center h-full text-slate-400 animate-pulse">Cargando pipeline...</div>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        
        {!loading && !error && (
            <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full min-w-max mx-auto">
                {Object.keys(columns).map((colId) => (
                <Droppable key={colId} droppableId={colId}>
                    {(provided) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-slate-200/60 rounded-xl p-3 w-80 flex flex-col h-full border border-slate-300/50 backdrop-blur-sm"
                    >
                        {/* Column Header */}
                        <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{colId}</h2>
                                <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                                    {columns[colId].length}
                                </span>
                            </div>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {columns[colId].map((job, index) => (
                            <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                            {(provided, snapshot) => (
                                <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => { setCurrentJob(job); setIsModalOpen(true); }}
                                className={`bg-white p-4 rounded-lg border transition-all cursor-pointer group relative hover:border-blue-400 hover:shadow-md
                                    ${snapshot.isDragging ? 'shadow-2xl rotate-2 ring-2 ring-blue-500 z-50' : 'shadow-sm border-slate-200'}
                                `}
                                >
                                {/* Indicador de Inactividad (Solo si > 7 días) */}
                                {getDaysInactive(job.last_updated) > 7 && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" title="Sin actividad reciente (>7 días)"></div>
                                )}

                                {/* Card Content */}
                                <h3 className="font-bold text-slate-800 mb-0.5 leading-snug text-sm">{job.title}</h3>
                                <p className="text-blue-600 text-xs font-bold flex items-center gap-1 mb-3">
                                    <Building2 size={10}/> {job.company}
                                </p>

                                {/* Metadata Footer */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                        <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                                            <MapPin size={10}/> {job.location_type || 'Híbrido'}
                                        </div>
                                        {job.salary && (
                                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                            <DollarSign size={10}/> {job.salary}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                            <Heart 
                                                key={i} 
                                                size={10} 
                                                className={i < (Number(job.enthusiasm) || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}
                                            />
                                            ))}
                                        </div>
                                        {job.date_applied && (
                                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                <Calendar size={10}/> {formatDate(job.date_applied)}
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
        )}
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