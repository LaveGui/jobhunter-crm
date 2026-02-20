import { PLAYBOOK as DEFAULT_PLAYBOOK } from './playbook';

export const calculatePendingTasks = (jobs, customPlaybook = null) => {
  const tasks = [];
  const today = new Date();
  
  const activePlaybook = customPlaybook && customPlaybook.length > 0 ? customPlaybook : DEFAULT_PLAYBOOK;

  jobs.forEach(job => {
    // Solo analizamos ofertas activas y con fecha de postulación
    if (!job.date_applied || job.status === 'Descartado' || job.status === 'Oferta') return;

    const appliedDate = new Date(job.date_applied);
    const diffTime = Math.abs(today - appliedDate);
    const daysSinceApplied = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // FIX VITAL: Convertir el string de Google Sheets a un Array real
    let logs = [];
    try {
      if (typeof job.activity_log === 'string') {
        logs = JSON.parse(job.activity_log || '[]');
      } else if (Array.isArray(job.activity_log)) {
        logs = job.activity_log;
      }
    } catch (e) {
      console.error("Error leyendo logs de la oferta", job.company, e);
      logs = [];
    }

    activePlaybook.forEach(rule => {
      // Ignorar reglas desactivadas
      if (rule.enabled === false) return;

      if (daysSinceApplied >= rule.day) {
        
        // Buscar si existe un log del tipo exacto que pide la regla (ej: 'message')
        const hasDoneIt = logs.some(log => log.type === rule.action);

        if (!hasDoneIt) {
          tasks.push({
            id: `${job.id}-${rule.day}-${rule.action}`, // ID único real
            jobId: job.id,
            company: job.company || 'Sin Empresa',
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