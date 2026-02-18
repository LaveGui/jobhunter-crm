import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzeJobDescription = async (description) => {
  const apiKey = localStorage.getItem('gemini_api_key');
  
  if (!apiKey) {
    throw new Error("Falta la API Key de Gemini. Configúrala en CV Studio.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Analiza la siguiente descripción de trabajo y extrae la información en formato JSON estricto.
    No uses Markdown (bdticks), solo devuelve el objeto JSON raw.
    
    Descripción:
    "${description.substring(0, 10000)}"

    Formato JSON requerido:
    {
      "summary": "Resumen ejecutivo de 2 lineas destacando el rol y el objetivo principal.",
      "requirements": "Lista breve (max 5 items) con los requisitos técnicos y soft skills clave (Ej: React, Inglés C1, Liderazgo).",
      "benefits": "Lista breve (max 5 items) de beneficios destacados (Ej: Remoto, Salario en USD, Equity)."
    }
    
    Responde en Español. Sé conciso y directo.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpieza por si Gemini devuelve ```json ... ```
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error analizando con Gemini:", error);
    throw error;
  }
};