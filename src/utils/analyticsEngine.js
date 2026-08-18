// --- HELPER DE PARSEO SEGURO PARA LISTAS JSON O ARRAYS ---
const parseJsonArray = (data) => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string' && data.trim()) {
    try { return JSON.parse(data); } catch (_) { return []; }
  }
  return [];
};

// --- HELPER PARA DETECTAR ENTREVISTAS EN EL LOG DE ACTIVIDADES ---
const hasInterviewInLog = (job, startDate, endDate) => {
  const logs = parseJsonArray(job.activity_log || job.activities);
  
  return logs.some(act => {
    // Si hay rango de fechas, validamos que la actividad ocurrió dentro del rango
    if (act.date || act.fecha) {
      const actDate = new Date(act.date || act.fecha);
      if (startDate && actDate < startDate) return false;
      if (endDate && actDate > endDate) return false;
    }

    const type = String(act.type || act.tipo || '').toLowerCase();
    const note = String(act.notes || act.descripcion || act.comment || '').toLowerCase();

    return type.includes('interview') || 
           type.includes('entrevista') || 
           note.includes('entrevista') || 
           note.includes('interview');
  });
};

export const calculateMetrics = (jobs = [], startDate = null, endDate = null) => {
  if (!jobs || jobs.length === 0) return null;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999); // Cubrir todo el día de fin

  // --- 0. FILTRADO DE PUESTOS POR PERIODO SELECCIONADO ---
  const filteredJobs = jobs.filter(job => {
    // Usamos fecha de creación, aplicación o actualización según la disponible
    const jobDateRaw = job.created_at || job.date_applied || job.last_updated;
    if (!jobDateRaw) return true; // Si no hay fecha registrada, se incluye por defecto
    
    const jobDate = new Date(jobDateRaw);
    if (start && jobDate < start) return false;
    if (end && jobDate > end) return false;
    return true;
  });

  const total = filteredJobs.length;
  if (total === 0) return null;

  // --- 1. CONTEO DE ESTADOS BÁSICOS EN EL PERIODO ---
  const stages = {
    prospect: filteredJobs.filter(j => j.status === 'Prospecto').length,
    applied: filteredJobs.filter(j => j.status === 'Aplicado').length,
    interview: filteredJobs.filter(j => j.status === 'Entrevista').length,
    offer: filteredJobs.filter(j => j.status === 'Oferta').length,
    rejected: filteredJobs.filter(j => j.status === 'Descartado').length,
  };

  // --- 2. EMBUDO & DETECCIÓN DE ENTREVISTAS POR ACTIVITY LOG ---
  // A. Puestos en los que se ha aplicado efectivamente
  const appliedJobs = filteredJobs.filter(j => j.status !== 'Prospecto' && j.status !== 'Draft');

  // B. Puestos que pasaron a entrevista (por estado actual O por registro en su log de actividades)
  const interviewedJobs = filteredJobs.filter(j => {
    if (['Entrevista', 'Oferta'].includes(j.status)) return true;
    return hasInterviewInLog(j, start, end);
  });

  // C. Ofertas conseguidas
  const offerJobs = filteredJobs.filter(j => j.status === 'Oferta');

  const funnel = {
    total_leads: total,
    total_applied: appliedJobs.length,
    total_interviews: interviewedJobs.length,
    total_offers: offerJobs.length
  };

  const rates = {
    apply_rate: funnel.total_leads ? Math.round((funnel.total_applied / funnel.total_leads) * 100) : 0,
    interview_rate: funnel.total_applied ? Math.round((funnel.total_interviews / funnel.total_applied) * 100) : 0,
    offer_rate: funnel.total_interviews ? Math.round((funnel.total_offers / funnel.total_interviews) * 100) : 0
  };

  // --- 3. TIEMPOS DÍAS A ENTREVISTA ---
  const interviewJobsWithDate = interviewedJobs.filter(j => j.date_applied);
  let avgDaysToInterview = 0;
  if (interviewJobsWithDate.length > 0) {
    const totalDays = interviewJobsWithDate.reduce((acc, job) => {
      const startDateApplied = new Date(job.date_applied);
      const endDateUpdated = new Date(job.last_updated || Date.now()); 
      const diff = Math.max(0, Math.ceil((endDateUpdated - startDateApplied) / (1000 * 60 * 60 * 24)));
      return acc + diff;
    }, 0);
    avgDaysToInterview = Math.round(totalDays / interviewJobsWithDate.length);
  }

  // --- 4. GHOSTING (>15 días sin respuesta) ---
  const today = new Date();
  const ghostingJobs = filteredJobs.filter(j => {
    if (j.status !== 'Aplicado' || !j.date_applied) return false;
    const diff = Math.ceil((today - new Date(j.date_applied)) / (1000 * 60 * 60 * 24));
    return diff > 15;
  });

  // --- 5. MÉTRICAS DE ESFUERZO SEMANAL ---
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay() || 7; 
  if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
  startOfWeek.setHours(0,0,0,0);

  const newProspectsThisWeek = filteredJobs.filter(j => {
    if (!j.created_at) return false;
    return new Date(j.created_at) >= startOfWeek;
  }).length;

  const applicationsThisWeek = filteredJobs.filter(j => {
    if (!j.date_applied) return false;
    return new Date(j.date_applied) >= startOfWeek;
  }).length;

  // --- 6. PROMEDIOS DE CONTACTOS Y ACTIVIDADES ---
  const activeJobs = filteredJobs.filter(j => ['Aplicado', 'Entrevista', 'Oferta'].includes(j.status));

  const totalContacts = activeJobs.reduce((acc, job) => {
    return acc + parseJsonArray(job.contacts).length;
  }, 0);

  const totalActivities = activeJobs.reduce((acc, job) => {
    return acc + parseJsonArray(job.activity_log || job.activities).length;
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
    effort: {
      newProspectsThisWeek,
      applicationsThisWeek,
      avgContacts,
      avgActivities
    }
  };
};