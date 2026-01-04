
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
import { Plus, LayoutDashboard, LayoutGrid, Calendar, BarChart2, BookOpen, Trash2, Check, Edit3, Menu, LogIn, Loader2, Save, CloudCheck, Search, FolderHeart, Sparkles, CloudOff, Filter, Tag, Bell, X, ChevronRight } from 'lucide-react';
import { addDays, format, isSameDay, isBefore } from 'date-fns';

// 🍓 判斷是否需要顯示小鈴鐺
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
    const historyKey = `${todayStr}_${task.reminder.type}`;
    return isBefore(now, new Date(task.endDate)) && !task.remindedHistory?.includes(historyKey);
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
          <input 
            autoFocus
            placeholder="搜尋計畫名稱... 🍓" 
            className="flex-1 text-xl font-bold bg-transparent border-none focus:outline-none text-[#5c4b51] dark:text-gray-200 placeholder-pink-200"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-full text-pink-200 transition-colors"><X size={20} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 no-scrollbar">
          {results.length > 0 ? results.map(p => (
            <div 
              key={p.id} 
              onClick={() => onSelect(p.id)}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-pink-50 dark:hover:bg-white/5 cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 bg-pink-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white dark:border-gray-700">{p.logoUrl || '📁'}</div>
              <div className="flex-1">
                <div className="font-bold text-[#5c4b51] dark:text-gray-200 group-hover:text-pink-500">{p.name}</div>
                <div className="text-[10px] font-black text-pink-300 uppercase tracking-widest">{p.tasks.length} 任務</div>
              </div>
              <ChevronRight size={18} className="text-pink-100 group-hover:text-pink-300" />
            </div>
          )) : query.trim() ? (
            <div className="py-12 text-center text-pink-200 dark:text-gray-600 italic font-bold">找不計畫喔 🍬</div>
          ) : (
            <div className="py-12 text-center text-pink-200 dark:text-gray-600 italic font-bold">輸入關鍵字開始搜尋 🍰</div>
          )}
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

  const getAggregatedTasks = useCallback((proj: Project): Task[] => {
    let tasks = [...proj.tasks];
    proj.children.forEach(child => { tasks = [...tasks, ...getAggregatedTasks(child)]; });
    return tasks;
  }, []);

  const aggregatedTasks = useMemo(() => currentProject ? getAggregatedTasks(currentProject) : [], [currentProject, getAggregatedTasks]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const foundAlerts: Task[] = [];
      const updatedTaskIds: {id: string, history: string[]}[] = [];

      aggregatedTasks.forEach(task => {
        if (task.status === TaskStatus.COMPLETED || !task.reminder || task.reminder.type === 'none') return;
        const history = task.remindedHistory || [];
        let triggered = false;
        let triggeredKey = '';

        if (task.reminder.type === 'custom' && task.reminder.date) {
          if (now >= new Date(task.reminder.date) && !history.includes('custom_fired')) {
            triggered = true; triggeredKey = 'custom_fired';
          }
        } else if (task.reminder.type === '1_day' || task.reminder.type === '3_days') {
          const days = task.reminder.type === '1_day' ? 1 : 3;
          const triggerDate = new Date(addDays(new Date(task.endDate), -days).setHours(0, 0, 0, 0));
          const key = `${todayStr}_${task.reminder.type}`;
          if (now >= triggerDate && !history.includes(key)) {
            triggered = true; triggeredKey = key;
          }
        }

        if (triggered) {
          foundAlerts.push(task);
          updatedTaskIds.push({ id: task.id, history: [...history, triggeredKey] });
          if (Notification.permission === 'granted') {
            new Notification(`🎀 Melody 提醒：${task.title}`, { body: `任務時間到囉！🍰`, icon: '/vite.svg' });
          }
        }
      });

      if (foundAlerts.length > 0) {
        setActiveReminders(prev => [...prev, ...foundAlerts]);
        updatedTaskIds.forEach(item => {
          const updater = (list: Project[]): Project[] => list.map(p => {
            const idx = p.tasks.findIndex(t => t.id === item.id);
            if (idx !== -1) {
              const ts = [...p.tasks];
              ts[idx] = { ...ts[idx], remindedHistory: item.history };
              return { ...p, tasks: ts };
            }
            return { ...p, children: updater(p.children) };
          });
          const next = updater(state.projects);
          dispatch({ type: 'UPDATE_PROJECTS', projects: next });
        });
      }
    };
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [aggregatedTasks, state.projects]);

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      if (p.id === id) return { ...p, ...updates };
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const deleteProject = (id: string) => {
    if (!confirm('😱 確定要刪除整個計畫嗎？🍭')) return;
    const remover = (list: Project[]): Project[] => list.filter(p => p.id !== id).map(p => ({ ...p, children: remover(p.children) }));
    const next = remover(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate(next.length > 0 ? `/project/${next[0].id}/dashboard` : '/');
  };

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
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: '新任務 🎀', description: '',
      startDate: new Date().toISOString(), endDate: addDays(new Date(), 2).toISOString(),
      progress: 0, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM,
      color: COLORS.taskColors[0], remindedHistory: []
    };
    updateProject(currentProject.id, { tasks: [...currentProject.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };

  const handleLogin = async () => { if (isConfigured && auth) await signInWithPopup(auth, googleProvider); };

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
        onAddProject={(parentId) => {
          const newP: Project = { id: Math.random().toString(36).substr(2, 9), name: '新計畫 🎀', parentId, notes: '', precautions: [], tasks: [], children: [], logoUrl: '📁' };
          let next: Project[];
          if (!parentId) next = [...state.projects, newP];
          else { const updater = (list: Project[]): Project[] => list.map(p => p.id === parentId ? { ...p, children: [...p.children, newP] } : { ...p, children: updater(p.children) }); next = updater(state.projects); }
          dispatch({ type: 'UPDATE_PROJECTS', projects: next }); syncToCloud(next); navigate(`/project/${newP.id}/dashboard`);
        }}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-6 group">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white dark:bg-kuromi-card rounded-xl border border-pink-100 dark:border-gray-700 shadow-sm"><Menu size={24} /></button>
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-kuromi-card rounded-[32px] flex items-center justify-center text-4xl shadow-inner border-2 border-pink-100 dark:border-gray-600 overflow-hidden cursor-pointer" onClick={() => { const res = prompt('Emoji?', currentProject.logoUrl); if (res) updateProject(currentProject.id, { logoUrl: res }); }}>{currentProject.logoUrl}</div>
            <input value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} className="text-3xl md:text-4xl font-black text-pink-600 dark:text-kuromi-text bg-transparent border-none focus:outline-none" />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="p-2.5 bg-white dark:bg-kuromi-card text-pink-400 rounded-xl border border-pink-50 dark:border-gray-700 shadow-sm transition-all hover:bg-pink-50"><Search size={20} /></button>
            
            {!state.user ? (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-md text-blue-500 hover:bg-blue-50 transition-all"><LogIn size={18} /> 登入</button>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 dark:bg-kuromi-card p-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={state.user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200 shadow-sm" />
                <button onClick={() => auth && signOut(auth)} className="text-[10px] font-bold text-pink-300">登出</button>
              </div>
            )}

            {/* 🍓 垃圾桶按鈕顏色調整為 #ff85b2 */}
            <button 
              onClick={() => deleteProject(currentProject.id)} 
              className="p-2.5 bg-white dark:bg-kuromi-card text-[#ff85b2] hover:bg-pink-50 rounded-xl border border-pink-50 shadow-sm transition-all" 
              title="刪除計畫"
            >
              <Trash2 size={20} />
            </button>
            
            <button onClick={() => addTask()} className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2 rounded-2xl font-bold shadow-md hover:bg-pink-600 transition-all active:scale-95"><Plus size={16} /> 建立計畫</button>
          </div>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {['dashboard', 'kanban', 'gantt', 'calendar', 'notes'].map(v => (
            <button key={v} onClick={() => navigate(`/project/${currentProject.id}/${v}`)} className={`px-8 py-3 rounded-[20px] font-bold transition-all ${activeView === v ? 'bg-pink-500 text-white shadow-xl' : 'text-pink-300 bg-white/50 dark:bg-white/5'}`}>{v === 'dashboard' ? '總覽' : v === 'kanban' ? '看板' : v === 'gantt' ? '甘特圖' : v === 'calendar' ? '日期表' : '設定'}</button>
          ))}
        </div>

        <div className="space-y-12 pb-20">
          {activeView === 'dashboard' ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={aggregatedTasks} />
                <ProjectPrecautions precautions={currentProject.precautions || []} onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} onColorChange={(color) => updateProject(currentProject.id, { precautionsColor: color })} />
              </div>
              <GanttChart tasks={aggregatedTasks} onTaskClick={setEditingTaskId} />
              <div className="bg-white dark:bg-kuromi-card rounded-[40px] p-8 cute-shadow border border-pink-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-pink-600 mb-8 flex items-center gap-3"><Check size={20} /> 任務清單</h3>
                <div className="space-y-4">
                  {aggregatedTasks.map(task => (
                    <div key={task.id} onClick={() => setEditingTaskId(task.id)} className="flex items-center gap-4 p-5 rounded-3xl bg-pink-50/20 dark:bg-white/5 border border-pink-50 dark:border-gray-800 hover:bg-white dark:hover:bg-white/10 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing group">
                      <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${task.status === TaskStatus.COMPLETED ? 'bg-pink-400 border-pink-400 text-white' : 'bg-white dark:bg-transparent border-pink-200'}`} onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED, progress: task.status === TaskStatus.COMPLETED ? 0 : 100 }); }}>{task.status === TaskStatus.COMPLETED && <Check size={16} strokeWidth={4} />}</div>
                      <div className="flex-1 truncate font-bold text-[#5c4b51] dark:text-gray-200">{task.title}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-pink-500">{task.progress}%</span>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('刪除?')) updateProject(currentProject.id, { tasks: currentProject.tasks.filter(t => t.id !== task.id) }); }} className="p-2 text-pink-200 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CalendarView tasks={aggregatedTasks} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 h-full">
              {activeView === 'kanban' && <KanbanBoard tasks={aggregatedTasks} onTaskUpdate={updateTask} onTaskClick={setEditingTaskId} />}
              {activeView === 'gantt' && <GanttChart tasks={aggregatedTasks} onTaskClick={setEditingTaskId} />}
              {activeView === 'calendar' && <CalendarView tasks={aggregatedTasks} />}
              {activeView === 'notes' && <NotesArea notes={currentProject.notes} onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })} onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })} onUpdateAttachments={(files) => updateProject(currentProject.id, { attachments: files })} />}
            </div>
          )}
        </div>
      </main>

      {isSearchOpen && <SearchPalette projects={state.projects} onClose={() => setIsSearchOpen(false)} onSelect={(id) => { navigate(`/project/${id}/dashboard`); setIsSearchOpen(false); }} />}
      {editingTaskId && aggregatedTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal 
          task={aggregatedTasks.find(t => t.id === editingTaskId)!} allProjects={state.projects}
          onClose={() => setEditingTaskId(null)} onUpdate={(up) => updateTask(editingTaskId, up)}
        />
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
