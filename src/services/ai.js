import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateCVContent = async (apiKey, userContext, jobDescription) => {
  if (!apiKey) throw new Error("Falta la API Key de Gemini");
  if (!userContext) throw new Error("Falta tu Contexto Profesional");
  if (!jobDescription) throw new Error("Falta la descripción de la oferta");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // CAMBIO AQUÍ: Usamos 'gemini-pro' que es el modelo estándar universal
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    ACTÚA COMO: Un experto redactor de CVs y reclutador senior.
    
    TU OBJETIVO: Adaptar mi perfil profesional para una oferta de trabajo específica.
    
    INFORMACIÓN DE CONTEXTO (MI PERFIL):
    "${userContext}"
    
    OFERTA DE TRABAJO:
    "${jobDescription}"
    
    INSTRUCCIONES:
    1. Analiza mi perfil y la oferta.
    2. Reescribe mi "Resumen/Perfil" para que encaje con la oferta, usando palabras clave de la misma.
    3. Selecciona o adapta 1 experiencia laboral más relevante, destacando logros que importen para esta oferta.
    4. Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido (sin markdown, sin comillas extra al inicio o final).
    
    FORMATO JSON ESPERADO:
    {
      "summary": "Texto del nuevo perfil...",
      "experience": {
        "role": "Cargo adaptado",
        "company": "Empresa (usar una de mi historial)",
        "date": "Fechas",
        "description": "Descripción adaptada con logros..."
      },
      "skills": ["Skill1", "Skill2", "Skill3", "Skill4"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error IA:", error);
    // Mensaje de error más amigable
    throw new Error(`Error de IA: ${error.message}. Verifica tu API Key.`);
  }
};