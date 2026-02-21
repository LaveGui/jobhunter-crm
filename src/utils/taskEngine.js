import { PLAYBOOK as DEFAULT_PLAYBOOK } from './playbook';

// Helper para transformar el texto de fecha de la bitácora en un objeto Date real
const parseEsDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const parts = dateString.split(/[ /,:]+/); // Rompe "21/02/2026, 15:30:00"
    if (parts.length >= 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateString); 
  } catch(e) {
    return new Date();
  }
};

export const calculatePendingTasks = (jobs, customPlaybook = null) => {
  const tasks = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const activePlaybook = customPlaybook && customPlaybook.length > 0 ? customPlaybook : DEFAULT_PLAYBOOK;

  jobs.forEach(job => {
    if (!job.date_applied || job.status === 'Descartado' || job.status === 'Oferta') return;

    let logs = [];
    try {
      if (typeof job.activity_log === 'string') logs = JSON.parse(job.activity_log || '[]');
      else if (Array.isArray(job.activity_log)) logs = job.activity_log;
    } catch (e) { logs = []; }

    // El punto de partida inicial es la fecha en que aplicaste
    let baseDate = new Date(job.date_applied);
    baseDate.setHours(0,0,0,0);
    let pendingTask = null;

    // Recorremos la estrategia paso a paso
    for (let i = 0; i < activePlaybook.length; i++) {
      const rule = activePlaybook[i];
      if (rule.enabled === false) continue;

      // Buscamos si ya hiciste esta acción en concreto
      const logForStep = logs.find(log => log.type === rule.action);

      if (logForStep) {
        // ✅ PASO COMPLETADO: La nueva fecha base es el día que hiciste esta acción
        baseDate = parseEsDate(logForStep.date);
        baseDate.setHours(0,0,0,0);
      } else {
        // ❌ PASO PENDIENTE: Calcular para cuándo toca
        let targetDate = new Date(baseDate);
        targetDate.setDate(targetDate.getDate() + (Number(rule.day) || 0));

        // 💤 SNOOZE FIN DE SEMANA (La regla de oro)
        if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2); // Sábado -> Lunes
        if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1); // Domingo -> Lunes

        // ¿Ya llegó el día objetivo?
        if (today >= targetDate) {
          const diffTime = today - targetDate;
          const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          pendingTask = {
            id: `${job.id}-${rule.action}`,
            jobId: job.id,
            company: job.company || 'Sin Empresa',
            title: job.title || 'Sin Cargo',
            logo: (job.company || '?').charAt(0),
            taskLabel: rule.label,
            taskDesc: rule.description,
            daysOverdue: daysOverdue,
            actionType: rule.action
          };
        }
        
        // 🛑 RUPTURA DE CADENCIA: Como es secuencial, si no has hecho este paso, 
        // no te muestro el siguiente. Rompemos el bucle aquí.
        break; 
      }
    }

    if (pendingTask) tasks.push(pendingTask);
  });

  return tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
};