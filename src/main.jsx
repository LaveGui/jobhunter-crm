import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"; 
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* MANTENEMOS EL BASENAME PARA GITHUB PAGES */}
    <BrowserRouter basename="/jobhunter-crm">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)