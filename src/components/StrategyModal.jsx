import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Clock, MessageSquare, Phone, Mail, StickyNote } from 'lucide-react';
import { PLAYBOOK as DEFAULT_PLAYBOOK } from '../utils/playbook';

export default function StrategyModal({ isOpen, onClose, onSave }) {
  const [rules, setRules] = useState([]);

  // Cargar al abrir
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
    // Si no tiene propiedad enabled, asumimos true. Invertimos el valor.
    newRules[index].enabled = newRules[index].enabled === undefined ? false : !newRules[index].enabled;
    setRules(newRules);
  };

  const handleSave = () => {
    localStorage.setItem('jobhunter_playbook', JSON.stringify(rules));
    onSave(rules);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm("¿Volver a la estrategia original?")) {
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">⚙️ Estrategia de Seguimiento</h2>
            <p className="text-xs text-slate-500">Define tu cadencia de contacto post-aplicación.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
          {rules.map((rule, idx) => (
            <div key={idx} className={`p-4 rounded-lg border flex gap-4 items-center bg-white shadow-sm transition-all ${rule.enabled === false ? 'opacity-50 grayscale' : 'border-slate-200'}`}>
              
              {/* Checkbox */}
              <input 
                type="checkbox" 
                checked={rule.enabled !== false} 
                onChange={() => toggleRule(idx)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   {getIcon(rule.action)}
                   <span className="font-bold text-sm text-slate-700">{rule.label}</span>
                </div>
                <p className="text-xs text-slate-400">{rule.description}</p>
              </div>

              {/* Input Días */}
              <div className="flex flex-col items-center gap-1 bg-slate-100 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Día</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-400"/>
                  <input 
                    type="number" 
                    value={rule.day} 
                    onChange={(e) => handleDayChange(idx, e.target.value)}
                    className="w-12 bg-transparent text-center font-bold text-lg outline-none border-b border-slate-300 focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-white flex justify-between">
          <button onClick={handleReset} className="px-4 py-2 text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-2 transition-colors">
            <RotateCcw size={14}/> Resetear
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-sm">Cancelar</button>
            <button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg transform active:scale-95 transition-all">
              <Save size={16}/> Guardar Estrategia
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}