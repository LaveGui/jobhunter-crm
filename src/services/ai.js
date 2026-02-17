export const generateCVContent = async (apiKey, userContext, jobDescription) => {
  // 1. Validaciones básicas
  if (!apiKey) throw new Error("Falta la API Key de Gemini");
  if (!userContext) throw new Error("Falta tu Contexto Profesional");
  if (!jobDescription) throw new Error("Falta la descripción de la oferta");

  // 2. Configuración con el modelo CORRECTO detectado
  // Usamos 'gemini-2.0-flash' que está en tu lista permitida
  const TARGET_MODEL = "gemini-1.5-flash";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL}:generateContent?key=${apiKey}`;

  // 3. El Prompt (Instrucciones)
  const promptText = `
    ACTÚA COMO: Un experto redactor de CVs y reclutador senior.
    OBJETIVO: Adaptar mi perfil para una oferta.
    
    MI PERFIL (CONTEXTO):
    ${userContext}
    
    OFERTA DE TRABAJO:
    ${jobDescription}
    
    INSTRUCCIONES DE SALIDA:
    Devuelve SOLAMENTE un objeto JSON válido. No uses Markdown. No uses bloques de código.
    El JSON debe tener esta estructura exacta:
    {
      "summary": "Redacta un perfil profesional de 3-4 líneas enfocado en la oferta, usando keywords de la misma.",
      "experience": {
        "role": "El cargo de la oferta (o tu cargo actual adaptado)",
        "company": "Nombre de mi empresa más reciente o relevante",
        "date": "Fechas originales",
        "description": "3-4 bullets points con logros cuantificables adaptados a lo que pide la oferta."
      },
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4"]
    }
  `;

  // 4. La Llamada
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    
    // Verificación de seguridad
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("La IA no generó respuesta.");
    }

    const candidate = data.candidates[0].content.parts[0].text;

    // Limpieza de seguridad (Quitar ```json y ``` si la IA los pone)
    const cleanJson = candidate.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("❌ Error IA:", error);
    throw new Error(`Fallo al generar CV: ${error.message}`);
  }
};