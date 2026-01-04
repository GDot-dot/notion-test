
import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Task } from '../types.ts';
import { format } from 'date-fns';

interface ReminderPopupProps {
  tasks: Task[];
  onClose: () => void;
}

export const ReminderPopup: React.FC<ReminderPopupProps> = ({ tasks, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // 🍓 靜音提醒：已移除自動播放音效的程式碼
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (tasks.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0'}`}>
      <div className={`bg-white dark:bg-kuromi-card w-full max-w-md rounded-[40px] shadow-2xl border-4 border-pink-200 dark:border-gray-700 overflow-hidden transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
        
        {/* Header - Melody 風格 */}
        <div className="bg-[#ffdeeb] dark:bg-gray-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Sparkles className="absolute top-4 left-4 text-pink-400" size={24} />
            <Sparkles className="absolute bottom-4 right-8 text-pink-400" size={18} />
          </div>
          
          <div className="w-20 h-20 bg-white dark:bg-kuromi-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
            <Bell size={40} className="text-pink-500 fill-pink-100" />
          </div>
          
          <h3 className="text-2xl font-black text-[#5c4b51] dark:text-pink-300 relative z-10">時間到囉！🍓</h3>
          <p className="text-pink-500 dark:text-gray-400 font-bold text-sm mt-1 relative z-10">
            你有 {tasks.length} 個任務需要關注喔 🍰
          </p>
          
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-gray-700 hover:bg-white rounded-full text-pink-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Task List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar bg-white dark:bg-kuromi-card">
          {tasks.map(task => (
            <div key={task.id} className="group bg-pink-50/30 dark:bg-black/20 p-4 rounded-3xl border border-pink-100 dark:border-gray-800 flex gap-4 items-start transition-all hover:bg-white dark:hover:bg-white/5 hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm flex-shrink-0 text-2xl border border-pink-50 dark:border-gray-700">
                {task.status === '已完成' ? '✨' : '🍭'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#5c4b51] dark:text-gray-200 text-lg leading-tight mb-1 truncate">{task.title}</h4>
                <div className="flex items-center gap-2 text-[11px] font-black text-pink-400 dark:text-gray-500">
                  <Clock size={12} />
                  <span>到期日: {format(new Date(task.endDate), 'MM/dd HH:mm')}</span>
                </div>
                
                {/* 迷你進度條 */}
                <div className="mt-3 w-full bg-white dark:bg-gray-800 rounded-full h-1.5 overflow-hidden border border-pink-50 dark:border-gray-700">
                  <div 
                    className="bg-pink-400 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${task.progress}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="p-6 pt-2 bg-pink-50/20 dark:bg-gray-800/50">
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-pink-500 text-white rounded-[24px] font-black shadow-xl hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle2 size={22} /> 我知道了 🎀
          </button>
        </div>
      </div>
    </div>
  );
};
