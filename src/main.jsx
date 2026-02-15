import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"; // IMPORTANTE
import App from './App.jsx'
import CVBuilder from './CVBuilder.jsx'; // Importamos tu nuevo componente
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AÑADE ESTA PARTE QUE DICE basename="/jobhunter-crm" */}
    <BrowserRouter basename="/jobhunter-crm">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cv" element={<CVBuilder />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)