import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, Search, Building2, MapPin, Euro, Heart, 
  CalendarCheck, Clock, UserX, Activity, ArrowDownWideNarrow, Zap, Settings, BarChart3
} from 'lucide-react'; 
import useGoogleSheets from './hooks/useGoogleSheets';
import QuickAddModal from './components/QuickAddModal';
import StrategyModal from './components/StrategyModal';
import StatsModal from './components/StatsModal';
import JobPage from './pages/JobPage';
import CVBuilder from './CVBuilder'; // <--- 1. IMPORTANTE: Importamos el CV Studio
import { calculatePendingTasks } from './utils/taskEngine';
import { PLAYBOOK as DEFAULT_PLAYBOOK } from './utils/playbook';

export default function App() {
  const { jobs, loading, error, addJob, updateJob } = useGoogleSheets();
  const navigate = useNavigate();

  // --- ESTADOS GLOBALES ---
  const [columns, setColumns] = useState({ 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] });
  const [pendingTasks, setPendingTasks] = useState([]);
  
  // Modales Globales
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Estados Dashboard
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [activePlaybook, setActivePlaybook] = useState(DEFAULT_PLAYBOOK);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('last_updated'); 

  // --- EFECTOS ---
  useEffect(() => { const saved = localStorage.getItem('jobhunter_playbook'); if (saved) setActivePlaybook(JSON.parse(saved)); }, []);
  
  useEffect(() => { 
    if (jobs.length > 0) {
      const tasks = calculatePendingTasks(jobs, activePlaybook);
      setPendingTasks(tasks);
      
      const newCols = { 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] };
      const filteredJobs = jobs.filter(job => (job.company || '').toLowerCase().includes(searchTerm.toLowerCase()) || (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
      filteredJobs.forEach(job => { if (newCols[job.status]) newCols[job.status].push(job); else newCols['Prospecto'].push(job); });
      Object.keys(newCols).forEach(col => { newCols[col] = sortJobs(newCols[col]); });
      setColumns(newCols);
    }
  }, [jobs, activePlaybook, searchTerm, sortBy]);

  // --- HELPERS ---
  const formatDateShort = (d) => { if (!d) return null; try { return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); } catch { return d; } };
  const formatSalary = (s) => { if (!s) return ''; return String(s).replace(/[^\d-]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
  const getContactCount = (job) => { if (!job.contacts) return 0; try { const p = typeof job.contacts === 'string' ? JSON.parse(job.contacts) : job.contacts; return p.length; } catch { return 0; } };
  
  const sortJobs = (list) => {
    return [...list].sort((a, b) => {
      if (sortBy === 'alpha') return (a.company || '').localeCompare(b.company || '');
      if (sortBy === 'enthusiasm') return (Number(b.enthusiasm) || 0) - (Number(a.enthusiasm) || 0);
      if (sortBy === 'last_updated') { return new Date(b.last_updated || 0) - new Date(a.last_updated || 0); }
      return 0;
    });
  };

  // --- HANDLERS ---
  const handleOpenJob = (jobId) => navigate(`/job/${jobId}`);
  const handleOpenJobFromTask = (task) => navigate(`/job/${task.jobId}`);
  const handleOpenCV = () => navigate('/cv');

  const handleSaveJob = async (jobData) => {
    const action = jobData.id ? 'update' : 'create';
    const payload = { ...jobData, last_updated: new Date().toISOString() };
    if (action === 'create') { await addJob(payload); setIsQuickAddOpen(false); } 
    else { await updateJob(payload); }
  };

  const onDragEnd = (result) => {
     if (!result.destination) return;
     const { source, destination } = result;
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
     if (newStatus === 'Aplicado' && !movedJob.date_applied) { extraUpdates.date_applied = new Date().toISOString().split('T')[0]; }
     updateJob({ ...movedJob, status: newStatus, last_updated: new Date().toISOString(), ...extraUpdates });
  };

  // --- TABLERO KANBAN (Vista Principal) ---
  const BoardView = () => (
    <div className="flex flex-col h-full">
      {/* Header Dashboard */}
      <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold tracking-tight">JobHunter CRM</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowStats(true)} className="p-2 rounded-lg bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-white border border-slate-700"><BarChart3 size={20} /></button>
            <button onClick={() => setShowTaskPanel(!showTaskPanel)} className={`relative px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${showTaskPanel ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              <Zap size={16} className={showTaskPanel ? 'fill-slate-900' : 'fill-yellow-400 text-yellow-400'}/> Tareas
              {pendingTasks.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">{pendingTasks.length}</span>)}
            </button>
            <button onClick={handleOpenCV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">CV Studio</button>
            <button onClick={() => setIsQuickAddOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"><Plus size={16} /> Nueva Oportunidad</button>
          </div>
        </div>
      </header>

      {/* Task Panel */}
      {showTaskPanel && (
        <div className="bg-slate-800 text-white border-b border-slate-700 p-4 shadow-inner z-10 relative">
           <div className="max-w-3xl mx-auto">
             <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
                <h3 className="font-bold text-lg flex items-center gap-2"><Zap className="text-yellow-400 fill-yellow-400" size={20}/> Tareas para Hoy</h3>
                <div className="flex gap-4 items-center">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{pendingTasks.length} Acciones</span>
                    <button onClick={() => setShowStrategyModal(true)} className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 flex items-center gap-1 text-xs font-bold bg-slate-900/50 border border-slate-600"><Settings size={14}/> Configurar</button>
                </div>
             </div>
             {pendingTasks.length === 0 ? (<div className="text-center py-8 text-slate-500 italic">¡Estás al día! Relájate un poco. 🏝️</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{pendingTasks.map(task => (<div key={task.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600 hover:border-yellow-400 transition-colors flex justify-between items-center group"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded bg-slate-600 flex items-center justify-center font-bold text-xl text-slate-400 group-hover:text-white uppercase">{task.logo}</div><div><h4 className="font-bold text-yellow-400 text-sm truncate max-w-[150px]">{task.company}</h4><p className="text-xs text-white font-medium">{task.taskLabel}</p><p className="text-[10px] text-slate-400 mt-0.5">{task.daysOverdue > 0 ? `Hace ${task.daysOverdue} días` : 'Para hoy'}</p></div></div><button onClick={() => handleOpenJobFromTask(task)} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-3 py-1.5 rounded text-xs font-bold shadow-lg transform active:scale-95 transition-all">Gestionar</button></div>))}</div>)}
           </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-3 shadow-sm shrink-0 z-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Buscar empresa..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto"><span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ordenar por:</span><button onClick={() => setSortBy('last_updated')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${sortBy === 'last_updated' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={14}/> Actividad</button><button onClick={() => setSortBy('enthusiasm')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${sortBy === 'enthusiasm' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:bg-slate-100'}`}><Heart size={14}/> Interés</button><button onClick={() => setSortBy('alpha')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${sortBy === 'alpha' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}><ArrowDownWideNarrow size={14}/> A-Z</button></div>
        </div>
      </div>

      {/* Kanban */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {loading && <div className="flex justify-center items-center h-full text-slate-400 animate-pulse">Cargando pipeline...</div>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!loading && !error && (
            <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full min-w-max mx-auto">
                {Object.keys(columns).map((colId) => (
                <Droppable key={colId} droppableId={colId}>
                    {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-slate-200/60 rounded-xl p-3 w-80 flex flex-col h-full border border-slate-300/50 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-3 px-1 shrink-0"><div className="flex items-center gap-2"><h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">{colId}</h2><span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">{columns[colId].length}</span></div></div>
                        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {columns[colId].map((job, index) => (
                            <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }} onClick={() => handleOpenJob(job.id)} className={`bg-white p-4 rounded-lg border transition-all cursor-pointer group relative hover:shadow-md ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 z-50' : 'shadow-sm border-slate-200'} ${Number(job.enthusiasm) === 5 ? 'border-l-4 border-l-yellow-400' : 'hover:border-blue-400'}`}>
                                {Number(job.enthusiasm) === 5 && (<div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-50"></div>)}
                                <h3 className="font-bold text-slate-800 mb-0.5 leading-snug text-sm line-clamp-2">{job.title}</h3>
                                <p className="text-blue-600 text-xs font-bold flex items-center gap-1 mb-3 truncate"><Building2 size={10}/> {job.company}</p>
                                <div className="space-y-2"><div className="flex items-center justify-between text-[10px] text-slate-500 font-medium"><div className="flex items-center gap-2"><div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"><MapPin size={10}/> {job.location_type || 'Híbrido'}</div>{getContactCount(job) === 0 && (<div className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1"><UserX size={10}/> <span>0</span></div>)}</div>{job.salary && (<div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"><Euro size={10}/> {formatSalary(job.salary)}</div>)}</div><div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50"><div className="flex justify-between items-center"><div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Heart key={i} size={10} className={i < (Number(job.enthusiasm) || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}/>))}</div><div className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {formatDateShort(job.last_updated)}</div></div>{job.date_applied && (<div className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 text-[10px] font-bold flex items-center justify-center gap-1.5 mt-1"><CalendarCheck size={10}/> Postulado: {formatDateShort(job.date_applied)}</div>)}</div></div></div>
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
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col h-screen">
      <Routes>
        <Route path="/" element={<BoardView />} />
        <Route path="/job/:id" element={<JobPage jobs={jobs} onSave={handleSaveJob} />} />
        {/* 2. AQUÍ ESTÁ EL CAMBIO: Usamos CVBuilder en lugar del div */}
        <Route path="/cv" element={<CVBuilder />} />
      </Routes>

      {/* Modales disponibles en todas las rutas */}
      {showStrategyModal && <StrategyModal isOpen={showStrategyModal} onClose={() => setShowStrategyModal(false)} onSave={handleStrategySave}/>}
      {showStats && <StatsModal jobs={jobs} isOpen={showStats} onClose={() => setShowStats(false)}/>}
      {isQuickAddOpen && <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onSave={handleSaveJob}/>}
    </div>
  );
}