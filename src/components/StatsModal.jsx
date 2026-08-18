import { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, Target, Edit3, Save, Calendar } from 'lucide-react';
import { calculateMetrics } from '../utils/analyticsEngine';

export default function StatsModal({ jobs, isOpen, onClose }) {
  const [goals, setGoals] = useState({
    weeklyProspects: 10,
    weeklyApplications: 5,
    avgContacts: 2,
    avgActivities: 5
  });
  const [isEditing, setIsEditing] = useState(false);

  // Estado para el rango de fechas (Por defecto: Últimos 30 días)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Cargar metas guardadas
  useEffect(() => {
    const savedGoals = localStorage.getItem('jobhunter_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, []);

  const handleSaveGoals = () => {
    localStorage.setItem('jobhunter_goals', JSON.stringify(goals));
    setIsEditing(false);
  };

  // Helper para presets rápidos de fecha
  const handlePresetChange = (preset) => {
    const today = new Date();
    let start = new Date();

    if (preset === '30days') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'all') {
      setDateRange({ startDate: '', endDate: '' });
      return;
    }

    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  if (!isOpen) return null;

  // Recalcular métricas pasando el rango de fechas
  const metrics = calculateMetrics(jobs, dateRange.startDate, dateRange.endDate);

  // Helper para barras de progreso
  const GoalBar = ({ label, current, target, unit = '' }) => {
    const percent = Math.min(100, Math.round((current / target) * 100));
    const isMet = current >= target;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-slate-600">{label}</span>
          <span className={`${isMet ? 'text-green-600' : 'text-slate-500'}`}>
            {current} / {target} {unit}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isMet ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* HEADER CON SELECTORES DE FECHA */}
        <div className="bg-white p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600"/> Rendimiento & Funnel
            </h2>
            <p className="text-sm text-slate-500">Métricas de conversión filtradas por periodo.</p>
          </div>

          {/* CONTROLES DE FECHA Y PRESETS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button 
                onClick={() => handlePresetChange('30days')} 
                className="px-2 py-1 rounded bg-white hover:bg-slate-200 text-slate-700 font-medium shadow-sm transition-all"
              >
                30 días
              </button>
              <button 
                onClick={() => handlePresetChange('month')} 
                className="px-2 py-1 rounded bg-white hover:bg-slate-200 text-slate-700 font-medium shadow-sm transition-all"
              >
                Este mes
              </button>
              <button 
                onClick={() => handlePresetChange('all')} 
                className="px-2 py-1 rounded bg-white hover:bg-slate-200 text-slate-700 font-medium shadow-sm transition-all"
              >
                Histórico
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs">
              <Calendar size={14} className="text-slate-500 ml-1" />
              <input 
                type="date" 
                value={dateRange.startDate} 
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} 
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 outline-none focus:border-blue-500"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="date" 
                value={dateRange.endDate} 
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} 
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 outline-none focus:border-blue-500"
              />
            </div>

            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 ml-2">
              <X size={24}/>
            </button>
          </div>
        </div>

        {/* CONTENIDO (GRID 2 COLUMNAS) */}
        <div className="flex-1 overflow-y-auto p-6">
          {!metrics ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-base font-semibold">No se encontraron registros en el rango seleccionado.</p>
              <p className="text-xs mt-1">Prueba ampliado las fechas o seleccionando "Histórico".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* COLUMNA IZQUIERDA: EMBUDO & KPIS */}
              <div className="space-y-6">
                 
                 {/* KPIS RÁPIDOS */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1"><Target size={14}/> Activos</div>
                      <p className="text-2xl font-black text-slate-800">{metrics.activeProcesses}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1"><Clock size={14}/> Tiempos</div>
                      <p className="text-2xl font-black text-blue-600">{metrics.avgDaysToInterview} <span className="text-sm text-slate-400 font-normal">días</span></p>
                    </div>
                 </div>

                 {/* FUNNEL VISUAL */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Embudo de Conversión</h3>
                    <div className="space-y-8">
                      
                      {/* Paso 1 */}
                      <div className="relative">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                          <span>Oportunidades</span>
                          <span>{metrics.funnel.total_leads}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full"><div className="h-full bg-slate-300 w-full rounded-full"></div></div>
                      </div>

                      {/* Paso 2 */}
                      <div className="relative pl-4">
                        <div className="flex justify-between text-xs font-bold text-blue-600 mb-1">
                          <span>Aplicados</span>
                          <span>{metrics.funnel.total_applied}</span>
                        </div>
                        <div className="h-3 bg-blue-50 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${metrics.rates.apply_rate}%` }}></div>
                        </div>
                        <div className="text-right mt-1 text-[10px] font-bold text-blue-500">
                          {metrics.rates.apply_rate}% Conversión
                        </div>
                      </div>

                      {/* Paso 3 */}
                      <div className="relative pl-8">
                        <div className="flex justify-between text-xs font-bold text-purple-600 mb-1">
                          <span>Entrevistas</span>
                          <span>{metrics.funnel.total_interviews}</span>
                        </div>
                        <div className="h-3 bg-purple-50 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${metrics.rates.interview_rate}%` }}></div>
                        </div>
                        <div className="text-right mt-1 text-[10px] font-bold text-purple-500">
                          {metrics.rates.interview_rate}% Conversión
                        </div>
                      </div>

                      {/* Paso 4 */}
                      <div className="relative pl-12">
                        <div className="flex justify-between text-xs font-bold text-green-600 mb-1">
                          <span>Ofertas</span>
                          <span>{metrics.funnel.total_offers}</span>
                        </div>
                        <div className="h-3 bg-green-50 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${metrics.rates.offer_rate}%` }}></div>
                        </div>
                        {metrics.funnel.total_interviews > 0 && (
                          <div className="text-right mt-1 text-[10px] font-bold text-green-500">
                            {metrics.rates.offer_rate}% Cierre
                          </div>
                        )}
                      </div>

                    </div>
                 </div>
              </div>

              {/* COLUMNA DERECHA: OBJETIVOS DE ESFUERZO */}
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                   <div>
                     <h3 className="font-bold text-lg flex items-center gap-2"><Target className="text-yellow-400"/> Metas Semanales</h3>
                     <p className="text-xs text-slate-400">Métricas que TÚ controlas (Esfuerzo).</p>
                   </div>
                   <button 
                     onClick={() => isEditing ? handleSaveGoals() : setIsEditing(true)}
                     className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isEditing ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                   >
                     {isEditing ? <><Save size={14}/> Guardar</> : <><Edit3 size={14}/> Editar Metas</>}
                   </button>
                 </div>

                 {isEditing ? (
                   <div className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nuevos Prospectos / Semana</label>
                        <input type="number" value={goals.weeklyProspects} onChange={(e) => setGoals({...goals, weeklyProspects: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-yellow-400"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Postulaciones / Semana</label>
                        <input type="number" value={goals.weeklyApplications} onChange={(e) => setGoals({...goals, weeklyApplications: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-yellow-400"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Contactos por Oferta (Avg)</label>
                        <input type="number" value={goals.avgContacts} onChange={(e) => setGoals({...goals, avgContacts: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-yellow-400"/>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Actividades por Oferta (Avg)</label>
                        <input type="number" value={goals.avgActivities} onChange={(e) => setGoals({...goals, avgActivities: Number(e.target.value)})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-yellow-400"/>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <GoalBar label="Nuevos Prospectos (Esta Semana)" current={metrics.effort.newProspectsThisWeek} target={goals.weeklyProspects} />
                      <GoalBar label="Postulaciones Enviadas (Esta Semana)" current={metrics.effort.applicationsThisWeek} target={goals.weeklyApplications} />
                      
                      <div className="h-px bg-slate-700 my-4"></div>
                      
                      <GoalBar label="Profundidad de Networking (Contactos/Oferta)" current={metrics.effort.avgContacts} target={goals.avgContacts} />
                      <GoalBar label="Intensidad de Seguimiento (Actividad/Oferta)" current={metrics.effort.avgActivities} target={goals.avgActivities} />
                   </div>
                 )}

                 {!isEditing && (
                   <div className="mt-auto pt-6">
                     <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                       <h4 className="text-xs font-bold text-yellow-400 uppercase mb-2">Consejo del Coach</h4>
                       <p className="text-xs text-slate-300 italic">
                         {metrics.effort.applicationsThisWeek < goals.weeklyApplications 
                           ? "⚠️ Estás por debajo de tu meta de postulaciones. Bloquea 1 hora mañana solo para aplicar." 
                           : metrics.effort.avgContacts < goals.avgContacts
                             ? "⚠️ Estás aplicando, pero 'en frío'. Busca más contactos en LinkedIn para cada oferta."
                             : "🔥 ¡Buen ritmo! Tu esfuerzo es consistente. Los resultados llegarán."}
                       </p>
                     </div>
                   </div>
                 )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}