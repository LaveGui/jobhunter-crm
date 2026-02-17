import { PLAYBOOK as DEFAULT_PLAYBOOK } from './playbook';

// Aceptamos un segundo parámetro opcional: customPlaybook
export const calculatePendingTasks = (jobs, customPlaybook = null) => {
  const tasks = [];
  const today = new Date();
  
  // Si nos pasan reglas personalizadas las usamos, si no, las default
  const activePlaybook = customPlaybook || DEFAULT_PLAYBOOK;

  jobs.forEach(job => {
    // Protección contra datos corruptos
    if (!job.date_applied || job.status === 'Descartado' || job.status === 'Oferta') return;

    const appliedDate = new Date(job.date_applied);
    const diffTime = Math.abs(today - appliedDate);
    const daysSinceApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    activePlaybook.forEach(rule => {
      // Si la regla fue desactivada por el usuario, la ignoramos
      if (rule.enabled === false) return;

      if (daysSinceApplied >= rule.day) {
        // Buscamos si ya existe un log de este tipo DESPUÉS de haber aplicado
        const hasDoneIt = job.activity_log && Array.isArray(job.activity_log) && job.activity_log.some(log => {
           return log.type === rule.action; 
        });

        if (!hasDoneIt) {
          tasks.push({
            id: `${job.id}-${rule.day}`,
            jobId: job.id,
            company: job.company || 'Sin Empresa', // Protección visual
            title: job.title || 'Sin Cargo',
            logo: (job.company || '?').charAt(0),
            taskLabel: rule.label,
            taskDesc: rule.description,
            daysOverdue: daysSinceApplied - rule.day,
            actionType: rule.action
          });
        }
      }
    });
  });

  return tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
};