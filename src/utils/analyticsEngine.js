export const calculateMetrics = (jobs) => {
  const total = jobs.length;
  if (total === 0) return null;

  // 1. CONTEO POR ETAPAS (SNAPSHOT ACTUAL)
  const stages = {
    prospect: jobs.filter(j => j.status === 'Prospecto').length,
    applied: jobs.filter(j => j.status === 'Aplicado').length,
    interview: jobs.filter(j => j.status === 'Entrevista').length,
    offer: jobs.filter(j => j.status === 'Oferta').length,
    rejected: jobs.filter(j => j.status === 'Descartado').length,
  };

  // 2. EMBUDO REAL (FUNNEL)
  // Total que ha pasado por cada fase (aprox)
  const funnel = {
    total_leads: total,
    total_applied: stages.applied + stages.interview + stages.offer + stages.rejected, // Asumimos que los descartados fueron aplicados
    total_interviews: stages.interview + stages.offer,
    total_offers: stages.offer
  };

  // Probabilidades (Conversion Rates)
  const rates = {
    apply_rate: funnel.total_leads ? Math.round((funnel.total_applied / funnel.total_leads) * 100) : 0,
    interview_rate: funnel.total_applied ? Math.round((funnel.total_interviews / funnel.total_applied) * 100) : 0,
    offer_rate: funnel.total_interviews ? Math.round((funnel.total_offers / funnel.total_interviews) * 100) : 0
  };

  // 3. TIEMPOS (VELOCITY)
  // Calculamos días promedio para llegar a entrevista
  const interviewJobs = jobs.filter(j => 
    (j.status === 'Entrevista' || j.status === 'Oferta') && j.date_applied
  );

  let avgDaysToInterview = 0;
  if (interviewJobs.length > 0) {
    const totalDays = interviewJobs.reduce((acc, job) => {
      // Como no tenemos fecha exacta de entrevista en la BD, usamos last_updated como aproximación 
      // o buscamos en los logs si quisiéramos ser ultra precisos. 
      // Para este MVP usamos last_updated asumiendo que se actualizó al moverla.
      const start = new Date(job.date_applied);
      const end = new Date(job.last_updated); 
      const diff = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    avgDaysToInterview = Math.round(totalDays / interviewJobs.length);
  }

  // 4. GHOSTING RATE (Aplicados hace >15 días sin pasar a entrevista ni descarte)
  const today = new Date();
  const ghostingJobs = jobs.filter(j => {
    if (j.status !== 'Aplicado' || !j.date_applied) return false;
    const applied = new Date(j.date_applied);
    const diff = Math.ceil((today - applied) / (1000 * 60 * 60 * 24));
    return diff > 15;
  });

  return {
    stages,
    funnel,
    rates,
    avgDaysToInterview,
    ghostingCount: ghostingJobs.length,
    activeProcesses: stages.applied + stages.interview // Procesos vivos
  };
};