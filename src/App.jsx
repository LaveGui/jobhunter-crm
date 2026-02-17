import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, Search, Building2, MapPin, Euro, Heart, 
  CalendarCheck, Clock, UserX, Activity, ArrowDownWideNarrow 
} from 'lucide-react'; 
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
  const [sortBy, setSortBy] = useState('last_updated'); 

  // --- HELPERS ---

  // Formatear fecha corta (ej: "17 feb")
  const formatDateShort = (isoString) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) {
      return isoString;
    }
  };

  // Calcular días inactivo
  const getDaysInactive = (dateString) => {
    if (!dateString) return 0;
    const lastDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  // Contar contactos de forma segura
  const getContactCount = (job) => {
    if (!job.contacts) return 0;
    if (Array.isArray(job.contacts)) return job.contacts.length;
    try {
      const parsed = JSON.parse(job.contacts);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (e) {
      return 0;
    }
  };

  // Formatear Salario con puntos de miles (SOLUCIÓN 1)
  const formatSalary = (salary) => {
    if (!salary) return '';
    // 1. Limpiamos todo lo que no sea número o guión (para rangos)
    const clean = String(salary).replace(/[^\d-]/g, '');
    // 2. Añadimos puntos de mil a los grupos de números
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
        const dateA = new Date(a.last_updated || a.created_at || 0);
        const dateB = new Date(b.last_updated || b.created_at || 0);
        return dateB - dateA; 
      }
      return 0;
    });
  };

  // Sincronizar jobs con columnas + APLICAR FILTROS Y ORDEN
  useEffect(() => {
    if (jobs.length > 0) {
      const newCols = { 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] };
      
      const filteredJobs = jobs.filter(job => 
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredJobs.forEach(job => {
        if (newCols[job.status]) {
          newCols[job.status].push(job);
        } else {
          newCols['Prospecto'].push(job); 
        }
      });

      Object.keys(newCols).forEach(col => {
        newCols[col] = sortJobs(newCols[col]);
      });

      setColumns(newCols);
    }
  }, [jobs, searchTerm, sortBy]); 

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...columns[source.droppableId]];
    const destCol = [...columns[destination.droppableId]];
    
    const [movedJob] = sourceCol.splice(source.index, 1);
    const newStatus = destination.droppableId;

    if (source.droppableId === destination.droppableId) {
        sourceCol.splice(destination.index, 0, movedJob);
        setColumns({ ...columns, [source.droppableId]: sourceCol });
    } else {
        destCol.splice(destination.index, 0, { ...movedJob, status: newStatus });
        setColumns({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    }

    let extraUpdates = {};
    if (newStatus === 'Aplicado' && !movedJob.date_applied) {
       extraUpdates.date_applied = new Date().toISOString().split('T')[0]; 
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
      setIsModalOpen(false); 
    } else {
      await updateJob(payload);
    }
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

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white border-b border-slate-200 p-3 shadow-sm shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
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

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ordenar por:</span>
                <button onClick={() => setSortBy('last_updated')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'last_updated' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={14}/> Actividad</button>
                <button onClick={() => setSortBy('enthusiasm')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'enthusiasm' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:bg-slate-100'}`}><Heart size={14}/> Interés</button>
                <button onClick={() => setSortBy('alpha')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap ${sortBy === 'alpha' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}><ArrowDownWideNarrow size={14}/> A-Z</button>
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
                        <div className="flex justify-between items-center mb-3 px-1 shrink-0">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{colId}</h2>
                                <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                                    {columns[colId].length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {columns[colId].map((job, index) => (
                            <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                            {(provided, snapshot) => (
                                <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                // SOLUCIÓN 2: Pasamos los estilos nativos explícitamente para evitar saltos
                                style={{ ...provided.draggableProps.style }}
                                onClick={() => { setCurrentJob(job); setIsModalOpen(true); }}
                                // SOLUCIÓN 2 (Cont.): Quitamos 'rotate-2' para que no se descuadre el puntero
                                className={`bg-white p-4 rounded-lg border transition-all cursor-pointer group relative hover:shadow-md
                                    ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 z-50' : 'shadow-sm border-slate-200'}
                                    ${Number(job.enthusiasm) === 5 ? 'border-l-4 border-l-yellow-400' : 'hover:border-blue-400'} 
                                `}
                                >
                                {Number(job.enthusiasm) === 5 && (
                                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-50"></div>
                                )}

                                {/* Card Content */}
                                <h3 className="font-bold text-slate-800 mb-0.5 leading-snug text-sm line-clamp-2">{job.title}</h3>
                                <p className="text-blue-600 text-xs font-bold flex items-center gap-1 mb-3 truncate">
                                    <Building2 size={10}/> {job.company}
                                </p>

                                {/* Metadata Footer */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                <MapPin size={10}/> {job.location_type || 'Híbrido'}
                                            </div>
                                            {/* ALERTA SIN CONTACTOS */}
                                            {getContactCount(job) === 0 && (
                                                <div className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1" title="¡No tienes contactos guardados!">
                                                    <UserX size={10}/> <span>0</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* SALARIO EN EUROS CON SEPARADOR DE MILES */}
                                        {job.salary && (
                                            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                <Euro size={10}/> {formatSalary(job.salary)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                <Heart 
                                                    key={i} 
                                                    size={10} 
                                                    className={i < (Number(job.enthusiasm) || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}
                                                />
                                                ))}
                                            </div>
                                            {/* ÚLTIMA ACTIVIDAD */}
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1" title="Última actualización">
                                                <Clock size={10}/> {formatDateShort(job.last_updated)}
                                            </div>
                                        </div>

                                        {/* FECHA DE APLICACIÓN */}
                                        {job.date_applied && (
                                            <div className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 text-[10px] font-bold flex items-center justify-center gap-1.5 mt-1">
                                                <CalendarCheck size={10}/> Postulado: {formatDateShort(job.date_applied)}
                                            </div>
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