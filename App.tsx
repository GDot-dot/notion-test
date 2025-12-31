
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { GanttChart } from './components/GanttChart';
import { ProgressBoard } from './components/ProgressBoard';
import { NotesArea } from './components/NotesArea';
import { CalendarView } from './components/CalendarView';
import { ProjectPrecautions } from './components/ProjectPrecautions';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ReminderPopup } from './components/ReminderPopup';
import { Project, ViewType, TaskStatus, Task, TaskPriority } from './types.ts';
import { COLORS } from './constants.tsx';
import { useProjects } from './context/ProjectContext';
import { auth, googleProvider, isConfigured, signInWithPopup, signOut } from './lib/firebase.ts';
import { Plus, LayoutDashboard, Calendar, BarChart2, BookOpen, Trash2, Check, Edit3, Menu, LogIn, Loader2, Save, CloudCheck, Search, FolderHeart, Sparkles, CloudOff, Filter, Tag, Bell } from 'lucide-react';
import { addDays, format } from 'date-fns';

// 🍓 搜尋面板組件
const SearchPalette: React.FC<{ 
  projects: Project[], 
  onClose: () => void, 
  onSelect: (id: string, type: 'project' | 'task') => void 
}> = ({ projects, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  
  const searchResults = useMemo(() => {
    if (!query.trim()) return { projects: [], tasks: [] };
    const q = query.toLowerCase();
    const pResults: Project[] = [];
    const tResults: { task: Task, projectId: string }[] = [];

    const searchRecursive = (list: Project[]) => {
      list.forEach(p => {
        if (p.name.toLowerCase().includes(q)) pResults.push(p);
        p.tasks.forEach(t => {
          if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
            tResults.push({ task: t, projectId: p.id });
          }
        });
        searchRecursive(p.children);
      });
    };
    searchRecursive(projects);
    return { projects: pResults, tasks: tResults };
  }, [query, projects]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-pink-900/10 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[60vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 p-6 border-b border-pink-50">
          <Search className="text-pink-400" />
          <input 
            autoFocus
            placeholder="搜尋計畫、任務或內容... (Cmd+P)"
            className="flex-1 bg-transparent border-none text-xl font-bold text-[#5c4b51] focus:outline-none placeholder:text-pink-200"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
             <kbd className="hidden sm:inline-block px-2 py-1 bg-pink-50 text-pink-300 text-[10px] rounded-lg font-bold">ESC</kbd>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {query.trim() === '' ? (
            <div className="text-center py-20 opacity-30">
              <Sparkles size={48} className="mx-auto mb-4 text-pink-300" />
              <p className="font-bold">輸入關鍵字開始快速導航 🍰</p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.projects.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-3 ml-2">計畫項目 / Projects</h4>
                  <div className="space-y-1">
                    {searchResults.projects.map(p => (
                      <div key={p.id} onClick={() => onSelect(p.id, 'project')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-md cursor-pointer transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-pink-50 shadow-inner flex items-center justify-center border border-pink-100 group-hover:border-pink-300">
                          {p.logoUrl?.length === 2 ? p.logoUrl : <FolderHeart size={16} className="text-pink-400" />}
                        </div>
                        <span className="font-bold text-[#5c4b51]">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.tasks.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-3 ml-2">任務項目 / Tasks</h4>
                  <div className="space-y-1">
                    {searchResults.tasks.map(({ task, projectId }) => (
                      <div key={task.id} onClick={() => onSelect(projectId, 'task')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-md cursor-pointer transition-all group">
                        <div className="w-8 h-8 rounded-lg border-2 border-pink-200 flex items-center justify-center text-[10px] font-black text-pink-400 bg-white">
                          {task.progress}%
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#5c4b51] text-sm">{task.title}</span>
                          <span className="text-[10px] text-pink-300 opacity-60 truncate max-w-md">{task.description || '尚無描述'}</span>
                          {task.reminder?.type && task.reminder.type !== 'none' && <span className="text-[9px] text-blue-400 flex items-center gap-1"><Bell size={8}/> 有設定提醒</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.projects.length === 0 && searchResults.tasks.length === 0 && (
                <div className="text-center py-10 opacity-30 font-bold">找不到相關內容 🥺</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 🍓 任務項
const TaskItem = React.memo(({ task, onToggleStatus, onEdit, onDelete }: { 
  task: Task, 
  onToggleStatus: () => void, 
  onEdit: () => void,
  onDelete: () => void 
}) => {
  return (
    <div className="flex items-center gap-4 p-4 md:p-5 rounded-[24px] md:rounded-3xl bg-pink-50/20 border border-pink-50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group" onClick={onEdit}>
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
          task.status === TaskStatus.COMPLETED ? 'bg-pink-400 border-pink-400 text-white shadow-inner scale-110' : 'bg-white border-pink-200 hover:border-pink-300'
        }`}
      >
        {task.status === TaskStatus.COMPLETED && <Check size={16} strokeWidth={4} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-[#5c4b51] text-base md:text-lg truncate ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{task.title}</p>
        
        {/* 顯示標籤 - 更新為物件結構 */}
        <div className="flex flex-wrap gap-1 mt-1.5 items-center">
          {task.tags && task.tags.length > 0 && task.tags.map(tag => (
            <span 
              key={tag.name} 
              className="text-[9px] px-2 py-0.5 rounded-full font-bold text-[#5c4b51] opacity-80"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
          {/* 提醒圖示 */}
          {task.reminder && task.reminder.type !== 'none' && task.status !== TaskStatus.COMPLETED && (
            <span className="text-blue-400" title="已設定提醒"><Bell size={12} fill="currentColor" className="opacity-60" /></span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="px-3 py-1 rounded-full text-[10px] font-black border border-white/50 shadow-sm" style={{ backgroundColor: COLORS.status[task.status] }}>{task.status}</div>
        <span className="text-sm font-bold text-pink-500 min-w-[32px]">{task.progress}%</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-pink-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

const ProjectView: React.FC = () => {
  const { projectId, view } = useParams<{ projectId: string, view: ViewType }>();
  const { state, dispatch, syncToCloud } = useProjects();
  const navigate = useNavigate(); 
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 🍓 標籤過濾狀態

  // 🍓 全域快捷鍵監聽 Cmd/Ctrl + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 輔助函式：在樹狀結構中尋找專案
  const findProject = useCallback((id: string, list: Project[]): Project | null => {
    for (const p of list) {
      if (p.id === id) return p;
      const found = findProject(id, p.children);
      if (found) return found;
    }
    return null;
  }, []);

  const currentProject = useMemo(() => {
    return (projectId ? findProject(projectId, state.projects) : null) || state.projects[0];
  }, [projectId, state.projects, findProject]);

  // 🍓 追蹤最近存取時間
  useEffect(() => {
    if (currentProject) {
      const now = new Date().toISOString();
      if (currentProject.lastAccessedAt && (new Date().getTime() - new Date(currentProject.lastAccessedAt).getTime() < 1000 * 30)) return;
      
      const updater = (list: Project[]): Project[] => list.map(p => {
        if (p.id === currentProject.id) return { ...p, lastAccessedAt: now };
        return { ...p, children: updater(p.children) };
      });
      const next = updater(state.projects);
      dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    }
  }, [currentProject?.id]);

  const activeView = (view || 'dashboard') as ViewType;

  // 輔助函式：遞迴獲取所有子專案的任務
  const getAggregatedTasks = useCallback((proj: Project): Task[] => {
    let tasks = [...proj.tasks];
    proj.children.forEach(child => {
      tasks = [...tasks, ...getAggregatedTasks(child)];
    });
    return tasks;
  }, []);

  const aggregatedTasks = useMemo(() => {
    return currentProject ? getAggregatedTasks(currentProject) : [];
  }, [currentProject, getAggregatedTasks]);

  // 🍓 計算所有可用的標籤 (Unique - 包含顏色)
  const availableTags = useMemo(() => {
    const tagsMap = new Map<string, string>(); // name -> color
    aggregatedTasks.forEach(t => t.tags?.forEach(tag => {
      if (!tagsMap.has(tag.name)) {
        tagsMap.set(tag.name, tag.color);
      }
    }));
    return Array.from(tagsMap.entries()).map(([name, color]) => ({ name, color }));
  }, [aggregatedTasks]);

  // 🍓 根據選取的標籤過濾任務
  const filteredTasks = useMemo(() => {
    if (selectedTags.length === 0) return aggregatedTasks;
    return aggregatedTasks.filter(task => 
      task.tags?.some(tag => selectedTags.includes(tag.name))
    );
  }, [aggregatedTasks, selectedTags]);

  const toggleTagFilter = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  // 更新專案資訊
  const updateProject = (id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      if (p.id === id) return { ...p, ...updates };
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  // 更新任務資訊
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      const idx = p.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        const ts = [...p.tasks];
        ts[idx] = { ...ts[idx], ...updates };
        return { ...p, tasks: ts };
      }
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const addTask = () => {
    if (!currentProject) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: '新任務 🎀',
      description: '',
      startDate: today.toISOString(),
      endDate: addDays(today, 2).toISOString(),
      progress: 0,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      color: COLORS.taskColors[Math.floor(Math.random() * COLORS.taskColors.length)],
      attachments: [],
      tags: []
    };
    updateProject(currentProject.id, { tasks: [...currentProject.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };
  
  const deleteTask = (taskId: string) => {
    if (!confirm('確定要刪除這個任務嗎？ 🍬')) return;
    const remover = (list: Project[]): Project[] => list.map(p => ({
      ...p,
      tasks: p.tasks.filter(t => t.id !== taskId),
      children: remover(p.children)
    }));
    const next = remover(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const deleteProject = (id: string) => {
    if (!confirm('確定要刪除目前這個計畫嗎？ 🥺')) return;
    
    const filter = (list: Project[]): Project[] => list.filter(p => p.id !== id).map(p => ({
      ...p,
      children: filter(p.children)
    }));
    
    let next = filter(state.projects);

    if (next.length === 0) {
      const defaultProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: '我的新計畫 🎀',
        parentId: null,
        notes: '# 歡迎來到 Melody 專案管理 🍓\n\n這裡是您的新起點！',
        precautions: ['試著新增一些任務吧！', '可以更換專案 Logo 喔'],
        precautionsColor: COLORS.stickyNotes[Math.floor(Math.random() * COLORS.stickyNotes.length)],
        tasks: [],
        children: [],
        logoUrl: '✨',
        attachments: []
      };
      next = [defaultProject];
    }

    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    
    if (!findProject(currentProject.id, next)) {
       navigate(`/project/${next[0].id}/dashboard`);
    }
  };

  const addProject = (parentId: string | null) => {
    const newP: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新計畫 🎀',
      parentId,
      notes: '',
      precautions: [],
      precautionsColor: COLORS.stickyNotes[Math.floor(Math.random() * COLORS.stickyNotes.length)],
      tasks: [],
      children: [],
      logoUrl: '📁',
      attachments: []
    };
    let next: Project[];
    if (!parentId) next = [...state.projects, newP];
    else {
      const updater = (list: Project[]): Project[] => list.map(p => {
        if (p.id === parentId) return { ...p, children: [...p.children, newP] };
        return { ...p, children: updater(p.children) };
      });
      next = updater(state.projects);
    }
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate(`/project/${newP.id}/dashboard`);
  };

  const handleLogin = async () => {
    if (!isConfigured) {
      alert("🍭 需要先設定 Firebase 金鑰喔！\n\n請前往 lib/firebase.ts 檔案，將您的 Firebase 配置填入 firebaseConfig 物件中。");
      return;
    }
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed:", error);
      alert(`登入失敗 🥺\n原因：${error.message || "未知錯誤"}\n請檢查 Firebase 控制台的 Google Auth 是否已啟用。`);
    }
  };

  if (state.isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#fff5f8]">
      <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-[#fff5f8]">
      {isSidebarOpen && <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
      <Sidebar 
        projects={state.projects} 
        workspaceLogo={state.workspaceLogo}
        workspaceName={state.workspaceName}
        onUpdateWorkspace={(logo, name) => {
          dispatch({ type: 'UPDATE_WORKSPACE', logo, name });
          syncToCloud(state.projects, logo, name);
        }}
        selectedProjectId={currentProject.id} 
        isOpen={isSidebarOpen}
        onSelectProject={(id) => { 
          navigate(`/project/${id}/${activeView}`);
          if (window.innerWidth < 768) setIsSidebarOpen(false); 
        }}
        onAddProject={addProject}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-3 md:gap-6 group">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white rounded-xl shadow-sm border border-pink-100">
              <Menu size={24} />
            </button>
            <div className="relative cursor-pointer group" onClick={() => {
              const res = prompt('請輸入 Emoji 或圖片網址 🍭', currentProject.logoUrl || '📁');
              if (res !== null) updateProject(currentProject.id, { logoUrl: res });
            }}>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[32px] flex items-center justify-center text-2xl md:text-5xl shadow-inner border-2 border-pink-100 overflow-hidden">
                {currentProject.logoUrl?.startsWith('http') || currentProject.logoUrl?.startsWith('blob') ? <img src={currentProject.logoUrl} className="w-full h-full object-cover" /> : (currentProject.logoUrl || '📁')}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-pink-500 p-1.5 rounded-full shadow-md border-2 border-white transition-transform group-hover:scale-110"><Edit3 size={12} className="text-white" /></div>
            </div>
            <div className="flex-1 min-w-0">
              <input value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} className="text-2xl md:text-4xl font-black text-pink-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 w-full truncate" />
              <div className="flex items-center gap-2 mt-1 ml-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/40 rounded-full border border-pink-100 shadow-sm">
                  {state.isSyncing ? (
                    <><Loader2 size={12} className="text-pink-400 animate-spin" /><span className="text-[10px] text-pink-400 font-bold">處理中...</span></>
                  ) : !isConfigured ? (
                    <><CloudOff size={12} className="text-pink-300" /><span className="text-[10px] text-pink-400 font-bold">🍓 本機模式 (未填寫金鑰)</span></>
                  ) : state.user ? (
                    <><CloudCheck size={12} className="text-green-400" /><span className="text-[10px] text-green-500 font-bold">雲端已同步</span></>
                  ) : (
                    <><Save size={12} className="text-blue-400" /><span className="text-[10px] text-blue-500 font-bold">等待登入</span></>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 bg-white text-pink-400 hover:text-pink-600 rounded-xl border border-pink-50 shadow-sm hover:bg-pink-50 transition-all flex items-center gap-2"
            >
              <Search size={20} /> <span className="hidden sm:inline font-bold text-sm">搜尋</span>
            </button>
            {!state.user ? (
              <button 
                onClick={handleLogin} 
                className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-md border border-blue-50 transition-all text-blue-500 hover:bg-blue-50 active:scale-95`}
              >
                <LogIn size={18} /> Google 登入
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 p-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={state.user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200 shadow-sm" />
                <button onClick={() => auth && signOut(auth)} className="text-[10px] font-bold text-pink-300 hover:text-red-400">登出</button>
              </div>
            )}
            <button onClick={() => deleteProject(currentProject.id)} className="p-2.5 bg-white text-pink-300 hover:text-red-400 rounded-xl border border-pink-50 shadow-sm hover:bg-red-50 transition-colors"><Trash2 size={20} /></button>
            <button onClick={() => addProject(currentProject.id)} className="flex items-center gap-2 bg-pink-500 text-white px-4 md:px-6 py-2 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shadow-md hover:bg-pink-600 transition-all active:scale-95"><Plus size={16} /> 建立計畫</button>
          </div>
        </header>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: '總覽', icon: <LayoutDashboard size={18} /> },
            { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={18} /> },
            { id: 'calendar', label: '日期表', icon: <Calendar size={18} /> },
            { id: 'notes', label: '設定', icon: <BookOpen size={18} /> },
          ].map(v => (
            <button key={v.id} onClick={() => navigate(`/project/${currentProject.id}/${v.id}`)} className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[20px] font-bold transition-all ${activeView === v.id ? 'bg-pink-500 text-white shadow-xl translate-y-[-2px]' : 'text-pink-300 bg-white/50 hover:bg-pink-50'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-8 md:space-y-12 pb-20 animate-in fade-in duration-500">
          {activeView === 'dashboard' ? (
            <div className="space-y-8 md:space-y-12">
              {/* 🍓 標籤過濾器 (Tag Filter) */}
              {availableTags.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                  <div className="flex items-center gap-2 text-pink-300 font-bold text-xs px-2 whitespace-nowrap">
                    <Filter size={14} /> 過濾標籤:
                  </div>
                  {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.name}
                        onClick={() => toggleTagFilter(tag.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isSelected ? 'shadow-md scale-105 border-2 border-white' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}
                        style={{ backgroundColor: tag.color, color: '#5c4b51' }}
                      >
                        <Tag size={10} className={isSelected ? 'fill-current' : ''} />
                        {tag.name}
                        {isSelected && <Check size={10} />}
                      </button>
                    );
                  })}
                  {selectedTags.length > 0 && (
                    <button onClick={() => setSelectedTags([])} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 text-xs font-bold hover:bg-gray-200 ml-2">
                      清除
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={filteredTasks} />
                <ProjectPrecautions 
                  precautions={currentProject.precautions || []} 
                  backgroundColor={currentProject.precautionsColor}
                  onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} 
                  onColorChange={(color) => updateProject(currentProject.id, { precautionsColor: color })}
                />
              </div>
              
              <GanttChart tasks={filteredTasks} />
              
              <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-xl font-bold text-pink-600 flex items-center gap-3"><span className="p-2 bg-pink-100 rounded-xl text-pink-500"><Check size={20} /></span>任務清單</h3>
                  <button onClick={addTask} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-50 text-pink-500 px-6 py-2.5 rounded-2xl font-bold hover:bg-pink-100 shadow-sm transition-all"><Plus size={18} /> 新增任務</button>
                </div>
                <div className="space-y-4">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggleStatus={() => {
                          const s = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
                          updateTask(task.id, { status: s, progress: s === TaskStatus.COMPLETED ? 100 : 0 });
                        }}
                        onEdit={() => setEditingTaskId(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-pink-200 font-bold italic border-2 border-dashed border-pink-50 rounded-3xl">
                      {selectedTags.length > 0 ? '沒有符合選取標籤的任務喔 🥺' : '快來新增你的第一個任務吧！🍭'}
                    </div>
                  )}
                </div>
              </div>
              <CalendarView tasks={filteredTasks} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeView === 'gantt' && <GanttChart tasks={filteredTasks} />}
              {activeView === 'calendar' && <CalendarView tasks={filteredTasks} />}
              {activeView === 'notes' && (
                <NotesArea 
                  notes={currentProject.notes} 
                  logoUrl={currentProject.logoUrl} 
                  attachments={currentProject.attachments}
                  onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })} 
                  onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })} 
                  onUpdateAttachments={(files) => updateProject(currentProject.id, { attachments: files })}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {isSearchOpen && (
        <SearchPalette 
          projects={state.projects} 
          onClose={() => setIsSearchOpen(false)} 
          onSelect={(id, type) => {
            navigate(`/project/${id}/dashboard`);
            setIsSearchOpen(false);
          }}
        />
      )}

      {editingTaskId && aggregatedTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal 
          task={aggregatedTasks.find(t => t.id === editingTaskId)!}
          allProjects={state.projects}
          onClose={() => setEditingTaskId(null)}
          onUpdate={(up) => updateTask(editingTaskId, up)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { state } = useProjects();
  const [reminderTasks, setReminderTasks] = useState<Task[]>([]);
  const projectsRef = useRef(state.projects);
  
  const defaultProjectId = state.projects.length > 0 ? state.projects[0].id : 'root-1';

  // 🍓 同步專案資料到 Ref，供計時器使用 (避免 Closure 陷阱)
  useEffect(() => {
    projectsRef.current = state.projects;
  }, [state.projects]);

  // 🍓 任務提醒邏輯 (每 2 秒檢查一次，精確鎖定分鐘窗口)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // 靜默請求權限，或等待使用者在設定點擊
    }

    const checkReminders = () => {
      const now = new Date();
      const nowTime = now.getTime();
      const notifiedKey = 'melody_notified_tasks';
      const notifiedMap = JSON.parse(localStorage.getItem(notifiedKey) || '{}');
      
      let hasUpdates = false;
      const tasksToNotify: Task[] = [];
      const allTasks: Task[] = [];

      const traverse = (list: Project[]) => {
        list.forEach(p => {
          allTasks.push(...p.tasks);
          traverse(p.children);
        });
      };
      
      traverse(projectsRef.current);

      allTasks.forEach(task => {
        // 1. 基本過濾：任務已完成、無設定提醒、或提醒類型為 none -> 跳過
        if (task.status === TaskStatus.COMPLETED || !task.reminder || task.reminder.type === 'none') return;
        
        let triggerTime: Date | null = null;
        const endDate = new Date(task.endDate);
        
        if (task.reminder.type === '1_day') {
          triggerTime = addDays(endDate, -1);
        } else if (task.reminder.type === '3_days') {
          triggerTime = addDays(endDate, -3);
        } else if (task.reminder.type === 'custom' && task.reminder.date) {
          triggerTime = new Date(task.reminder.date);
        }

        if (triggerTime) {
          const triggerTs = triggerTime.getTime();
          const diffMs = nowTime - triggerTs;

          // 🍓 核心邏輯：
          // 只有在「目標時間」開始後的 60 秒內 (0 <= diffMs < 60000) 才會觸發。
          // 這樣保證了：
          // 1. 時間還沒到 (diffMs < 0) -> 不觸發
          // 2. 時間剛到 (0 <= diffMs < 60000) -> 觸發 (並檢查是否已通知過)
          // 3. 時間已過 (diffMs >= 60000) -> 不再觸發 (過期不補發)
          
          if (diffMs >= 0 && diffMs < 60000) {
            // 使用 [ID + 類型 + 時間戳] 作為唯一 Key
            // 如果使用者修改時間，時間戳變動，Key 變動，就會重新觸發
            const uniqueKey = `${task.id}_${task.reminder.type}_${triggerTs}`;
            
            // 檢查 LocalStorage 是否已經通知過這個 Key
            if (!notifiedMap[uniqueKey]) {
              tasksToNotify.push(task);

              // A. 發送系統通知
              if ('Notification' in window && Notification.permission === 'granted') {
                 try {
                   new Notification(`⏰ 任務提醒：${task.title}`, {
                     body: `您的任務即將在 ${format(endDate, 'MM/dd HH:mm')} 到期！\n目前進度：${task.progress}%`,
                     icon: '/vite.svg' 
                   });
                 } catch (e) { console.error('Notification error', e); }
              }

              // 記錄已通知，避免這一分鐘內重複跳出
              notifiedMap[uniqueKey] = nowTime;
              hasUpdates = true;
            }
          }
        }
      });

      if (hasUpdates) {
        localStorage.setItem(notifiedKey, JSON.stringify(notifiedMap));
      }

      // B. 觸發網頁彈窗 (In-App Popup)
      if (tasksToNotify.length > 0) {
        setReminderTasks(prev => {
           // 避免重複 ID 加入
           const existingIds = new Set(prev.map(t => t.id));
           const newTasks = tasksToNotify.filter(t => !existingIds.has(t.id));
           return [...prev, ...newTasks];
        });
      }
    };

    // 每 2 秒檢查一次，確保不會錯過那一分鐘的窗口
    const intervalId = setInterval(checkReminders, 2000);
    
    // 立即執行一次
    checkReminders(); 

    return () => clearInterval(intervalId);
  }, []); 

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={`/project/${defaultProjectId}/dashboard`} replace />} />
        <Route path="/project/:projectId/:view" element={<ProjectView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* 🍓 網頁內彈出提醒視窗 */}
      {reminderTasks.length > 0 && (
        <ReminderPopup 
          tasks={reminderTasks} 
          onClose={() => setReminderTasks([])} 
        />
      )}
    </>
  );
};

export default App;
