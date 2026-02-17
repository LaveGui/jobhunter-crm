// ESTRATEGIA DE SEGUIMIENTO (Tu "Playbook")
// Day: Días después de aplicar (date_applied)
// Action: Tipo de actividad requerida (debe coincidir con los tipos del JobModal)
// Label: Lo que te dirá el sistema que hagas

export const PLAYBOOK = [
  {
    day: 2, // 2 días después de aplicar
    action: 'message', // Tipo de log esperado
    label: '🔍 Buscar y conectar en LinkedIn',
    description: 'Busca al Hiring Manager o Peers y conecta con nota.'
  },
  {
    day: 5,
    action: 'message',
    label: '👋 Enviar mensaje de seguimiento',
    description: 'Si aceptaron conexión, envía mensaje agradeciendo.'
  },
  {
    day: 10,
    action: 'email',
    label: '📧 Enviar Email de valor',
    description: 'Consigue el email y envía una propuesta o portfolio.'
  },
  {
    day: 15,
    action: 'call',
    label: '📞 Llamada / Contacto final',
    description: 'Intento final o marcar para revisión.'
  }
];