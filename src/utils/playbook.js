export const PLAYBOOK = [
  {
    day: 1, // Esperar 1 día desde que Aplicaste
    action: 'visit', 
    label: '🔍 Mapeo Masivo (Curiosidad)',
    description: 'Visita perfiles de RRHH y Managers para que vean tu nombre en sus notificaciones.'
  },
  {
    day: 1, // Esperar 1 día desde que los Visitaste
    action: 'connect',
    label: '🤝 Solicitud de Conexión',
    description: 'Envía solicitud a los que visitaste. (Si ya registraste que alguien te visitó, envíala ya).'
  },
  {
    day: 3, // Esperar 3 días desde que mandaste la Solicitud
    action: 'message',
    label: '👔 Mensaje de Ataque',
    description: 'Revisa quién aceptó tu solicitud y envíales tu script de venta (InMail/Mensaje directo).'
  },
  {
    day: 5, // Esperar 5 días desde el último Mensaje
    action: 'email',
    label: '📧 Follow Up (Email)',
    description: 'Si no hay respuesta en LinkedIn, busca su email corporativo y haz un seguimiento cruzado.'
  },
  {
    day: 5, // Esperar 5 días desde el Email
    action: 'call',
    label: '📞 Último Contacto',
    description: 'Llamada rápida, buscar contacto a través de un referido o dar por pausada.'
  }
];