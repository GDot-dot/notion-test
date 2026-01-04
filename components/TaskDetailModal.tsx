
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Link as LinkIcon, ExternalLink, Trash2, Plus, Globe, ImageIcon, Save, Tag, Check, Palette, Bell, Clock, Activity, Send, CheckSquare } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Attachment, ResourceCategory, TaskTag, ReminderType, TaskReminder } from '../types.ts';
import { COLORS, TAG_PALETTE } from '../constants.tsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showPreviewDuringEdit, setShowPreviewDuringEdit] = useState(false);
  const [tempDesc, setTempDesc] = useState(task.description || '');
  
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_PALETTE[0]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  // 🍓 提醒狀態暫存
  const [tempReminder, setTempReminder] = useState<TaskReminder>(task.reminder || { type: 'none' });

  const [permissionState, setPermissionState] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
    setTempReminder(task.reminder || { type: 'none' });
  }, [task.id]);

  const handleStartEdit = () => {
    setTempDesc(task.description || '');
    setIsEditingDesc(true);
    setShowPreviewDuringEdit(false);
  };

  const handleSaveDesc = () => {
    onUpdate({ description: tempDesc });
    setIsEditingDesc(false);
  };

  const handleCancelEdit = () => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
  };

  const handleAddTag = () => {
    const tagName = tagInput.trim();
    if (!tagName) return;
    const currentTags = task.tags || [];
    if (!currentTags.some(t => t.name === tagName)) {
      onUpdate({ tags: [...currentTags, { name: tagName, color: selectedTagColor }] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagNameToRemove: string) => {
    onUpdate({ tags: (task.tags || []).filter(t => t.name !== tagNameToRemove) });
  };

  const handleReminderTypeChange = (type: ReminderType) => {
    if (type === 'custom') {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const isoStr = format(now, "yyyy-MM-dd'T'HH:mm");
      setTempReminder({ type, date: isoStr });
    } else {
      setTempReminder({ type });
    }
  };

  const saveReminderToSchedule = () => {
    if (tempReminder.type === 'none') {
      onUpdate({ reminder: { type: 'none' }, remindedHistory: [] });
      alert('已取消該任務的所有提醒排程 🔕');
    } else {
      onUpdate({ reminder: tempReminder, remindedHistory: [] });
      alert(`已將「${task.title}」成功加入提醒排程！🍰`);
    }
  };

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
        new Notification('🔔 測試成功！', {
            body: `這是來自任務「${task.title}」的測試通知！`,
            icon: '/vite.svg'
        });
    } else {
        if ('Notification' in window) Notification.requestPermission();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-kuromi-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100 dark:border-gray-600" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-8 border-b border-pink-50 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50 dark:bg-gray-700">🍭</div>
            <h2 className="text-xl font-bold text-pink-600 dark:text-kuromi-accent">任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 dark:hover:bg-white/10 rounded-full transition-colors text-pink-300 dark:text-gray-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 dark:text-gray-500 uppercase tracking-wider">任務名稱</label>
            <input value={task.title} onChange={(e) => onUpdate({ title: e.target.value })} className="text-2xl font-bold text-[#5c4b51] dark:text-kuromi-text w-full bg-pink-50/20 dark:bg-white/5 border-2 border-transparent focus:border-pink-100 dark:focus:border-gray-600 rounded-2xl px-3 py-2 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select value={task.status} onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })} className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer" style={{ backgroundColor: COLORS.status[task.status] + '66' }}>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Flag size={12} /> 優先度</label>
              <select value={task.priority} onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })} className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer" style={{ backgroundColor: COLORS.priority[task.priority] }}>
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-pink-50 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Activity size={14} /> 任務進度</label>
                <span className="text-sm font-black text-pink-500 bg-white dark:bg-gray-800 dark:text-pink-300 px-2 py-0.5 rounded-lg shadow-sm">{task.progress}%</span>
            </div>
            <input type="range" min="0" max="100" step="5" value={task.progress} onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })} className="w-full h-2 bg-pink-100 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-pink-500" style={{ background: `linear-gradient(to right, #ff85b2 ${task.progress}%, transparent ${task.progress}%)` }} />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 開始日期</label>
              <input type="date" value={task.startDate.split('T')[0]} onChange={(e) => onUpdate({ startDate: new Date(e.target.value).toISOString() })} className="w-full p-4 rounded-[20px] border border-pink-100/50 dark:border-gray-700 text-sm font-bold text-[#5c4b51] dark:text-white bg-white dark:bg-[#1a1618] [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 結束日期</label>
              <input type="date" value={task.endDate.split('T')[0]} onChange={(e) => onUpdate({ endDate: new Date(e.target.value).toISOString() })} className="w-full p-4 rounded-[20px] border border-pink-100/50 dark:border-gray-700 text-sm font-bold text-[#5c4b51] dark:text-white bg-white dark:bg-[#1a1618] [color-scheme:dark]" />
            </div>
          </div>

          <div className="space-y-3 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider">
                  <Bell size={12} /> 任務提醒輔助
                </label>
                <button onClick={sendTestNotification} className="flex items-center gap-1 text-[10px] bg-blue-400 text-white px-2 py-1 rounded-lg font-bold hover:bg-blue-500 transition-all shadow-sm">
                  <Send size={10} /> 測試
                </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <select 
                  value={tempReminder.type} 
                  onChange={(e) => handleReminderTypeChange(e.target.value as ReminderType)} 
                  className="flex-1 p-3 rounded-xl border border-blue-100 dark:border-blue-700 text-sm font-bold text-[#5c4b51] dark:text-gray-200 bg-white dark:bg-gray-800"
                >
                  <option value="none">🔕 不紀錄排程</option>
                  <option value="1_day">🗓️ 到期前 1 天</option>
                  <option value="3_days">🗓️ 到期前 3 天</option>
                  <option value="custom">⏰ 自訂精確時間</option>
                </select>
                <button onClick={saveReminderToSchedule} className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 hover:bg-blue-600">
                  <CheckSquare size={14} /> 記錄提醒
                </button>
              </div>
              {tempReminder.type === 'custom' && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-300" />
                  <input type="datetime-local" value={tempReminder.date || ''} onChange={(e) => setTempReminder({ ...tempReminder, date: e.target.value })} className="flex-1 p-2 rounded-xl border border-blue-100 dark:border-blue-700 text-sm text-[#5c4b51] dark:text-gray-200 font-bold bg-white dark:bg-gray-800 [color-scheme:dark]" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Tag size={12} /> 標籤 (Tags)</label>
            <div className="bg-pink-50/20 dark:bg-white/5 p-4 rounded-2xl border border-pink-50 dark:border-gray-700 space-y-4">
              <div className="flex flex-wrap gap-2">
                {task.tags?.map(tag => (
                  <span key={tag.name} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#5c4b51] shadow-sm" style={{ backgroundColor: tag.color }}>
                    #{tag.name}
                    <button onClick={() => handleRemoveTag(tag.name)} className="ml-1 hover:text-red-500 p-0.5"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 items-center relative">
                <div className="flex-1 relative flex items-center">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="輸入標籤..." className="w-full bg-white dark:bg-gray-800 border border-pink-100 dark:border-gray-600 rounded-full px-4 py-2 pr-10 text-sm dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200" />
                  <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="absolute right-3 w-5 h-5 rounded-full border border-black/10 shadow-inner transition-transform hover:scale-110 active:scale-90" style={{ backgroundColor: selectedTagColor }} />
                </div>
                <button onClick={handleAddTag} className="bg-pink-100 dark:bg-pink-900/30 text-pink-500 dark:text-pink-300 p-2 rounded-xl font-bold shadow-sm hover:bg-pink-200 transition-all active:scale-95">
                  <Plus size={20} />
                </button>
                {isPaletteOpen && (
                  <div className="absolute bottom-full right-12 mb-3 p-3 bg-white dark:bg-kuromi-card shadow-2xl rounded-2xl border border-pink-100 dark:border-gray-700 z-[70] grid grid-cols-4 gap-2 animate-in zoom-in-95 origin-bottom">
                    {TAG_PALETTE.map(c => <button key={c} onClick={() => { setSelectedTagColor(c); setIsPaletteOpen(false); }} className={`w-7 h-7 rounded-full border border-black/5 hover:scale-110 transition-transform ${selectedTagColor === c ? 'ring-2 ring-pink-400 ring-offset-2' : ''}`} style={{ backgroundColor: c }} />)}
                    <button onClick={() => colorInputRef.current?.click()} className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100">
                      <Plus size={12} className="text-gray-400" />
                    </button>
                    <input ref={colorInputRef} type="color" className="hidden" onChange={(e) => { setSelectedTagColor(e.target.value); setIsPaletteOpen(false); }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider">
                <AlignLeft size={16} className="text-pink-300 dark:text-pink-400" /> 任務內容描述
              </label>
              
              <div className="flex items-center gap-2">
                {!isEditingDesc ? (
                  <button 
                    onClick={handleStartEdit} 
                    className="flex items-center gap-2 px-6 py-2 rounded-[20px] bg-pink-500 text-white text-xs font-black shadow-md hover:bg-pink-600 transition-all active:scale-95"
                  >
                    <Edit3 size={14} /> 編輯
                  </button>
                ) : (
                  // 🍓 如圖 1 的編輯按鈕群組
                  <div className="flex items-center gap-1 bg-pink-50/80 dark:bg-gray-800 p-1 rounded-full border border-pink-100 dark:border-gray-700 shadow-sm transition-all duration-300">
                    <button 
                      onClick={handleCancelEdit} 
                      className="px-4 py-2 rounded-full text-xs font-bold text-pink-300 dark:text-gray-500 hover:text-pink-500 dark:hover:text-pink-300 transition-colors"
                    >
                      取消
                    </button>
                    <div className="w-[1px] h-4 bg-pink-100 dark:bg-gray-700 mx-1" />
                    <button 
                      onClick={() => setShowPreviewDuringEdit(!showPreviewDuringEdit)} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${showPreviewDuringEdit ? 'bg-white dark:bg-gray-700 text-pink-500 shadow-sm' : 'text-pink-300 hover:text-pink-500'}`}
                    >
                      <Eye size={14} /> 預覽
                    </button>
                    <button 
                      onClick={handleSaveDesc} 
                      className="flex items-center gap-2 px-5 py-2 rounded-full bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 shadow-md transition-all active:scale-95"
                    >
                      <Save size={14} /> 完成
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col mt-2">
              {isEditingDesc && !showPreviewDuringEdit ? (
                <textarea 
                  value={tempDesc} 
                  onChange={(e) => setTempDesc(e.target.value)} 
                  placeholder="支援 Markdown 語法... 🍓" 
                  className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/20 dark:bg-white/5 border-2 border-pink-50 dark:border-gray-700 text-[#5c4b51] dark:text-gray-200 text-sm resize-none focus:outline-none focus:ring-4 focus:ring-pink-50/30" 
                  autoFocus 
                />
              ) : (
                <div className="w-full flex-1 p-8 rounded-[40px] bg-white dark:bg-white/5 border border-pink-50 dark:border-gray-700 overflow-y-auto min-h-[300px] shadow-inner animate-in fade-in">
                  <div className="prose prose-pink prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      { (isEditingDesc ? tempDesc : task.description) || "*目前內容為空，點擊按鈕新增內容吧！🍰*" }
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
