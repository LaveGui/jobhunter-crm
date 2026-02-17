import { X, TrendingUp, Clock, Ghost, Target, PieChart } from 'lucide-react';
import { calculateMetrics } from '../utils/analyticsEngine';

export default function StatsModal({ jobs, isOpen, onClose }) {
  if (!isOpen) return null;

  const metrics = calculateMetrics(jobs);

  if (!metrics) return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg">Cargando datos...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-white p-5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600"/> Métricas de Rendimiento
            </h2>
            <p className="text-sm text-slate-500">Análisis en tiempo real de tu búsqueda.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. KPIs PRINCIPALES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <Target size={14}/> Procesos Activos
              </div>
              <p className="text-2xl font-black text-slate-800">{metrics.activeProcesses}</p>
              <p className="text-xs text-slate-400">Esperando respuesta</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <Clock size={14}/> Tiempo a Entrevista
              </div>
              <p className="text-2xl font-black text-blue-600">{metrics.avgDaysToInterview} <span className="text-sm font-normal text-slate-500">días</span></p>
              <p className="text-xs text-slate-400">Promedio de espera</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <Ghost size={14}/> Tasa Ghosting
              </div>
              <p className="text-2xl font-black text-slate-800">{metrics.ghostingCount}</p>
              <p className="text-xs text-slate-400"> 15 días sin noticias</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                <PieChart size={14}/> Efectividad CV
              </div>
              <p className={`text-2xl font-black ${metrics.rates.interview_rate > 10 ? 'text-green-600' : 'text-orange-500'}`}>
                {metrics.rates.interview_rate}%
              </p>
              <p className="text-xs text-slate-400">Pasan a entrevista</p>
            </div>
          </div>

          {/* 2. EL EMBUDO DE CONVERSIÓN VISUAL */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">Probabilidad por Etapa (Funnel)</h3>
            
            <div className="space-y-6">
              
              {/* Nivel 1: Prospectos -> Aplicados */}
              <div className="relative">
                <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                  <span>Oportunidades Detectadas</span>
                  <span>{metrics.funnel.total_leads}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-full"></div>
                </div>
              </div>

              {/* Nivel 2: Aplicados */}
              <div className="relative pl-4 md:pl-8">
                <div className="flex justify-between text-sm font-bold text-blue-700 mb-1">
                  <span>Postulaciones Enviadas</span>
                  <span>{metrics.funnel.total_applied}</span>
                </div>
                <div className="h-4 w-full bg-blue-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${metrics.rates.apply_rate}%` }}
                  ></div>
                </div>
                <div className="absolute top-8 right-0 text-xs font-bold text-blue-600">
                  {metrics.rates.apply_rate}% Conversión
                </div>
              </div>

              {/* Nivel 3: Entrevistas */}
              <div className="relative pl-8 md:pl-16">
                <div className="flex justify-between text-sm font-bold text-purple-700 mb-1">
                  <span>Entrevistas Conseguidas</span>
                  <span>{metrics.funnel.total_interviews}</span>
                </div>
                <div className="h-4 w-full bg-purple-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-1000 delay-100" 
                    style={{ width: `${metrics.rates.interview_rate}%` }}
                  ></div>
                </div>
                <div className="absolute top-8 right-0 text-xs font-bold text-purple-600">
                  {metrics.rates.interview_rate}% Conversión
                </div>
              </div>

              {/* Nivel 4: Ofertas */}
              <div className="relative pl-12 md:pl-24">
                <div className="flex justify-between text-sm font-bold text-green-700 mb-1">
                  <span>Ofertas Recibidas</span>
                  <span>{metrics.funnel.total_offers}</span>
                </div>
                <div className="h-4 w-full bg-green-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000 delay-200" 
                    style={{ width: `${metrics.rates.offer_rate}%` }}
                  ></div>
                </div>
                {metrics.funnel.total_interviews > 0 && (
                  <div className="absolute top-8 right-0 text-xs font-bold text-green-600">
                    {metrics.rates.offer_rate}% Cierre
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 3. INSIGHTS RÁPIDOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-900 text-white p-5 rounded-xl">
               <h4 className="font-bold text-sm mb-3 text-slate-300 uppercase">Diagnóstico Rápido</h4>
               <ul className="space-y-3 text-sm">
                 <li className="flex gap-2">
                   {metrics.rates.interview_rate < 5 ? '🔴' : metrics.rates.interview_rate < 15 ? '🟡' : '🟢'}
                   <span>
                     {metrics.rates.interview_rate < 5 
                       ? "Tu CV podría necesitar mejorar. Pocas entrevistas." 
                       : metrics.rates.interview_rate < 15 
                         ? "Ratio normal de conversión a entrevista." 
                         : "¡Tu perfil es muy atractivo!"}
                   </span>
                 </li>
                 <li className="flex gap-2">
                   {metrics.ghostingCount > 5 ? '🔴' : '🟢'}
                   <span>
                     {metrics.ghostingCount > 5 
                       ? `Tienes ${metrics.ghostingCount} procesos estancados. ¡Haz seguimiento!` 
                       : "Mantienes tus procesos actualizados."}
                   </span>
                 </li>
               </ul>
             </div>
             
             <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col justify-center items-center text-center">
                <div className="mb-2 text-4xl">🚀</div>
                <p className="font-bold text-slate-800">Sigue empujando</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  "El 'No' ya lo tienes. Vas a por el 'Sí'. Mantén el pipeline lleno."
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}