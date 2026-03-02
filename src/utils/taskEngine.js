import { PLAYBOOK as DEFAULT_PLAYBOOK } from './playbook';

const parseEsDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const parts = dateString.split(/[ /,:]+/); 
    if (parts.length >= 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    if (dateString.includes('-')) return new Date(dateString); // Formato YYYY-MM-DD
    return new Date(dateString); 
  } catch(e) { return new Date(); }
};

export const calculatePendingTasks = (jobs, customPlaybook = null) => {
  const tasks = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const activePlaybook = customPlaybook && customPlaybook.length > 0 ? customPlaybook : DEFAULT_PLAYBOOK;

  jobs.forEach(job => {
    // Si no has aplicado o está descartado, no hacemos nada de nada.
    if (!job.date_applied || job.status === 'Descartado') return;

    let logs = [];
    try {
      if (typeof job.activity_log === 'string') logs = JSON.parse(job.activity_log || '[]');
      else if (Array.isArray(job.activity_log)) logs = job.activity_log;
    } catch (e) { logs = []; }

    // 1️⃣ TAREAS DE EVENTOS (Prioridad Máxima: Entrevistas)
    const interviewLogs = logs.filter(log => log.type === 'interview');
    let hasPendingInterviewFeedback = false;

    if (interviewLogs.length > 0) {
      // Tomamos la última entrevista agendada
      const lastInterview = interviewLogs[0]; 
      if (lastInterview.scheduledDate) {
        const interviewDate = new Date(lastInterview.scheduledDate);
        interviewDate.setHours(0,0,0,0);

        // Si la entrevista ya pasó (o es hoy)
        if (today >= interviewDate) {
          // Buscamos si hay un log de tipo "feedback" DESPUÉS de esa fecha
          const feedbackLog = logs.find(log => log.type === 'feedback' && parseEsDate(log.date) >= interviewDate);
          
          if (!feedbackLog) {
            hasPendingInterviewFeedback = true;
            tasks.push({
              id: `${job.id}-feedback`,
              jobId: job.id,
              company: job.company || 'Sin Empresa',
              title: job.title || 'Sin Cargo',
              logo: (job.company || '?').charAt(0),
              taskLabel: '🚨 Dar Feedback de Entrevista',
              taskDesc: 'La entrevista ya pasó. ¡Apunta qué tal fue y los siguientes pasos!',
              daysOverdue: Math.floor((today - interviewDate) / (1000 * 60 * 60 * 24)),
              actionType: 'feedback'
            });
          }
        }
      }
    }

    // 2️⃣ TAREAS DE SECUENCIA (Outbound)
    // 🛑 AQUI ESTÁ EL CAMBIO: No mostramos tareas de seguimiento si ya estás en Entrevista u Oferta.
    if (!hasPendingInterviewFeedback && job.status !== 'Oferta' && job.status !== 'Entrevista') {
      let baseDate = new Date(job.date_applied);
      baseDate.setHours(0,0,0,0);
      let pendingTask = null;

      for (let i = 0; i < activePlaybook.length; i++) {
        const rule = activePlaybook[i];
        if (rule.enabled === false) continue;

        const logForStep = logs.find(log => log.type === rule.action);

        if (logForStep) {
          baseDate = parseEsDate(logForStep.date);
          baseDate.setHours(0,0,0,0);
        } else {
          let targetDate = new Date(baseDate);
          targetDate.setDate(targetDate.getDate() + (Number(rule.day) || 0));

          if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2); 
          if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1); 

          if (today >= targetDate) {
            const diffTime = today - targetDate;
            pendingTask = {
              id: `${job.id}-${rule.action}`,
              jobId: job.id,
              company: job.company || 'Sin Empresa',
              title: job.title || 'Sin Cargo',
              logo: (job.company || '?').charAt(0),
              taskLabel: rule.label,
              taskDesc: rule.description,
              daysOverdue: Math.floor(diffTime / (1000 * 60 * 60 * 24)),
              actionType: rule.action
            };
          }
          break; 
        }
      }
      if (pendingTask) tasks.push(pendingTask);
    }
  });

  return tasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
};