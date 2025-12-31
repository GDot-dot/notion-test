
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Link as LinkIcon, ExternalLink, Trash2, Plus, Globe, ImageIcon, Save, Tag, Check, Palette, Bell, Clock, Activity } from 'lucide-react';
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
  // 🍓 內容描述的編輯狀態管理
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showPreviewDuringEdit, setShowPreviewDuringEdit] = useState(false);
  const [tempDesc, setTempDesc] = useState(task.description || '');
  
  // 標籤輸入狀態
  const [tagInput, setTagInput] = useState('');
  // 預設隨機選一個顏色
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_PALETTE[Math.floor(Math.random() * TAG_PALETTE.length)]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  // 通知權限狀態
  const [permissionState, setPermissionState] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );

  // 當外部 task 改變時（如切換任務），同步內容
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
    else if (url.includes('docs.google.com')) category = 'document';

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      category,
      createdAt: new Date().toISOString()
    };
    onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
  };

  const handleAddTag = () => {
    const tagName = tagInput.trim();
    if (!tagName) return;
    
    const currentTags = task.tags || [];
    // 檢查是否已存在同名標籤
    if (!currentTags.some(t => t.name === tagName)) {
      const newTag: TaskTag = {
        name: tagName,
        color: selectedTagColor
      };
      onUpdate({ tags: [...currentTags, newTag] });
    }
    setTagInput('');
    // 重新隨機一個顏色，方便下次新增
    setSelectedTagColor(TAG_PALETTE[Math.floor(Math.random() * TAG_PALETTE.length)]);
  };

  const handleRemoveTag = (tagNameToRemove: string) => {
    onUpdate({ tags: (task.tags || []).filter(t => t.name !== tagNameToRemove) });
  };

  // ⏰ 提醒設定處理
  const handleReminderChange = (type: ReminderType) => {
    if (type === 'none') {
      onUpdate({ reminder: undefined });
    } else if (type === 'custom') {
      // 預設為目前時間往後一小時
      const now = new Date();
      now.setHours(now.getHours() + 1);
      // 修正：產生符合 datetime-local 格式的時間字串 (yyyy-MM-ddThh:mm)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const defaultIso = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      onUpdate({ reminder: { type, date: defaultIso } });
    } else {
      onUpdate({ reminder: { type } });
    }
  };

  const handleCustomDateChange = (dateStr: string) => {
    if (task.reminder && task.reminder.type === 'custom') {
      onUpdate({ reminder: { ...task.reminder, date: dateStr } });
    }
  };

  // 🍓 手動請求權限按鈕
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("您的瀏覽器不支援通知功能 🥺");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("❌ 通知已被封鎖\n\n請點擊網址列左側的「鎖頭」圖示，手動將「通知」改為「允許」，然後重新整理網頁。");
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    
    if (permission === 'granted') {
      new Notification('🎉 設定成功！', {
        body: '您已成功開啟通知權限，美樂蒂會在時間到時提醒您喔！',
        icon: '/vite.svg'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className="flex items-center justify-between p-8 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50">🍭</div>
            <h2 className="text-xl font-bold text-pink-600">任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-300"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* 任務名稱 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input 
              value={task.title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
              className="text-2xl font-bold text-[#5c4b51] w-full bg-pink-50/20 border-2 border-transparent focus:border-pink-100 focus:bg-white focus:outline-none rounded-2xl px-3 py-2 transition-all" 
            />
          </div>

          {/* 狀態與優先度 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select 
                value={task.status} 
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
                style={{ backgroundColor: COLORS.status[task.status] + '66' }}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Flag size={12} /> 優先度</label>
              <select 
                value={task.priority} 
                onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
                style={{ backgroundColor: COLORS.priority[task.priority] }}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 🍓 任務進度 (新增修復) */}
          <div className="space-y-2 bg-white/50 p-4 rounded-2xl border border-pink-50 shadow-sm">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                   <Activity size={14} /> 任務進度
                </label>
                <span className="text-sm font-black text-pink-500 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-pink-100 min-w-[3rem] text-center">{task.progress}%</span>
            </div>
            <div className="relative pt-1">
              <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={task.progress} 
                  onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
                  style={{
                    background: `linear-gradient(to right, #ff85b2 ${task.progress}%, #ffdeeb ${task.progress}%)`
                  }}
              />
            </div>
          </div>
          
          {/* 日期設定 (與提醒連動顯示) */}
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 開始日期</label>
              <input 
                type="date"
                value={task.startDate.split('T')[0]}
                onChange={(e) => onUpdate({ startDate: new Date(e.target.value).toISOString() })}
                className="w-full p-3 rounded-2xl border border-pink-50 text-sm font-bold text-[#5c4b51] focus:outline-none focus:border-pink-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Calendar size={12} /> 結束日期</label>
              <input 
                type="date"
                value={task.endDate.split('T')[0]}
                onChange={(e) => onUpdate({ endDate: new Date(e.target.value).toISOString() })}
                className="w-full p-3 rounded-2xl border border-pink-50 text-sm font-bold text-[#5c4b51] focus:outline-none focus:border-pink-200"
              />
            </div>
          </div>

          {/* ⏰ 提醒設定 */}
          <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <label className="text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-wider">
              <Bell size={12} /> 任務提醒小幫手
              {!('Notification' in window) && <span className="text-[9px] text-red-400 ml-2">(此瀏覽器不支援通知)</span>}
              {permissionState !== 'granted' && (
                <button 
                  className="text-[10px] bg-blue-100 text-blue-500 px-2 py-0.5 rounded-md ml-2 font-bold hover:bg-blue-200 transition-colors animate-pulse" 
                  onClick={requestNotificationPermission}
                >
                  點此開啟權限
                </button>
              )}
            </label>
            <div className="flex flex-col gap-3">
              <select 
                value={task.reminder?.type || 'none'} 
                onChange={(e) => handleReminderChange(e.target.value as ReminderType)} 
                className="w-full p-3 rounded-xl border border-blue-100 text-sm font-bold text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
              >
                <option value="none">🔕 不用提醒我</option>
                <option value="1_day">🗓️ 到期前 1 天</option>
                <option value="3_days">🗓️ 到期前 3 天</option>
                <option value="custom">⏰ 自訂時間...</option>
              </select>
              
              {task.reminder?.type === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                  <Clock size={16} className="text-blue-300" />
                  <input 
                    type="datetime-local" 
                    value={task.reminder.date || ''}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-blue-100 text-sm text-[#5c4b51] font-bold bg-white focus:outline-none focus:border-blue-300"
                  />
                </div>
              )}
              {task.reminder?.type && task.reminder?.type !== 'none' && task.reminder?.type !== 'custom' && (
                <div className="text-[10px] text-blue-400 font-medium pl-1">
                  將在 <span className="font-bold">{format(new Date(task.endDate), 'MM/dd')}</span> 的前 {task.reminder.type === '1_day' ? '1' : '3'} 天發送通知
                </div>
              )}
            </div>
          </div>

          {/* 🍓 標籤管理區域 (更新版) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Tag size={12} /> 標籤 (Tags)</label>
            <div className="bg-pink-50/20 p-3 rounded-2xl border border-pink-50 space-y-3">
              {/* 現有標籤列表 */}
              <div className="flex flex-wrap gap-2">
                {task.tags && task.tags.map(tag => (
                  <span 
                    key={tag.name} 
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#5c4b51] shadow-sm transition-transform hover:scale-105"
                    style={{ backgroundColor: tag.color }}
                  >
                    #{tag.name}
                    <button onClick={() => handleRemoveTag(tag.name)} className="hover:text-red-500 rounded-full p-0.5"><X size={10} /></button>
                  </span>
                ))}
                {(!task.tags || task.tags.length === 0) && <span className="text-xs text-pink-200 italic p-1">尚無標籤...</span>}
              </div>

              {/* 新增標籤介面 */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="輸入標籤..."
                      className="w-full bg-white border border-pink-100 rounded-xl pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-100"
                    />
                    <div 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-pink-100 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: selectedTagColor }}
                      onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                      title="點擊選擇顏色"
                    />
                  </div>
                  <button onClick={handleAddTag} className="bg-pink-100 text-pink-500 px-3 rounded-xl hover:bg-pink-200 transition-colors"><Plus size={16} /></button>
                </div>

                {/* 顏色選擇器 (可展開) */}
                {isPaletteOpen && (
                  <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-xl border border-pink-100 shadow-sm animate-in zoom-in-95 duration-200">
                    {TAG_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => { setSelectedTagColor(color); setIsPaletteOpen(false); }}
                        className="w-6 h-6 rounded-full border border-pink-50 hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {selectedTagColor === color && <Check size={12} className="text-[#5c4b51]/60" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 任務資源區域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><LinkIcon size={12} /> 任務資源連結</label>
              <button onClick={handleAddLink} className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 shadow-sm flex items-center gap-1"><Plus size={10} /> 新增連結</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {task.attachments?.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-pink-50/20 border border-pink-50 rounded-2xl group">
                  {link.category === 'image' ? <ImageIcon size={16} className="text-pink-300" /> : <Globe size={16} className="text-blue-300" />}
                  <span className="flex-1 text-xs font-bold text-[#5c4b51] truncate">{link.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><ExternalLink size={14} /></a>
                    <button onClick={() => onUpdate({ attachments: task.attachments?.filter(a => a.id !== link.id) })} className="p-1.5 text-pink-300 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {(!task.attachments || task.attachments.length === 0) && (
                <p className="text-center py-4 text-[10px] text-pink-200 font-bold italic">尚無相關資源 🍰</p>
              )}
            </div>
          </div>

          {/* 🍓 內容描述區域 (更新為 Markdown 豐富功能) */}
          <div className="space-y-4 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><AlignLeft size={14} /> 任務內容描述</label>
              
              <div className="flex items-center gap-2">
                {!isEditingDesc ? (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 text-pink-500 text-[10px] font-bold hover:bg-pink-100 shadow-sm transition-all"
                  >
                    <Edit3 size={12} /> 編輯描述
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-pink-50 p-1 rounded-xl border border-pink-100">
                    <button 
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-pink-300 hover:text-red-400 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => setShowPreviewDuringEdit(!showPreviewDuringEdit)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showPreviewDuringEdit ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300 hover:text-pink-500'}`}
                    >
                      {showPreviewDuringEdit ? <Edit3 size={12} /> : <Eye size={12} />}
                      {showPreviewDuringEdit ? '繼續編輯' : '預覽'}
                    </button>
                    <button 
                      onClick={handleSaveDesc}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500 text-white text-[10px] font-bold hover:bg-pink-600 shadow-sm transition-all"
                    >
                      <Save size={12} /> 完成
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {isEditingDesc && !showPreviewDuringEdit ? (
                <textarea 
                  value={tempDesc} 
                  onChange={(e) => setTempDesc(e.target.value)} 
                  placeholder="輸入任務詳細內容，支援 Markdown 語法... 🍓"
                  className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/30 border-2 border-pink-50 text-[#5c4b51] text-sm focus:outline-none focus:border-pink-200 min-h-[250px] resize-none font-mono leading-relaxed"
                  autoFocus
                />
              ) : (
                <div className="w-full flex-1 p-6 rounded-[30px] bg-white border border-pink-50 overflow-y-auto min-h-[250px] shadow-inner animate-in fade-in duration-300">
                  <div className="prose prose-pink prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(isEditingDesc ? tempDesc : task.description) || "*點擊編輯按鈕來新增內容吧！🍰*"}
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
