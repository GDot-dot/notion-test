
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.tsx';
import { GanttChart } from './components/GanttChart.tsx';
import { ProgressBoard } from './components/ProgressBoard.tsx';
import { NotesArea } from './components/NotesArea.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { KanbanBoard } from './components/KanbanBoard.tsx';
import { ProjectPrecautions } from './components/ProjectPrecautions.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { ReminderPopup } from './components/ReminderPopup.tsx';
import { Celebration } from './components/Celebration.tsx';
import { Project, ViewType, TaskStatus, Task, TaskPriority } from './types.ts';
import { COLORS } from './constants.tsx';
import { useProjects } from './context/ProjectContext.tsx';
import { auth, googleProvider, isConfigured, signInWithPopup, signOut } from './lib/firebase.ts';
import { Plus, LayoutDashboard, LayoutGrid, Calendar, BarChart2, BookOpen, Trash2, Check, Edit3, Menu, LogIn, Loader2, Save, CloudCheck, Search, FolderHeart, Sparkles, CloudOff, Filter, Tag, Bell, X, ChevronRight, RotateCcw, Cloud, GripVertical, Laptop } from 'lucide-react';
import { addDays, format, isBefore } from 'date-fns';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 🍓 可排序的任務項目元件
const SortableTaskItem: React.FC<{
  task: Task;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  isDarkMode: boolean;
}> = ({ task, onEdit, onToggleStatus, onDelete, isDarkMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-4 p-5 rounded-[28px] bg-white dark:bg-white/5 border border-pink-50 dark:border-gray-800 hover:bg-pink-50/20 dark:hover:bg-white/10 hover:shadow-lg transition-all group ${isDragging ? 'shadow-2xl ring-2 ring-pink-100' : ''}`}
      onClick={() => onEdit(task.id)}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-pink-200 dark:text-gray-600 hover:text-pink-400 p-1"
        onClick={(e) => e.stopPropagation()} // 防止點擊手柄觸發編輯
      >
        <GripVertical size={20} />
      </div>
      
      <div 
        className={`w-8 h-8 rounded-2xl border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${task.status === TaskStatus.COMPLETED ? 'bg-pink-400 border-pink-400 text-white' : 'bg-pink-50/50 dark:bg-transparent border-pink-100'}`} 
        onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, task.status); }}
      >
        {task.status === TaskStatus.COMPLETED && <Check size={18} strokeWidth={4} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-black text-[#5c4b51] dark:text-gray-200 text-base group-hover:text-pink-600 dark:group-hover:text-pink-400 truncate transition-colors duration-200">{task.title}</div>
        <div className="flex items-center gap-2 mt-1">
          {task.tags?.map(tag => (
            <span key={tag.name} className="px-2 py-0.5 rounded-lg text-[9px] font-black text-[#5c4b51] dark:text-gray-300" style={{ backgroundColor: isDarkMode ? tag.color + '88' : tag.color + 'aa' }}>
              #{tag.name}
            </span>
          ))}
          {shouldShowBell(task) && <Bell size={12} className="text-blue-400 fill-blue-400 animate-pulse" />}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`hidden sm:flex px-3 py-1 rounded-xl text-[10px] font-black shadow-sm ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-600' : task.status === TaskStatus.IN_PROGRESS ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>{task.status}</div>
        <div className="text-lg font-black text-pink-500 w-12 text-right">{task.progress}%</div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
          className="p-2 text-pink-100 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const shouldShowBell = (task: Task) => {
  if (!task.reminder || task.reminder.type === 'none' || task.status === TaskStatus.COMPLETED) return false;
  const now = new Date();
  if (task.reminder.type === 'custom' && task.reminder.date) {
    const reminderDate = new Date(task.reminder.date);
    return isBefore(now, reminderDate) && !task.remindedHistory?.includes('custom_fired');
  }
  if (task.reminder.type === '1_day' || task.reminder.type === '3_days') {
    const days = task.reminder.type === '1_day' ? 1 : 3;
    const triggerDate = new Date(addDays(new Date(task.endDate), -days).setHours(0, 0, 0, 0));
    const todayStr = format(now, 'yyyy-MM-dd');
    return isBefore(now, new Date(task.endDate)) && !task.remindedHistory?.includes(`${todayStr}_${task.reminder.type}`);
  }
  return false;
};

const SearchPalette: React.FC<{ projects: Project[], onClose: () => void, onSelect: (id: string) => void }> = ({ projects, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const found: Project[] = [];
    const search = (list: Project[]) => {
      list.forEach(p => {
        if (p.name.toLowerCase().includes(query.toLowerCase())) found.push(p);
        search(p.children);
      });
    };
    search(projects);
    return found;
  }, [query, projects]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-pink-900/20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white dark:bg-kuromi-card rounded-[32px] shadow-2xl overflow-hidden border-4 border-pink-100 dark:border-gray-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-pink-50 dark:border-gray-700 flex items-center gap-4">
          <Search className="text-pink-400" size={24} />
          <input autoFocus placeholder="搜尋計畫名稱... 🍓" className="flex-1 text-xl font-bold bg-transparent border-none focus:outline-none text-[#5c4b51] dark:text-gray-200 placeholder-pink-200" value={query} onChange={e => setQuery(e.target.value)} />
          <button onClick={onClose} className="p-2 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-full text-pink-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 no-scrollbar">
          {results.length > 0 ? results.map(p => (
            <div key={p.id} onClick={() => onSelect(p.id)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-pink-50 dark:hover:bg-white/5 cursor-pointer transition-all group">
              <div className="w-10 h-10 bg-pink-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white dark:border-gray-700">{p.logoUrl || '📁'}</div>
              <div className="flex-1"><div className="font-bold text-[#5c4b51] dark:text-gray-200 group-hover:text-pink-500">{p.name}</div></div>
              <ChevronRight size={18} className="text-pink-100 group-hover:text-pink-300" />
            </div>
          )) : query.trim() ? <div className="py-12 text-center text-pink-200 italic font-bold">找不計畫喔 🍬</div> : <div className="py-12 text-center text-pink-200 italic font-bold">輸入關鍵字開始搜尋 🍰</div>}
        </div>
      </div>
    </div>
  );
};

const ProjectView: React.FC = () => {
  const { projectId, view } = useParams<{ projectId: string, view: ViewType }>();
  const { state, dispatch, syncToCloud } = useProjects();
  const navigate = useNavigate(); 
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [activeReminders, setActiveReminders] = useState<Task[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // DND Sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // 自動請求通知權限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const findProject = useCallback((id: string, list: Project[]): Project | null => {
    for (const p of list) {
      if (p.id === id) return p;
      const found = findProject(id, p.children);
      if (found) return found;
    }
    return null;
  }, []);

  const currentProject = useMemo(() => (projectId ? findProject(projectId, state.projects) : null) || state.projects[0], [projectId, state.projects, findProject]);
  const activeView = (view || 'dashboard') as ViewType;

  const handleAddSubProject = (parentId: string | null) => {
    const newP: Project = { id: Math.random().toString(36).substr(2, 9), name: '新子計畫 🎀', parentId, notes: '', precautions: [], tasks: [], children: [], logoUrl: '📁' };
    let next: Project[];
    if (!parentId) next = [...state.projects, newP];
    else {
      const updater = (list: Project[]): Project[] => list.map(p => p.id === parentId ? { ...p, children: [...p.children, newP] } : { ...p, children: updater(p.children) });
      next = updater(state.projects);
    }
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate(`/project/${newP.id}/dashboard`);
  };

  const getAggregatedTasks = useCallback((proj: Project): Task[] => {
    let tasks = [...proj.tasks];
    proj.children.forEach(child => { tasks = [...tasks, ...getAggregatedTasks(child)]; });
    return tasks;
  }, []);

  const aggregatedTasks = useMemo(() => currentProject ? getAggregatedTasks(currentProject) : [], [currentProject, getAggregatedTasks]);

  const tagColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    aggregatedTasks.forEach(task => { task.tags?.forEach(tag => { if (!map[tag.name]) map[tag.name] = tag.color; }); });
    return map;
  }, [aggregatedTasks]);

  const uniqueTags = useMemo(() => Object.keys(tagColorMap), [tagColorMap]);

  const filteredTasks = useMemo(() => {
    if (selectedTags.length === 0) return aggregatedTasks;
    return aggregatedTasks.filter(task => task.tags?.some(tag => selectedTags.includes(tag.name)));
  }, [aggregatedTasks, selectedTags]);

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => list.map(p => p.id === id ? { ...p, ...updates } : { ...p, children: updater(p.children) });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      const idx = p.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        const ts = [...p.tasks];
        if (updates.progress === 100 && ts[idx].progress !== 100) { setIsCelebrating(true); setTimeout(() => setIsCelebrating(false), 3000); }
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
    const newTask: Task = { id: Math.random().toString(36).substr(2, 9), title: '新任務 🎀', description: '', startDate: new Date().toISOString(), endDate: addDays(new Date(), 2).toISOString(), progress: 0, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, color: COLORS.taskColors[0], remindedHistory: [], tags: [] };
    updateProject(currentProject.id, { tasks: [...currentProject.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentProject.tasks.findIndex(t => t.id === active.id);
      const newIndex = currentProject.tasks.findIndex(t => t.id === over.id);
      const newTasks = arrayMove(currentProject.tasks, oldIndex, newIndex);
      updateProject(currentProject.id, { tasks: newTasks });
    }
  };

  // 提醒監測循環 (含 Windows 系統通知)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const tasksToNotify: Task[] = [];
      
      aggregatedTasks.forEach(task => {
        if (!task.reminder || task.reminder.type === 'none' || task.status === TaskStatus.COMPLETED) return;
        let shouldTrigger = false;
        let historyKey = '';
        if (task.reminder.type === 'custom' && task.reminder.date) {
          const rDate = new Date(task.reminder.date);
          if (isBefore(rDate, now)) {
            historyKey = 'custom_fired';
            if (!task.remindedHistory?.includes(historyKey)) shouldTrigger = true;
          }
        } else if (task.reminder.type === '1_day' || task.reminder.type === '3_days') {
          const days = task.reminder.type === '1_day' ? 1 : 3;
          const triggerDate = new Date(addDays(new Date(task.endDate), -days).setHours(0, 0, 0, 0));
          if (isBefore(triggerDate, now) && isBefore(now, new Date(task.endDate))) {
            historyKey = `${todayStr}_${task.reminder.type}`;
            if (!task.remindedHistory?.includes(historyKey)) shouldTrigger = true;
          }
        }
        
        if (shouldTrigger) {
          tasksToNotify.push(task);
          // 🍓 修復部署錯誤：Task 不包含 logoUrl，改用固定字串或專案標誌
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🎀 Melody 任務提醒`, {
              body: `任務「${task.title}」時間快到囉！🍭`,
              // 移除錯誤的 task.logoUrl 引用
            });
          }
          const newHistory = [...(task.remindedHistory || []), historyKey];
          updateTask(task.id, { remindedHistory: newHistory });
        }
      });
      if (tasksToNotify.length > 0) setActiveReminders((prev) => [...prev, ...tasksToNotify]);
    };
    const timer = setInterval(checkReminders, 30000);
    checkReminders();
    return () => clearInterval(timer);
  }, [aggregatedTasks, updateTask]);

  const handleToggleTag = (tagName: string) => { setSelectedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]); };

  const handleLogin = async () => { if (isConfigured && auth) await signInWithPopup(auth, googleProvider); };

  const syncStatus = useMemo(() => {
    if (!state.user) return { label: '本機儲存 🏠', icon: <Laptop size={14} />, color: 'text-gray-400 dark:text-gray-500' };
    if (state.isSyncing) return { label: '雲端同步中...', icon: <Cloud size={14} className="animate-pulse" />, color: 'text-blue-400' };
    return { label: '雲端已同步', icon: <Cloud size={14} />, color: 'text-green-400' };
  }, [state.user, state.isSyncing]);

  if (state.isLoading) return <div className="h-screen flex items-center justify-center bg-[#fff5f8] dark:bg-kuromi-bg"><Loader2 className="w-12 h-12 text-pink-400 animate-spin" /></div>;

  return (
    <div className="flex min-h-screen relative bg-[#fff5f8] dark:bg-kuromi-bg transition-colors duration-500">
      {isSidebarOpen && <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      {isCelebrating && <Celebration />}
      {activeReminders.length > 0 && <ReminderPopup tasks={activeReminders} onClose={() => setActiveReminders([])} />}

      <Sidebar 
        projects={state.projects} workspaceLogo={state.workspaceLogo} workspaceName={state.workspaceName}
        onUpdateWorkspace={(logo, name) => { dispatch({ type: 'UPDATE_WORKSPACE', logo, name }); syncToCloud(state.projects, logo, name); }}
        selectedProjectId={currentProject.id} isOpen={isSidebarOpen}
        onSelectProject={(id) => { navigate(`/project/${id}/${activeView}`); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        onAddProject={handleAddSubProject}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-6 group">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white dark:bg-kuromi-card rounded-xl border border-pink-100 dark:border-gray-700 shadow-sm"><Menu size={24} /></button>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-kuromi-card rounded-[32px] flex items-center justify-center text-4xl shadow-inner border-2 border-pink-100 dark:border-gray-600 overflow-hidden cursor-pointer" onClick={() => { const res = prompt('Emoji?', currentProject.logoUrl); if (res) updateProject(currentProject.id, { logoUrl: res }); }}>{currentProject.logoUrl}</div>
            <div className="flex flex-col">
              <input value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} className="text-3xl md:text-4xl font-black text-pink-600 dark:text-kuromi-text bg-transparent border-none focus:outline-none" />
              <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-black/5 dark:bg-black/30 rounded-full w-fit border border-black/5 dark:border-white/5 transition-all shadow-sm">
                <span className={syncStatus.color}>{syncStatus.icon}</span>
                <span className={`text-[11px] font-black ${syncStatus.color}`}>
                  {syncStatus.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-kuromi-card text-pink-500 rounded-[20px] border border-pink-100 dark:border-gray-700 shadow-sm transition-all hover:bg-pink-50 active:scale-95">
              <Search size={20} /> <span className="font-bold text-sm">搜尋</span>
            </button>
            {!state.user ? (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-md text-blue-500 hover:bg-blue-50 transition-all"><LogIn size={18} /> 登入</button>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 dark:bg-kuromi-card p-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={state.user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200 shadow-sm" />
                <button onClick={() => auth && signOut(auth)} className="text-[10px] font-bold text-pink-300">登出</button>
              </div>
            )}
            <button onClick={() => { if (confirm('😱 確定要刪除這個計畫嗎？🍭')) { const remover = (list: Project[]): Project[] => list.filter(p => p.id !== currentProject.id).map(p => ({ ...p, children: remover(p.children) })); const next = remover(state.projects); dispatch({ type: 'UPDATE_PROJECTS', projects: next }); syncToCloud(next); navigate(next.length > 0 ? `/project/${next[0].id}/dashboard` : '/'); } }} className="p-2.5 bg-white dark:bg-kuromi-card text-[#ff85b2] hover:bg-pink-50 rounded-xl border border-pink-50 shadow-sm transition-all" title="刪除計畫"><Trash2 size={20} /></button>
            <button onClick={() => handleAddSubProject(currentProject.id)} className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-pink-600 transition-all active:scale-95"><Plus size={16} /> 建立計畫</button>
          </div>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar px-2">
          {[ { id: 'dashboard', label: '總覽', icon: <LayoutGrid size={20} /> }, { id: 'kanban', label: '看板', icon: <LayoutDashboard size={20} /> }, { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={20} /> }, { id: 'calendar', label: '日期表', icon: <Calendar size={20} /> }, { id: 'notes', label: '設定', icon: <BookOpen size={20} /> } ].map(v => (
            <button key={v.id} onClick={() => navigate(`/project/${currentProject.id}/${v.id}`)} className={`flex items-center gap-2.5 px-8 py-3 rounded-full font-bold transition-all ${activeView === v.id ? 'bg-pink-500 text-white shadow-xl scale-105' : 'text-pink-300 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-8 px-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 text-pink-400 flex-shrink-0">
            <Filter size={18} /> 
            <span className="text-sm font-black">過濾標籤:</span>
          </div>
          <div className="flex items-center gap-2">
            {uniqueTags.map(tagName => {
              const isSelected = selectedTags.includes(tagName);
              const tagColor = tagColorMap[tagName];
              return (
                <button 
                  key={tagName} 
                  onClick={() => handleToggleTag(tagName)} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all border shadow-sm flex-shrink-0 ${isSelected ? 'scale-105 ring-2 ring-pink-100 dark:ring-pink-900/40 border-transparent text-black' : 'bg-gray-100/60 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent transition-colors duration-300'}`} 
                  style={{ backgroundColor: isSelected ? tagColor : undefined }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = tagColor + '44'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = ""; }}
                >
                  <Tag size={12} fill={isSelected ? "currentColor" : "none"} className={isSelected ? 'text-black' : ''} /> 
                  {tagName} 
                  {isSelected && <Check size={10} />}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button 
                onClick={() => setSelectedTags([])} 
                className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-black bg-[#2d333b] dark:bg-[#3d444d] text-white hover:bg-[#444c56] transition-all shadow-sm flex-shrink-0"
              >
                清除
              </button>
            )}
          </div>
        </div>

        <div className="space-y-12 pb-20">
          {activeView === 'dashboard' ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"><ProgressBoard tasks={filteredTasks} /><ProjectPrecautions precautions={currentProject.precautions || []} onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} onColorChange={(color) => updateProject(currentProject.id, { precautionsColor: color })} /></div>
              <GanttChart tasks={filteredTasks} onTaskClick={setEditingTaskId} />
              <div className="bg-white dark:bg-kuromi-card rounded-[40px] p-8 cute-shadow border border-pink-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3"><div className="w-10 h-10 bg-pink-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-pink-400 shadow-inner border border-pink-100 dark:border-gray-700"><Check size={20} /></div><h3 className="text-xl font-bold text-pink-600 dark:text-kuromi-accent">任務清單</h3></div>
                   <button onClick={addTask} className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-pink-50 dark:bg-gray-800 text-pink-500 dark:text-pink-300 font-black text-xs hover:bg-pink-100 transition-all shadow-sm"><Plus size={16} /> 新增任務</button>
                </div>
                
                {/* 🍓 啟用 DND 拖曳環境 */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext 
                    items={filteredTasks.map(t => t.id)} 
                    strategy={verticalListSortingStrategy}
                    children={
                      <div className="space-y-4">
                        {filteredTasks.map(task => (
                          <SortableTaskItem 
                            key={task.id} 
                            task={task} 
                            isDarkMode={state.isDarkMode}
                            onEdit={setEditingTaskId}
                            onToggleStatus={(id, status) => updateTask(id, { 
                              status: status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED, 
                              progress: status === TaskStatus.COMPLETED ? 0 : 100 
                            })}
                            onDelete={(id) => {
                              if (confirm('確定要刪除這個任務嗎？ 🍬')) {
                                updateProject(currentProject.id, { tasks: currentProject.tasks.filter(t => t.id !== id) });
                              }
                            }}
                          />
                        ))}
                        {filteredTasks.length === 0 && (
                          <div className="py-12 text-center text-pink-200 italic font-bold">目前沒有任務喔，點擊新增按鈕開始吧！🍭</div>
                        )}
                      </div>
                    }
                  />
                </DndContext>
              </div>
              <CalendarView tasks={filteredTasks} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 h-full">
              {activeView === 'kanban' && <KanbanBoard tasks={filteredTasks} onTaskUpdate={updateTask} onTaskClick={setEditingTaskId} />}
              {activeView === 'gantt' && <GanttChart tasks={filteredTasks} onTaskClick={setEditingTaskId} />}
              {activeView === 'calendar' && <CalendarView tasks={filteredTasks} />}
              {activeView === 'notes' && <NotesArea notes={currentProject.notes} onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })} onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })} onUpdateAttachments={(files) => updateProject(currentProject.id, { attachments: files })} />}
            </div>
          )}
        </div>
      </main>
      {isSearchOpen && <SearchPalette projects={state.projects} onClose={() => setIsSearchOpen(false)} onSelect={(id) => { navigate(`/project/${id}/dashboard`); setIsSearchOpen(false); }} />}
      {editingTaskId && aggregatedTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal task={aggregatedTasks.find(t => t.id === editingTaskId)!} allProjects={state.projects} onClose={() => setEditingTaskId(null)} onUpdate={(up) => updateTask(editingTaskId, up)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { state } = useProjects();
  return (
    <Routes>
      <Route path="/project/:projectId/:view" element={<ProjectView />} />
      <Route path="/" element={state.projects.length > 0 ? <Navigate to={`/project/${state.projects[0].id}/dashboard`} replace /> : <div className="h-screen flex items-center justify-center bg-[#fff5f8] dark:bg-kuromi-bg"><Loader2 className="w-12 h-12 text-pink-400 animate-spin" /></div>} />
    </Routes>
  );
};
export default App;
