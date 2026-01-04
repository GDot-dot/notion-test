
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Link as LinkIcon, ExternalLink, Trash2, Plus, Globe, ImageIcon, Save, Tag, Check, Palette, Bell, Clock, Activity, Send } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Attachment, ResourceCategory, TaskTag, ReminderType } from '../types.ts';
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
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_PALETTE[Math.floor(Math.random() * TAG_PALETTE.length)]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [permissionState, setPermissionState] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
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

  const handleAddLink = () => {
    const name = prompt("🍓 連結標題");
    if (!name) return;
    const url = prompt("🌐 請貼上網址");
    if (!url) return;
    let category: ResourceCategory = 'link';
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) category = 'image';
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name, url, category, createdAt: new Date().toISOString()
    };
    onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
  };

  const handleAddTag = () => {
    const tagName = tagInput.trim();
    if (!tagName) return;
    const currentTags = task.tags || [];
    if (!currentTags.some(t => t.name === tagName)) {
      onUpdate({ tags: [...currentTags, { name: tagName, color: selectedTagColor }] });
    }
    setTagInput('');
    setSelectedTagColor(TAG_PALETTE[Math.floor(Math.random() * TAG_PALETTE.length)]);
  };

  const handleRemoveTag = (tagNameToRemove: string) => {
    onUpdate({ tags: (task.tags || []).filter(t => t.name !== tagNameToRemove) });
  };

  const handleReminderChange = (type: ReminderType) => {
    if (type === 'none') onUpdate({ reminder: undefined });
    else if (type === 'custom') {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      onUpdate({ reminder: { type, date: iso } });
    } else onUpdate({ reminder: { type } });
  };

  const sendTestNotification = () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification('🔔 測試成功！', {
            body: `這是來自任務「${task.title}」的測試通知。`,
            icon: '/vite.svg'
        });
    } else Notification.requestPermission().then(setPermissionState);
  };

  const isDark = document.documentElement.classList.contains('dark');

  // 🍓 計算狀態顯示色
  const getStatusColor = (status: string) => {
    const base = COLORS.status[status as TaskStatus] || '#eee';
    if (isDark) return base + '44'; // 深色模式加透明度
    return base; // 明亮模式使用實色，避免瀏覽器誤判為深色主題
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-kuromi-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100 dark:border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
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
            <input 
              value={task.title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
              className="text-2xl font-bold text-[#5c4b51] dark:text-kuromi-text w-full bg-pink-50/20 dark:bg-white/5 border-2 border-transparent focus:border-pink-100 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-800 focus:outline-none rounded-2xl px-3 py-2 transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select 
                value={task.status} 
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-200 dark:focus:ring-gray-600 transition-colors"
                style={{ 
                  backgroundColor: getStatusColor(task.status),
                  color: isDark ? '#f3e6ed' : '#5c4b51',
                  appearance: 'auto' // 確保原生的選擇箭頭在各瀏覽器正常顯示
                }}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s} className="bg-white dark:bg-gray-800 text-[#5c4b51] dark:text-gray-100">{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Flag size={12} /> 優先度</label>
              <select 
                value={task.priority} 
                onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] dark:text-gray-100 shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-200 dark:focus:ring-gray-600 transition-colors"
                style={{ backgroundColor: COLORS.priority[task.priority], color: '#5c4b51' }}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p} className="bg-white text-[#5c4b51]">{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-pink-50 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Activity size={14} /> 任務進度</label>
                <span className="text-sm font-black text-pink-500 bg-white dark:bg-gray-800 dark:text-pink-300 px-2 py-0.5 rounded-lg shadow-sm border border-pink-100 dark:border-gray-600 min-w-[3rem] text-center">{task.progress}%</span>
            </div>
            <div className="relative pt-1">
              <input 
                  type="range" min="0" max="100" step="5" value={task.progress} 
                  onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-pink-100 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                  style={{ background: `linear-gradient(to right, #ff85b2 ${task.progress}%, ${isDark ? '#4b5563' : '#ffdeeb'} ${task.progress}%)` }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 開始日期</label>
              <input 
                type="date" value={task.startDate.split('T')[0]}
                onChange={(e) => onUpdate({ startDate: new Date(e.target.value).toISOString() })}
                className="w-full p-4 rounded-[20px] border border-pink-100/50 dark:border-gray-700 text-sm font-bold text-[#5c4b51] dark:text-white bg-white dark:bg-[#1a1618] focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 結束日期</label>
              <input 
                type="date" value={task.endDate.split('T')[0]}
                onChange={(e) => onUpdate({ endDate: new Date(e.target.value).toISOString() })}
                className="w-full p-4 rounded-[20px] border border-pink-100/50 dark:border-gray-700 text-sm font-bold text-[#5c4b51] dark:text-white bg-white dark:bg-[#1a1618] focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider"><Bell size={12} /> 任務提醒小幫手</label>
                <button onClick={sendTestNotification} className="text-[10px] bg-blue-400 text-white px-2 py-1 rounded-lg font-bold hover:bg-blue-500 transition-all shadow-sm flex items-center gap-1"><Send size={10} /> 測試通知</button>
            </div>
            <select 
              value={task.reminder?.type || 'none'} 
              onChange={(e) => handleReminderChange(e.target.value as ReminderType)} 
              className="w-full p-3 rounded-xl border border-blue-100 dark:border-blue-700 text-sm font-bold text-[#5c4b51] dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none"
            >
              <option value="none">🔕 不用提醒</option>
              <option value="1_day">🗓️ 到期前 1 天</option>
              <option value="3_days">🗓️ 到期前 3 天</option>
              <option value="custom">⏰ 自訂時間...</option>
            </select>
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 dark:text-gray-500 flex items-center gap-1 uppercase tracking-wider"><AlignLeft size={14} /> 任務描述</label>
              {!isEditingDesc ? (
                <button onClick={handleStartEdit} className="px-4 py-2 rounded-xl bg-pink-50 dark:bg-gray-700 text-pink-500 text-[10px] font-bold shadow-sm"><Edit3 size={12} /> 編輯</button>
              ) : (
                <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-gray-700 p-1 rounded-xl">
                  <button onClick={handleCancelEdit} className="px-3 py-1.5 text-[10px] text-pink-300">取消</button>
                  <button onClick={handleSaveDesc} className="px-3 py-1.5 bg-pink-500 text-white text-[10px] rounded-lg">完成</button>
                </div>
              )}
            </div>
            <div className="flex-1 p-6 rounded-[30px] bg-white dark:bg-white/5 border border-pink-50 dark:border-gray-700 shadow-inner overflow-y-auto">
              {isEditingDesc && !showPreviewDuringEdit ? (
                <textarea value={tempDesc} onChange={e => setTempDesc(e.target.value)} className="w-full h-full bg-transparent border-none text-sm dark:text-gray-200 outline-none resize-none font-mono" />
              ) : (
                <div className="prose prose-pink prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description || "*尚無內容描述 🍰*"}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
