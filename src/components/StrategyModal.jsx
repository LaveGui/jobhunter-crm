import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Clock, MessageSquare, Phone, Mail, StickyNote } from 'lucide-react';
import { PLAYBOOK as DEFAULT_PLAYBOOK } from '../utils/playbook';

export default function StrategyModal({ isOpen, onClose, onSave }) {
  const [rules, setRules] = useState([]);

  // Cargar reglas guardadas o default al abrir
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('jobhunter_playbook');
      if (saved) {
        setRules(JSON.parse(saved));
      } else {
        setRules(DEFAULT_PLAYBOOK);
      }
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
    localStorage.setItem('jobhunter_playbook', JSON.stringify(rules));
    onSave(rules); // Pasamos las nuevas reglas hacia arriba para actualizar al instante
    onClose();
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
            <h2 className="text-xl font-bold flex items-center gap-2">⚙️ Estrategia de Seguimiento</h2>
            <p className="text-xs text-slate-400 mt-1">Define cuándo y cómo contactar tras aplicar.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {rules.map((rule, idx) => (
            <div key={idx} className={`p-4 rounded-lg border flex gap-4 items-center transition-all ${rule.enabled === false ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-800 border-slate-600'}`}>
              
              {/* Checkbox Activo */}
              <input 
                type="checkbox" 
                checked={rule.enabled !== false} 
                onChange={() => toggleRule(idx)}
                className="w-5 h-5 rounded border-slate-500 bg-slate-700 text-blue-600 focus:ring-blue-500"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   {getIcon(rule.action)}
                   <span className="font-bold text-sm">{rule.label}</span>
                </div>
                <p className="text-xs text-slate-400">{rule.description}</p>
              </div>

              {/* Input Días */}
              <div className="flex flex-col items-center gap-1 bg-slate-900 p-2 rounded border border-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Día</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400"/>
                  <input 
                    type="number" 
                    value={rule.day} 
                    onChange={(e) => handleDayChange(idx, e.target.value)}
                    className="w-12 bg-transparent text-center font-bold text-lg outline-none border-b border-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-950 flex justify-between">
          <button onClick={handleReset} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-2">
            <RotateCcw size={14}/> Resetear Defaults
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white font-bold text-sm">Cancelar</button>
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20">
              <Save size={16}/> Guardar Estrategia
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}