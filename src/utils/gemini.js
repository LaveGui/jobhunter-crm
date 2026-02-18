import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeJobDescription = async (description) => {
  // Recuperamos la API Key que guardaste en el modal de configuración
  const apiKey = localStorage.getItem('gemini_api_key');
  
  if (!apiKey) {
    throw new Error("Falta la API Key. Configúrala en el botón de Tareas (Rayo) > Configurar (Engranaje).");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // --- CAMBIO AQUÍ: Usamos el modelo actual 'gemini-1.5-flash' ---
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analiza la siguiente descripción de trabajo y extrae la información en formato JSON estricto.
    No uses Markdown, ni bloques de código, solo devuelve el objeto JSON puro.
    
    Descripción:
    "${description.substring(0, 10000)}"

    Formato JSON requerido:
    {
      "summary": "Resumen ejecutivo de 2 lineas destacando el rol y el objetivo principal.",
      "requirements": "Lista breve (max 5 items) con los requisitos técnicos y soft skills clave.",
      "benefits": "Lista breve (max 5 items) de beneficios destacados."
    }
    
    Responde en Español.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpieza agresiva por si la IA devuelve markdown
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error analizando con Gemini:", error);
    throw new Error("Fallo al conectar con IA. Revisa tu API Key o intenta de nuevo.");
  }
};