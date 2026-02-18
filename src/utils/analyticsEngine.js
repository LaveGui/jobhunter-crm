export const calculateMetrics = (jobs) => {
  const total = jobs.length;
  if (total === 0) return null;

  // --- 1. CALCULOS BÁSICOS (Igual que antes) ---
  const stages = {
    prospect: jobs.filter(j => j.status === 'Prospecto').length,
    applied: jobs.filter(j => j.status === 'Aplicado').length,
    interview: jobs.filter(j => j.status === 'Entrevista').length,
    offer: jobs.filter(j => j.status === 'Oferta').length,
    rejected: jobs.filter(j => j.status === 'Descartado').length,
  };

  const funnel = {
    total_leads: total,
    total_applied: stages.applied + stages.interview + stages.offer + stages.rejected,
    total_interviews: stages.interview + stages.offer,
    total_offers: stages.offer
  };

  const rates = {
    apply_rate: funnel.total_leads ? Math.round((funnel.total_applied / funnel.total_leads) * 100) : 0,
    interview_rate: funnel.total_applied ? Math.round((funnel.total_interviews / funnel.total_applied) * 100) : 0,
    offer_rate: funnel.total_interviews ? Math.round((funnel.total_offers / funnel.total_interviews) * 100) : 0
  };

  // --- 2. TIEMPOS (Igual que antes) ---
  const interviewJobs = jobs.filter(j => (j.status === 'Entrevista' || j.status === 'Oferta') && j.date_applied);
  let avgDaysToInterview = 0;
  if (interviewJobs.length > 0) {
    const totalDays = interviewJobs.reduce((acc, job) => {
      const start = new Date(job.date_applied);
      const end = new Date(job.last_updated); 
      const diff = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    avgDaysToInterview = Math.round(totalDays / interviewJobs.length);
  }

  // --- 3. GHOSTING (Igual que antes) ---
  const today = new Date();
  const ghostingJobs = jobs.filter(j => {
    if (j.status !== 'Aplicado' || !j.date_applied) return false;
    const diff = Math.ceil((today - new Date(j.date_applied)) / (1000 * 60 * 60 * 24));
    return diff > 15;
  });

  // --- 4. NUEVAS MÉTRICAS DE ESFUERZO (GOALS) ---
  
  // A. Prospectos creados esta semana (Lunes a Domingo)
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay() || 7; // Ajuste para que Lunes sea 1
  if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
  startOfWeek.setHours(0,0,0,0);

  const newProspectsThisWeek = jobs.filter(j => {
    const created = new Date(j.created_at); // Asegúrate de que tu Google Script guarde created_at
    return created >= startOfWeek;
  }).length;

  const applicationsThisWeek = jobs.filter(j => {
    if (!j.date_applied) return false;
    const applied = new Date(j.date_applied);
    return applied >= startOfWeek;
  }).length;

  // B. Promedios de Calidad (Contactos y Actividades)
  // Solo contamos ofertas activas (no descartadas) para ser justos
  const activeJobs = jobs.filter(j => j.status !== 'Descartado');
  
  const totalContacts = activeJobs.reduce((acc, job) => {
    // Helper seguro para contar contactos
    let count = 0;
    if (Array.isArray(job.contacts)) count = job.contacts.length;
    else if (typeof job.contacts === 'string') {
        try { count = JSON.parse(job.contacts).length; } catch(e) { count = 0; }
    }
    return acc + count;
  }, 0);

  const totalActivities = activeJobs.reduce((acc, job) => {
    // Helper seguro para contar logs
    let count = 0;
    if (Array.isArray(job.activity_log)) count = job.activity_log.length;
    else if (typeof job.activity_log === 'string') {
        try { count = JSON.parse(job.activity_log).length; } catch(e) { count = 0; }
    }
    return acc + count;
  }, 0);

  const avgContacts = activeJobs.length ? (totalContacts / activeJobs.length).toFixed(1) : 0;
  const avgActivities = activeJobs.length ? (totalActivities / activeJobs.length).toFixed(1) : 0;

  return {
    stages,
    funnel,
    rates,
    avgDaysToInterview,
    ghostingCount: ghostingJobs.length,
    activeProcesses: stages.applied + stages.interview,
    // KPIs de Esfuerzo
    effort: {
      newProspectsThisWeek,
      applicationsThisWeek,
      avgContacts,
      avgActivities
    }
  };
};