import { PLAYBOOK } from './playbook';

export const calculatePendingTasks = (jobs) => {
  const tasks = [];
  const today = new Date();

  jobs.forEach(job => {
    // Solo analizamos si ya aplicaste y la oferta sigue activa (no descartada/oferta)
    if (!job.date_applied || job.status === 'Descartado' || job.status === 'Oferta') return;

    const appliedDate = new Date(job.date_applied);
    const diffTime = Math.abs(today - appliedDate);
    const daysSinceApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // Revisamos el Playbook regla por regla
    PLAYBOOK.forEach(rule => {
      // 1. ¿Ya pasó el día para esta regla?
      if (daysSinceApplied >= rule.day) {
        
        // 2. ¿Ya hice esta tarea? (Buscamos en la bitácora)
        const hasDoneIt = job.activity_log && Array.isArray(job.activity_log) && job.activity_log.some(log => {
           return log.type === rule.action; 
        });

        // 3. Si ES HORA y NO LO HICE -> Tarea Pendiente
        if (!hasDoneIt) {
          tasks.push({
            id: `${job.id}-${rule.day}`, // ID único para la lista
            jobId: job.id,
            company: job.company,
            title: job.title,
            logo: job.company.charAt(0),
            taskLabel: rule.label,
            taskDesc: rule.description,
            daysOverdue: daysSinceApplied - rule.day,
            actionType: rule.action // Para abrir el modal en la tab correcta
          });
        }
      }
    });
  });

  // Ordenamos: Las más atrasadas primero (urgencia)
  return tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
};