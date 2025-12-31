import React, { useState, useEffect } from 'react';
import { Edit3, Eye, Trash2, FileText, ExternalLink, Plus, Image as ImageIcon, FileCode, Video, Globe, X, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Attachment, ResourceCategory } from '../types.ts';

interface NotesAreaProps {
  notes: string;
  logoUrl?: string;
  attachments?: Attachment[];
  onUpdateNotes: (notes: string) => void;
  onUpdateLogo: (url: string) => void;
  onUpdateAttachments: (attachments: Attachment[]) => void;
}

export const NotesArea: React.FC<NotesAreaProps> = ({ 
  notes, 
  logoUrl, 
  attachments = [], 
  onUpdateNotes, 
  onUpdateLogo,
  onUpdateAttachments
}) => {
  // 🍓 預設為預覽模式 (isEditing = false)
  const [isEditing, setIsEditing] = useState(false);
  const [showPreviewDuringEdit, setShowPreviewDuringEdit] = useState(false);
  const [tempNotes, setTempNotes] = useState(notes);

  // 當切換專案時，同步內部的暫存筆記
  useEffect(() => {
    setTempNotes(notes);
    setIsEditing(false); // 切換專案時回到預覽模式
  }, [notes]);

  const handleStartEdit = () => {
    setTempNotes(notes);
    setIsEditing(true);
    setShowPreviewDuringEdit(false);
  };

  const handleSave = () => {
    onUpdateNotes(tempNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempNotes(notes);
    setIsEditing(false);
  };

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'image': return <ImageIcon size={14} className="text-pink-400 dark:text-pink-300" />;
      case 'design': return <FileCode size={14} className="text-purple-400 dark:text-purple-300" />;
      case 'document': return <FileText size={14} className="text-blue-400 dark:text-blue-300" />;
      case 'video': return <Video size={14} className="text-red-400 dark:text-red-300" />;
      default: return <Globe size={14} className="text-green-400 dark:text-green-300" />;
    }
  };

  const handleAddResource = () => {
    const name = prompt("🍓 資源名稱 (例如: 設計參考圖、需求文件)");
    if (!name) return;
    const url = prompt("🌐 貼上網址 (例如: Google Drive 或圖片連結)");
    if (!url) return;

    let category: ResourceCategory = 'link';
    const lowUrl = url.toLowerCase();
    if (lowUrl.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) category = 'image';
    else if (lowUrl.includes('figma.com')) category = 'design';
    else if (lowUrl.includes('docs.google.com') || lowUrl.includes('.pdf') || lowUrl.includes('.docx')) category = 'document';
    else if (lowUrl.includes('youtube.com') || lowUrl.includes('vimeo.com') || lowUrl.includes('bilibili.com')) category = 'video';

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      category,
      createdAt: new Date().toISOString()
    };
    onUpdateAttachments([...attachments, newAttachment]);
  };

  return (
    <div className="bg-white dark:bg-kuromi-card rounded-[40px] p-8 cute-shadow border border-pink-100 dark:border-gray-700 min-h-[600px] flex flex-col space-y-8 animate-in fade-in duration-500 transition-colors">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 flex-shrink-0 space-y-8">
          {/* Logo 區域 */}
          <div>
            <label className="block text-sm font-bold text-pink-400 dark:text-gray-400 mb-4 uppercase tracking-wider">專案標誌 🎀</label>
            <div 
              className="w-full aspect-square max-w-[200px] bg-pink-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-pink-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner mx-auto lg:mx-0 transition-colors"
              onClick={() => {
                const res = prompt('輸入 Emoji (如 🍓) 或圖片網址', logoUrl || '📁');
                if (res !== null) onUpdateLogo(res);
              }}
            >
              {logoUrl?.startsWith('http') ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">{logoUrl || '📁'}</span>
              )}
              <div className="absolute inset-0 bg-pink-500/10 dark:bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[10px] font-bold bg-white/90 dark:bg-gray-800 text-pink-500 dark:text-pink-300 px-3 py-1 rounded-full shadow-sm">更換圖標</span>
              </div>
            </div>
          </div>

          {/* 資源庫區域 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-pink-400 dark:text-gray-400 uppercase tracking-wider">資源連結庫 🍭</label>
              <button 
                onClick={handleAddResource}
                className="p-2 bg-pink-50 dark:bg-gray-700 text-pink-500 dark:text-gray-300 rounded-xl hover:bg-pink-100 dark:hover:bg-gray-600 transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {attachments.map(item => (
                <div key={item.id} className="group flex flex-col p-3 bg-pink-50/20 dark:bg-black/20 border border-pink-50 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(item.category)}
                    <span className="flex-1 text-[11px] font-bold text-[#5c4b51] dark:text-gray-300 truncate" title={item.name}>{item.name}</span>
                    <button onClick={() => onUpdateAttachments(attachments.filter(a => a.id !== item.id))} className="opacity-0 group-hover:opacity-100 p-1 text-pink-200 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {item.category === 'image' && (
                    <div className="w-full h-24 rounded-lg bg-pink-100/30 dark:bg-gray-800 overflow-hidden mb-2 border border-pink-50 dark:border-gray-600 relative group/img">
                      <img src={item.url} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')} />
                    </div>
                  )}

                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-white dark:bg-gray-600 border border-pink-100 dark:border-gray-500 rounded-xl text-[10px] font-black text-pink-400 dark:text-pink-200 hover:bg-pink-500 dark:hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink size={10} /> 打開資源
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-6">
            <label className="text-sm font-bold text-pink-400 dark:text-kuromi-accent flex items-center gap-2 uppercase tracking-wider">
              <FileText size={18} /> 專案內容筆記 🍓
            </label>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                // 🍓 預設模式：僅顯示編輯按鈕
                <button 
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 shadow-md transition-all active:scale-95"
                >
                  <Edit3 size={14} /> 編輯筆記
                </button>
              ) : (
                // 🍓 編輯模式：顯示 取消、預覽/編輯、完成
                <div className="flex items-center gap-2 bg-pink-50 dark:bg-gray-700 p-1.5 rounded-[20px] border border-pink-100 dark:border-gray-600">
                  <button 
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-pink-400 dark:text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-600 transition-all"
                  >
                    <X size={14} /> 取消編輯
                  </button>
                  <div className="w-[1px] h-4 bg-pink-100 dark:bg-gray-500 mx-1" />
                  <button 
                    onClick={() => setShowPreviewDuringEdit(!showPreviewDuringEdit)} 
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${showPreviewDuringEdit ? 'bg-white dark:bg-gray-600 text-pink-500 dark:text-pink-300 shadow-sm' : 'text-pink-300 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-300'}`}
                  >
                    {showPreviewDuringEdit ? <Edit3 size={14} /> : <Eye size={14} />} 
                    {showPreviewDuringEdit ? '切換編輯' : '預覽'}
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 shadow-lg transition-all active:scale-95"
                  >
                    <Save size={14} /> 編輯完成
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[550px]">
            {isEditing && !showPreviewDuringEdit ? (
              <textarea
                className="flex-1 w-full p-8 rounded-[40px] bg-pink-50/10 dark:bg-black/20 border-2 border-pink-50 dark:border-gray-700 focus:border-pink-200 dark:focus:border-gray-500 focus:outline-none focus:ring-4 focus:ring-pink-50/30 dark:focus:ring-gray-700/50 text-[#5c4b51] dark:text-gray-200 resize-none font-mono text-base leading-relaxed"
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="在這裡留下專案筆記，支援 Markdown 語法..."
                autoFocus
              />
            ) : (
              <div className="flex-1 w-full p-8 rounded-[40px] bg-white dark:bg-black/20 border border-pink-50 dark:border-gray-700 overflow-y-auto shadow-inner animate-in fade-in duration-300">
                <div className="prose prose-pink">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(isEditing ? tempNotes : notes) || "*目前這張畫布還是空的，點擊右上方編輯按鈕開始創作吧！🍓*"}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};