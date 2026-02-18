import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Clock, MessageSquare, Phone, Mail, StickyNote, Key } from 'lucide-react'; // <--- Icono Key
import { PLAYBOOK as DEFAULT_PLAYBOOK } from '../utils/playbook';

export default function StrategyModal({ isOpen, onClose, onSave }) {
  const [rules, setRules] = useState([]);
  const [apiKey, setApiKey] = useState(''); // <--- Estado para la API Key

  // Cargar datos al abrir
  useEffect(() => {
    if (isOpen) {
      // Cargar Estrategia
      const savedRules = localStorage.getItem('jobhunter_playbook');
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
        setRules(DEFAULT_PLAYBOOK);
      }

      // Cargar API Key
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) setApiKey(savedKey);
    }
  }, [isOpen]);

  const handleDayChange = (index, value) => {
    const newRules = [...rules];
    newRules[index].day = Number(value);
    setRules(newRules);
  };

  const toggleRule = (index) => {
    const newRules = [...rules];
    newRules[index].enabled = newRules[index].enabled === undefined ? false : !newRules[index].enabled;
    setRules(newRules);
  };

  const handleSave = () => {
    // Guardar Estrategia
    localStorage.setItem('jobhunter_playbook', JSON.stringify(rules));
    
    // Guardar API Key
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }

    onSave(rules);
    onClose();
    alert("✅ Configuración guardada correctamente.");
  };

  const handleReset = () => {
    if (window.confirm("¿Volver a la estrategia por defecto?")) {
      setRules(DEFAULT_PLAYBOOK);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'message': return <MessageSquare size={16} className="text-blue-500"/>;
      case 'email': return <Mail size={16} className="text-yellow-500"/>;
      case 'call': return <Phone size={16} className="text-green-500"/>;
      default: return <StickyNote size={16}/>;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-700">
        
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">⚙️ Configuración Global</h2>
            <p className="text-xs text-slate-400 mt-1">Estrategia de seguimiento & Integraciones.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* SECCIÓN 1: API KEY */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
             <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
               <Key size={16}/> Gemini API Key (IA)
             </h3>
             <div className="space-y-2">
               <input 
                 type="password" 
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 placeholder="Pega tu clave AIza..." 
                 className="w-full bg-slate-950 border border-slate-600 rounded p-2 text-sm text-white focus:border-yellow-400 outline-none"
               />
               <p className="text-[10px] text-slate-400">
                 Necesaria para analizar ofertas automáticamente. Consíguela en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google AI Studio</a>.
               </p>
             </div>
          </div>

          {/* SECCIÓN 2: ESTRATEGIA */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
               ⏱️ Cadencia de Seguimiento
            </h3>
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={idx} className={`p-3 rounded-lg border flex gap-3 items-center transition-all ${rule.enabled === false ? 'bg-slate-800/30 border-slate-800 opacity-50' : 'bg-slate-800 border-slate-600'}`}>
                  <input 
                    type="checkbox" 
                    checked={rule.enabled !== false} 
                    onChange={() => toggleRule(idx)}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {getIcon(rule.action)}
                      <span className="font-bold text-xs">{rule.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded border border-slate-700">
                    <Clock size={10} className="text-slate-500"/>
                    <input 
                      type="number" 
                      value={rule.day} 
                      onChange={(e) => handleDayChange(idx, e.target.value)}
                      className="w-8 bg-transparent text-center font-bold text-sm outline-none border-b border-slate-600 focus:border-blue-500"
                    />
                    <span className="text-[9px] text-slate-500">días</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-950 flex justify-between">
          <button onClick={handleReset} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-2">
            <RotateCcw size={14}/> Resetear
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-bold text-sm">Cancelar</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
              <Save size={16}/> Guardar Todo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}