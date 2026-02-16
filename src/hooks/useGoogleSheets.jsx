import { useState, useEffect } from 'react';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAbjv_WQZI3rTdaBho5BI1yYYhRxnfXzX_NC-NRXDCEA1BLc7cB0FBdkhDEukJzuFMfA/exec"; 
// ⚠️ IMPORTANTE: Asegúrate de pegar aquí la URL de tu Web App de Google Scripts que generamos al principio.

export default function useGoogleSheets() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. LEER (GET)
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) throw new Error("Error conectando con Google Sheets");
      const data = await response.json();
      // Aseguramos que los datos tengan el formato correcto
      const formattedData = data.map(job => ({
        ...job,
        // Convertimos strings JSON a objetos reales si es necesario, o los dejamos para el componente
        id: job.id || Date.now() + Math.random() // Fallback ID
      }));
      setJobs(formattedData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar al inicio
  useEffect(() => {
    fetchJobs();
  }, []);

  // 2. AÑADIR (POST)
  const addJob = async (jobData) => {
    try {
      // Optimizamos la UI primero (Optimistic UI)
      const tempId = Date.now();
      const newJob = { ...jobData, id: tempId, status: 'Prospecto' };
      setJobs(prev => [...prev, newJob]);

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para Google Scripts
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...jobData })
      });
      
      // Recargamos para obtener el ID real y datos confirmados
      fetchJobs();
    } catch (err) {
      console.error("Error adding job:", err);
      // Si falla, podrías revertir el estado aquí
    }
  };

  // 3. ACTUALIZAR (POST - update)
  const updateJob = async (jobData) => {
    try {
      // Actualización optimista en local
      setJobs(prev => prev.map(j => j.id === jobData.id ? { ...j, ...jobData } : j));

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', ...jobData })
      });
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  // 4. BORRAR (POST - delete)
  const deleteJob = async (id) => {
    try {
      setJobs(prev => prev.filter(j => j.id !== id));

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  return { jobs, loading, error, addJob, updateJob, deleteJob };
}