
import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Heart, FolderHeart, Edit3, Clock } from 'lucide-react';
import { Project } from '../types.ts';

interface SidebarProps {
  projects: Project[];
  workspaceLogo: string;
  workspaceName: string;
  onUpdateWorkspace: (logo: string, name: string) => void;
  selectedProjectId: string | null;
  isOpen: boolean;
  onSelectProject: (id: string) => void;
  onAddProject: (parentId: string | null) => void;
}

const ProjectItem: React.FC<{
  project: Project;
  level: number;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (parentId: string | null) => void;
}> = ({ project, level, selectedProjectId, onSelectProject, onAddProject }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedProjectId === project.id;

  const renderLogo = (p: Project, size = 16) => {
    const url = p.logoUrl;
    if (!url || url === '📁') return <FolderHeart size={size} className={isSelected ? 'text-pink-500' : 'text-pink-300'} />;
    if (url.startsWith('http')) {
      return <img src={url} className="rounded-md object-cover shadow-sm border border-white" style={{ width: size + 4, height: size + 4 }} />;
    }
    return <span style={{ fontSize: size + 2 }}>{url}</span>;
  };

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/60 mb-1 ${isSelected ? 'bg-white shadow-md font-black translate-x-1 border-l-4 border-pink-400' : 'opacity-80'}`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={() => onSelectProject(project.id)}
      >
        <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="text-pink-300 p-0.5 hover:bg-pink-100 rounded-md">
          {project.children.length > 0 ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div className="w-3.5" />}
        </div>
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{renderLogo(project)}</div>
        <span className="truncate text-sm text-[#5c4b51]">{project.name}</span>
      </div>
      {isOpen && project.children.length > 0 && (
        <div className="flex flex-col">
          {project.children.map(child => <ProjectItem key={child.id} project={child} level={level + 1} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} onAddProject={onAddProject} />)}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ projects, workspaceLogo, workspaceName, onUpdateWorkspace, selectedProjectId, isOpen, onSelectProject, onAddProject }) => {
  
  // 🍓 計算最近存取的專案 (取前 3 個)
  const recentProjects = useMemo(() => {
    const all: Project[] = [];
    const flatten = (list: Project[]) => {
      list.forEach(p => {
        if (p.lastAccessedAt) all.push(p);
        flatten(p.children);
      });
    };
    flatten(projects);
    return all.sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime()).slice(0, 3);
  }, [projects]);

  const renderLogo = (p: Project, size = 18) => {
    const url = p.logoUrl;
    if (!url || url === '📁') return <FolderHeart size={size} className="text-pink-400" />;
    if (url.startsWith('http')) return <img src={url} className="rounded-md object-cover" style={{ width: size+2, height: size+2 }} />;
    return <span style={{ fontSize: size+2 }}>{url}</span>;
  };

  return (
    <div className={`fixed inset-y-0 left-0 w-64 sanrio-pink h-screen flex flex-col p-6 border-r sanrio-border-pink z-50 transition-transform duration-300 shadow-xl md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-pink-100 flex items-center justify-center relative overflow-hidden cursor-pointer group" onClick={() => { const res = prompt('自訂標誌 🍓', workspaceLogo); if (res) onUpdateWorkspace(res, workspaceName); }}>
            {workspaceLogo.startsWith('http') ? <img src={workspaceLogo} className="w-full h-full object-cover" /> : <span className="text-2xl">{workspaceLogo}</span>}
            <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Edit3 size={12} className="text-pink-500" /></div>
          </div>
          <div className="flex flex-col cursor-pointer group relative" onClick={() => { const res = prompt('請輸入工作空間名稱 🍭', workspaceName); if (res) onUpdateWorkspace(workspaceLogo, res); }}>
            <h1 className="font-black text-2xl text-pink-600 italic tracking-tighter transition-all group-hover:text-pink-400">{workspaceName}</h1>
          </div>
        </div>
        <button onClick={() => onAddProject(null)} className="p-2 bg-white/40 hover:bg-white rounded-xl transition-all shadow-sm border border-pink-100"><Plus size={18} className="text-pink-500" /></button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-1">
        {/* 最近存取區塊 */}
        {recentProjects.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-3 ml-3 opacity-60 flex items-center gap-2">
              <Clock size={10} /> 最近存取 / Recent
            </div>
            <div className="space-y-1">
              {recentProjects.map(p => (
                <div 
                  key={`recent-${p.id}`} 
                  onClick={() => onSelectProject(p.id)}
                  className={`flex items-center gap-2 p-2 px-3 rounded-xl cursor-pointer transition-all hover:bg-white/60 ${selectedProjectId === p.id ? 'bg-white/80 font-bold' : 'opacity-70'}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">{renderLogo(p, 14)}</div>
                  <span className="text-xs text-[#5c4b51] truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-3 ml-3 opacity-60">計畫空間 / Projects</div>
          {projects.map(project => <ProjectItem key={project.id} project={project} level={0} selectedProjectId={selectedProjectId} onSelectProject={onSelectProject} onAddProject={onAddProject} />)}
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t sanrio-border-pink text-xs text-pink-300 text-center flex flex-col items-center gap-2">
        <Heart size={14} className="fill-pink-200 text-pink-200 animate-pulse" />
        <span className="font-black tracking-widest uppercase opacity-40">Sync with Cloud</span>
      </div>
    </div>
  );
};
