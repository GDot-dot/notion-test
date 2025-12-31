
import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCircle2, Clock } from 'lucide-react';
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
    // 播放提示音效 (選擇性)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (tasks.length === 0) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      
      <div className={`bg-white w-full max-w-md rounded-[32px] shadow-2xl border-4 border-pink-100 overflow-hidden transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
        {/* Header */}
        <div className="bg-[#ffdeeb] p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md animate-bounce">
            <Bell size={32} className="text-pink-500 fill-pink-200" />
          </div>
          <h3 className="text-2xl font-black text-[#5c4b51] relative z-10">時間到囉！</h3>
          <p className="text-pink-500 font-bold text-sm relative z-10">您有 {tasks.length} 個任務需要關注</p>
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-pink-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Task List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {tasks.map(task => (
            <div key={task.id} className="bg-pink-50/30 p-4 rounded-2xl border border-pink-100 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 text-xl">
                {task.status === '已完成' ? '✅' : '📝'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#5c4b51] text-lg leading-tight mb-1">{task.title}</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-pink-400 mb-2">
                  <Clock size={12} />
                  <span>到期日: {format(new Date(task.endDate), 'MM/dd HH:mm')}</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 mb-1">
                  <div className="bg-pink-400 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                </div>
                <div className="text-right text-[10px] font-bold text-pink-300">{task.progress}% 完成</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2">
          <button 
            onClick={handleClose}
            className="w-full py-3 bg-pink-500 text-white rounded-2xl font-bold shadow-md hover:bg-pink-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} /> 我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
