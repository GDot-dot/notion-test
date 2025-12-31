
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Task, TaskStatus } from '../types';
import { COLORS } from '../constants.tsx';
import { LayoutList, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface ProgressBoardProps {
  tasks: Task[];
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ tasks }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');

  const stats = {
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
  };

  const chartData = [
    { name: '待處理', value: stats.todo, color: COLORS.status[TaskStatus.TODO] },
    { name: '進行中', value: stats.inProgress, color: COLORS.status[TaskStatus.IN_PROGRESS] },
    { name: '已完成', value: stats.completed, color: COLORS.status[TaskStatus.COMPLETED] },
  ].filter(d => d.value > 0);

  // 計算總體完成率 (以所有任務的平均 progress 計算更精準)
  const totalTasks = tasks.length || 1;
  const overallProgress = Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks);

  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100 flex flex-col h-full min-h-[440px]">
      <div className="w-full flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-pink-600 flex items-center gap-3">
          <span className="p-2 bg-pink-100 rounded-xl text-pink-500 shadow-sm"><BarChart3 size={20} /></span>
          任務進度
        </h3>
        
        {/* 分頁切換區域 */}
        <div className="flex bg-pink-50 p-1 rounded-2xl border border-pink-100">
          <button 
            onClick={() => setViewMode('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'summary' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300 hover:text-pink-400'
            }`}
          >
            <PieIcon size={14} /> 摘要
          </button>
          <button 
            onClick={() => setViewMode('details')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              viewMode === 'details' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300 hover:text-pink-400'
            }`}
          >
            <LayoutList size={14} /> 任務清單
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full gap-8 items-center justify-center flex-1">
        {/* 左側大圓環圖 */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex-shrink-0 animate-in zoom-in duration-500">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length > 0 ? chartData : [{ name: '空', value: 1, color: '#f3f4f6' }]}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={1500}
              >
                {chartData.length > 0 ? chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm" />
                )) : <Cell fill="#f3f4f6" />}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl md:text-5xl font-black text-pink-500 drop-shadow-sm">{overallProgress}%</span>
            <span className="text-[10px] md:text-xs text-pink-300 font-bold tracking-widest uppercase mt-1">總體進度</span>
          </div>
        </div>

        {/* 右側條列式進度 */}
        <div className="flex-1 w-full flex flex-col justify-center space-y-6 overflow-y-auto max-h-[320px] pr-2 no-scrollbar">
          {viewMode === 'summary' ? (
            // 摘要模式
            [
              { label: '待處理', count: stats.todo, color: COLORS.status[TaskStatus.TODO], progress: Math.round((stats.todo / totalTasks) * 100) },
              { label: '進行中', count: stats.inProgress, color: COLORS.status[TaskStatus.IN_PROGRESS], progress: Math.round((stats.inProgress / totalTasks) * 100) },
              { label: '已完成', count: stats.completed, color: COLORS.status[TaskStatus.COMPLETED], progress: Math.round((stats.completed / totalTasks) * 100) },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2 group">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-[#5c4b51] flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-pink-400 font-black">{item.progress}%</span>
                </div>
                <div className="h-3.5 bg-pink-50 rounded-full overflow-hidden shadow-inner border border-white">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${item.progress}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))
          ) : (
            // 詳細任務清單模式
            tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="space-y-1.5 animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between text-[13px] font-bold">
                  <span className="text-[#5c4b51] truncate max-w-[200px]">{task.title}</span>
                  <span className="text-pink-400 font-black">{task.progress}%</span>
                </div>
                <div className="h-3 bg-pink-50 rounded-full overflow-hidden border border-white shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${task.progress}%`, backgroundColor: task.color || '#ffb8d1' }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-pink-200 font-bold italic">尚無個別任務進度 🍬</div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
