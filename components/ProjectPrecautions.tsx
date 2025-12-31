
import React, { useState } from 'react';
import { Trash2, Plus, Edit3, Palette, Check } from 'lucide-react';
import { COLORS } from '../constants.tsx';

interface ProjectPrecautionsProps {
  precautions: string[];
  backgroundColor?: string;
  onUpdate: (items: string[]) => void;
  onColorChange: (color: string) => void;
}

export const ProjectPrecautions: React.FC<ProjectPrecautionsProps> = ({ 
  precautions, 
  backgroundColor = '#fff9c4', 
  onUpdate, 
  onColorChange 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const addItem = () => {
    if (inputValue.trim()) {
      onUpdate([...precautions, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    const newList = [...precautions];
    newList.splice(index, 1);
    onUpdate(newList);
  };

  const handleCustomColor = () => {
    const color = prompt('請輸入 Hex 色號 (例如 #ffdeeb) 🎨', backgroundColor);
    if (color && /^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      onColorChange(color);
    } else if (color) {
      alert('色號格式不正確喔！請使用 # 開頭的格式。');
    }
  };

  return (
    <div 
      className="rounded-[40px] p-8 cute-shadow border transition-colors duration-500 h-full flex flex-col relative"
      style={{ 
        backgroundColor: backgroundColor,
        borderColor: `${backgroundColor}dd` 
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'rgba(0,0,0,0.6)' }}>
          <Edit3 size={24} className="opacity-70" /> 專案注意事項
        </h3>
        
        {/* 調色盤區域 */}
        <div className="flex items-center gap-2 relative">
          {isPaletteOpen && (
            <div className="absolute right-full mr-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white animate-in slide-in-from-right-2 duration-300">
              {COLORS.stickyNotes.map(c => (
                <button 
                  key={c}
                  onClick={() => onColorChange(c)}
                  className="w-6 h-6 rounded-full border border-black/5 hover:scale-110 transition-transform flex items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {backgroundColor === c && <Check size={12} className="text-black/40" />}
                </button>
              ))}
              <button 
                onClick={handleCustomColor}
                className="w-6 h-6 rounded-full border-2 border-dashed border-pink-300 flex items-center justify-center bg-white hover:bg-pink-50 transition-colors"
                title="輸入色號"
              >
                <Plus size={12} className="text-pink-400" />
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className={`p-2 rounded-xl transition-all ${isPaletteOpen ? 'bg-white shadow-inner scale-90' : 'bg-white/40 hover:bg-white/60'}`}
          >
            <Palette size={20} className="text-black/40" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {precautions.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 group bg-white/40 p-3 rounded-2xl border border-white/20 hover:bg-white/60 transition-all">
            <span className="text-xl">💡</span>
            <p className="flex-1 text-sm font-medium" style={{ color: 'rgba(0,0,0,0.7)' }}>{item}</p>
            <button 
              onClick={() => removeItem(idx)}
              className="p-1 opacity-0 group-hover:opacity-100 text-black/20 hover:text-red-400 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {precautions.length === 0 && (
          <p className="text-center py-8 opacity-40 italic text-sm">還沒有小叮嚀喔 📝</p>
        )}
      </div>

      <div className="mt-6 relative">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          placeholder="新增小叮嚀..."
          className="w-full bg-white/60 border-2 border-transparent focus:border-white/80 rounded-full px-6 py-3 text-sm focus:outline-none transition-all pr-12 font-medium placeholder-black/20"
          style={{ color: 'rgba(0,0,0,0.8)' }}
        />
        <button 
          onClick={addItem}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-black/40 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
