import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import confetti from 'canvas-confetti'; // <--- NUEVO: Animaciones
import { 
  Plus, Search, Building2, MapPin, Euro, Heart, 
  CalendarCheck, Clock, UserX, Activity, ArrowDownWideNarrow, 
  Zap, Settings, BarChart3, Flame, Trophy // <--- NUEVO: Iconos Gamificación
} from 'lucide-react'; 
import useGoogleSheets from './hooks/useGoogleSheets';
import QuickAddModal from './components/QuickAddModal';
import StrategyModal from './components/StrategyModal';
import StatsModal from './components/StatsModal';
import JobPage from './pages/JobPage';
import CVBuilder from './CVBuilder'; 
import { calculatePendingTasks } from './utils/taskEngine';
import { PLAYBOOK as DEFAULT_PLAYBOOK } from './utils/playbook';

// Helper para parsear las fechas de la bitácora
const parseEsDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const parts = dateString.split(/[ /,:]+/);
    if (parts.length >= 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    return new Date(dateString); 
  } catch(e) { return new Date(); }
};

export default function App() {
  const { jobs, loading, error, addJob, updateJob } = useGoogleSheets();
  const navigate = useNavigate();

  const [columns, setColumns] = useState({ 'Prospecto': [], 'Aplicado': [], 'Entrevista': [], 'Oferta': [], 'Descartado': [] });
  const [pendingTasks, setPendingTasks] = useState([]);
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  
  const [activePlaybook, setActivePlaybook] = useState(DEFAULT_PLAYBOOK);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('last_updated'); 

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

  // --- MOTOR DE GAMIFICACIÓN ---
  const { xp, levelInfo, streak } = useMemo(() => {
    let totalXP = 0;
    const activeDates = new Set();

    jobs.forEach(job => {
      // XP por Status
      if (job.status === 'Entrevista') totalXP += 100;
      if (job.status === 'Oferta') totalXP += 300;

      let logs = [];
      try { logs = typeof job.activity_log === 'string' ? JSON.parse(job.activity_log) : job.activity_log; } catch(e){}
      
      if (logs && logs.length > 0) {
        logs.forEach(log => {
          // XP por Esfuerzo Proactivo
          if (log.type === 'note') totalXP += 5;
          if (log.type === 'apply') totalXP += 10;
          if (log.type === 'visit') totalXP += 15;
          if (log.type === 'connect') totalXP += 20;
          if (log.type === 'message' || log.type === 'email' || log.type === 'call') totalXP += 30;

          // Recopilamos fechas para calcular la racha
          if (log.date) {
            const d = parseEsDate(log.date);
            activeDates.add(d.setHours(0,0,0,0));
          }
        });
      }
    });

    // Niveles
    const getLevel = (puntos) => {
      if (puntos < 150) return { level: 1, name: 'Novato B2B' };
      if (puntos < 400) return { level: 2, name: 'Buscador Activo' };
      if (puntos < 800) return { level: 3, name: 'Networker' };
      if (puntos < 1500) return { level: 4, name: 'Ninja Outbound' };
      return { level: 5, name: 'Maestro Jedi' };
    };

    // Calculadora de Racha (Días Hábiles)
    const calculateStreak = () => {
      const dates = Array.from(activeDates).sort((a,b) => b - a);
      if (dates.length === 0) return 0;
      
      let currentStreak = 0;
      let refDate = new Date();
      refDate.setHours(0,0,0,0);
      let today = refDate.getTime();
      
      while(true) {
        if (dates.includes(refDate.getTime())) {
            currentStreak++;
        } else if (refDate.getDay() !== 0 && refDate.getDay() !== 6) {
            // Es un día de semana y no hay registro. ¿Rompimos la racha?
            // Si es "hoy" perdonamos (porque a lo mejor aún no has entrado)
            if (refDate.getTime() !== today) break;
        }
        refDate.setDate(refDate.getDate() - 1);
        refDate.setHours(0,0,0,0);
        if (currentStreak > 365) break; // Límite de seguridad
      }
      return currentStreak;
    };

    return { xp: totalXP, levelInfo: getLevel(totalXP), streak: calculateStreak() };
  }, [jobs]);

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

  const handleOpenJob = (jobId) => navigate(`/job/${jobId}`);
  const handleOpenJobFromTask = (task) => navigate(`/job/${task.jobId}`);
  const handleOpenCV = () => navigate('/cv');
  const handleStrategySave = (newRules) => setActivePlaybook(newRules);

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
         
         // 🎉 CONFETI GAMIFICACIÓN
         if (newStatus === 'Entrevista' && source.droppableId !== 'Entrevista') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
         } else if (newStatus === 'Oferta' && source.droppableId !== 'Oferta') {
            confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 }, colors: ['#FFD700', '#FFA500', '#FF8C00'] });
         }
     }
     let extraUpdates = {};
     if (newStatus === 'Aplicado' && !movedJob.date_applied) { extraUpdates.date_applied = new Date().toISOString().split('T')[0]; }
     updateJob({ ...movedJob, status: newStatus, last_updated: new Date().toISOString(), ...extraUpdates });
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      <Routes>
        <Route path="/" element={
          <div className="flex flex-col h-screen overflow-hidden">
            {/* HEADER RESPONSIVO Y GAMIFICADO */}
            <header className="bg-slate-900 text-white p-3 md:p-4 shadow-lg shrink-0 z-20">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Logo & Gamificación */}
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <Link to="/" className="flex items-center gap-2 hover:text-blue-300 transition-colors">
                    <span className="text-2xl">🚀</span>
                    <h1 className="text-xl font-bold tracking-tight">JobHunter</h1>
                  </Link>
                  <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-inner">
                      <div className="flex items-center gap-1 font-bold text-xs md:text-sm" title="Racha de actividad (Días Hábiles)">
                          <Flame size={16} className={streak > 0 ? "fill-orange-500 text-orange-500" : "text-slate-500"} />
                          <span className={streak > 0 ? "text-orange-400" : "text-slate-500"}>{streak}</span>
                      </div>
                      <div className="w-px h-4 bg-slate-600"></div>
                      <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs md:text-sm" title={`Nivel ${levelInfo.level}`}>
                          <Trophy size={14} className="text-yellow-400" />
                          <span>{xp} XP</span>
                          <span className="hidden md:inline text-slate-400 font-normal ml-1">- {levelInfo.name}</span>
                      </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 w-full md:w-auto">
                  <button onClick={() => setShowStats(true)} className="p-2 rounded-lg bg-slate-800 text-blue-400 hover:bg-slate-700 hover:text-white border border-slate-700 hidden sm:block"><BarChart3 size={18} /></button>
                  <button onClick={() => setShowTaskPanel(!showTaskPanel)} className={`relative px-3 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all ${showTaskPanel ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                    <Zap size={14} className={showTaskPanel ? 'fill-slate-900' : 'fill-yellow-400 text-yellow-400'}/> <span className="hidden sm:inline">Tareas</span>
                    {pendingTasks.length > 0 && (<span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">{pendingTasks.length}</span>)}
                  </button>
                  <button onClick={handleOpenCV} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold text-xs md:text-sm shadow-lg">CV Studio</button>
                  <button onClick={() => setIsQuickAddOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-1 transition-colors"><Plus size={16} /> <span className="hidden sm:inline">Nueva Oportunidad</span></button>
                </div>
              </div>
            </header>

            {/* TASK PANEL RESPONSIVO */}
            {showTaskPanel && (
              <div className="bg-slate-800 text-white border-b border-slate-700 p-4 shadow-inner z-10 relative">
                 <div className="max-w-3xl mx-auto">
                   <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
                      <h3 className="font-bold text-base md:text-lg flex items-center gap-2"><Zap className="text-yellow-400 fill-yellow-400" size={18}/> Tareas para Hoy</h3>
                      <div className="flex gap-2 md:gap-4 items-center">
                          <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">{pendingTasks.length} Acciones</span>
                          <button onClick={() => setShowStrategyModal(true)} className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 flex items-center gap-1 text-[10px] md:text-xs font-bold bg-slate-900/50 border border-slate-600"><Settings size={12}/> Configurar</button>
                      </div>
                   </div>
                   {pendingTasks.length === 0 ? (<div className="text-center py-6 text-slate-500 italic text-sm">¡Estás al día! Relájate un poco. 🏝️</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">{pendingTasks.map(task => (<div key={task.id} className="bg-slate-700 p-3 rounded-lg border border-slate-600 hover:border-yellow-400 transition-colors flex justify-between items-center group"><div className="flex items-center gap-2 md:gap-3"><div className="w-8 h-8 md:w-10 md:h-10 rounded bg-slate-600 flex items-center justify-center font-bold text-base md:text-xl text-slate-400 group-hover:text-white uppercase shrink-0">{task.logo}</div><div><h4 className="font-bold text-yellow-400 text-xs md:text-sm truncate max-w-[130px] md:max-w-[150px]">{task.company}</h4><p className="text-[10px] md:text-xs text-white font-medium">{task.taskLabel}</p><p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">{task.daysOverdue > 0 ? `Hace ${task.daysOverdue} días` : 'Para hoy'}</p></div></div><button onClick={() => handleOpenJobFromTask(task)} className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-2.5 py-1.5 md:px-3 rounded text-[10px] md:text-xs font-bold shadow-lg transform active:scale-95 transition-all">Gestionar</button></div>))}</div>)}
                 </div>
              </div>
            )}

            {/* FILTROS RESPONSIVOS */}
            <div className="bg-white border-b border-slate-200 p-3 shadow-sm shrink-0 z-10">
               <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Buscar empresa..." className="w-full pl-9 pr-4 py-1.5 md:py-2 bg-slate-100 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs md:text-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar"><span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Ordenar por:</span><button onClick={() => setSortBy('last_updated')} className={`px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 whitespace-nowrap ${sortBy === 'last_updated' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={12}/> Actividad</button><button onClick={() => setSortBy('enthusiasm')} className={`px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 whitespace-nowrap ${sortBy === 'enthusiasm' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-500 hover:bg-slate-100'}`}><Heart size={12}/> Interés</button><button onClick={() => setSortBy('alpha')} className={`px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 whitespace-nowrap ${sortBy === 'alpha' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}><ArrowDownWideNarrow size={12}/> A-Z</button></div>
              </div>
            </div>

            {/* KANBAN: SCROLL HORIZONTAL FLUIDO EN MÓVILES */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-4 bg-slate-100/50">
              {loading && <div className="flex justify-center items-center h-full text-slate-400 animate-pulse text-sm">Cargando pipeline...</div>}
              {error && <p className="text-center text-red-500 text-sm">Error: {error}</p>}
              {!loading && !error && (
                  <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex gap-4 md:gap-6 h-full min-w-max mx-auto pb-6">
                      {Object.keys(columns).map((colId) => (
                      <Droppable key={colId} droppableId={colId}>
                          {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="bg-slate-200/80 rounded-xl p-2 md:p-3 w-72 md:w-80 flex flex-col h-full border border-slate-300/50 backdrop-blur-sm shadow-sm">
                              <div className="flex justify-between items-center mb-2 md:mb-3 px-1 shrink-0"><div className="flex items-center gap-2"><h2 className="font-bold text-slate-700 uppercase text-[10px] md:text-xs tracking-wider">{colId}</h2><span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-slate-100">{columns[colId].length}</span></div></div>
                              <div className="flex-1 overflow-y-auto pr-1 space-y-2 md:space-y-3 custom-scrollbar pb-2">
                              {columns[colId].map((job, index) => {
                                  const jobTasks = pendingTasks.filter(t => t.jobId === job.id);
                                  return (
                                  <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                                  {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }} onClick={() => handleOpenJob(job.id)} className={`bg-white p-3 md:p-4 rounded-lg border transition-all cursor-pointer group relative hover:shadow-md ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 z-50' : 'shadow-sm border-slate-200'} ${Number(job.enthusiasm) === 5 ? 'border-l-4 border-l-yellow-400' : 'hover:border-blue-400'}`}>
                                      {Number(job.enthusiasm) === 5 && (<div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-50 rounded-t-lg"></div>)}
                                      <h3 className="font-bold text-slate-800 mb-0.5 leading-snug text-xs md:text-sm line-clamp-2">{job.title}</h3>
                                      <p className="text-blue-600 text-[10px] md:text-xs font-bold flex items-center gap-1 mb-2 md:mb-3 truncate"><Building2 size={10}/> {job.company}</p>
                                      <div className="space-y-1.5 md:space-y-2">
                                          <div className="flex items-center justify-between text-[9px] md:text-[10px] text-slate-500 font-medium"><div className="flex items-center gap-1.5 md:gap-2"><div className="flex items-center gap-1 bg-slate-50 px-1 md:px-1.5 py-0.5 rounded border border-slate-100"><MapPin size={10}/> {job.location_type || 'Híbrido'}</div>{getContactCount(job) === 0 && (<div className="text-orange-500 bg-orange-50 px-1 md:px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1"><UserX size={10}/> <span>0</span></div>)}</div>{job.salary && (<div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1 md:px-1.5 py-0.5 rounded border border-emerald-100"><Euro size={10}/> {formatSalary(job.salary)}</div>)}</div>
                                          <div className="flex flex-col gap-1 md:gap-1.5 pt-1.5 md:pt-2 border-t border-slate-50">
                                              <div className="flex justify-between items-center"><div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Heart key={i} size={8} className={`md:w-2.5 md:h-2.5 ${i < (Number(job.enthusiasm) || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}`}/>))}</div><div className="text-[9px] md:text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {formatDateShort(job.last_updated)}</div></div>
                                              {job.date_applied && (<div className="bg-green-50 text-green-700 px-1.5 py-1 rounded border border-green-100 text-[9px] md:text-[10px] font-bold flex items-center justify-center gap-1 md:gap-1.5 mt-0.5"><CalendarCheck size={10}/> Postulado: {formatDateShort(job.date_applied)}</div>)}
                                          </div>
                                          {jobTasks.length > 0 && (
                                            <div className="mt-1 md:mt-2 bg-red-50 border border-red-100 text-red-600 text-[9px] md:text-[10px] font-bold px-1.5 py-1 md:py-1.5 rounded flex items-center gap-1.5">
                                               <Zap size={10} className="fill-red-600 md:w-3 md:h-3"/> {jobTasks[0].taskLabel}
                                            </div>
                                          )}
                                      </div>
                                      </div>
                                  )}
                                  </Draggable>
                                  );
                              })}
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
        } />

        <Route path="/job/:id" element={<JobPage jobs={jobs} onSave={handleSaveJob} pendingTasks={pendingTasks} />} />
        <Route path="/cv" element={<CVBuilder />} />
      </Routes>

      {showStrategyModal && <StrategyModal isOpen={showStrategyModal} onClose={() => setShowStrategyModal(false)} onSave={handleStrategySave}/>}
      {showStats && <StatsModal jobs={jobs} isOpen={showStats} onClose={() => setShowStats(false)}/>}
      {isQuickAddOpen && <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onSave={handleSaveJob}/>}
    </div>
  );
}