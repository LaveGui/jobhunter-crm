export const PLAYBOOK = [
  {
    day: 1, // Al día siguiente de aplicar
    action: 'visit', 
    label: '🔍 Mapeo Masivo (Crear curiosidad)',
    description: 'Visita perfiles de RRHH, Managers y Peers. El objetivo es que vean tu nombre en sus notificaciones de LinkedIn.'
  },
  {
    day: 2, // Al segundo día
    action: 'connect',
    label: '🤝 Solicitud de Conexión',
    description: 'Envía solicitud a los que visitaste. (💡 Tip: Si ya registraste un hito de "👀 Me visitó", envíala inmediatamente).'
  },
  {
    day: 5, // Damos unos días para que acepten
    action: 'message',
    label: '👔 Mensaje de Ataque',
    description: 'Revisa quién aceptó tu solicitud y envíales tu script de venta desde los borradores.'
  },
  {
    day: 10,
    action: 'email',
    label: '📧 Follow Up (Email)',
    description: 'Si no hay respuesta en LinkedIn, busca su email corporativo y haz un seguimiento cruzado.'
  },
  {
    day: 15,
    action: 'call',
    label: '📞 Último Contacto',
    description: 'Llamada, contacto a través de un referido, o dar la oportunidad por "pausada".'
  }
];