
import React from 'react';
import { format, eachDayOfInterval, addDays, differenceInDays } from 'date-fns';
import { Task } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface GanttChartProps {
  tasks: Task[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-white rounded-[32px] md:rounded-[40px] border-2 border-dashed border-pink-200 text-pink-300">
        <p>目前沒有排程任務 🍰</p>
      </div>
    );
  }

  const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
  const minTime = Math.min(...allDates.map(d => d.getTime()));
  const maxTime = Math.max(...allDates.map(d => d.getTime()));
  
  const rangeStart = new Date(minTime);
  rangeStart.setHours(0, 0, 0, 0);
  
  const rangeEnd = addDays(new Date(maxTime), 14);
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const headerDays = allDays.filter((_, i) => i % 5 === 0);

  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-4 md:p-8 overflow-hidden">
      <h2 className="text-lg md:text-xl font-bold text-pink-600 mb-6 md:border-none border-b border-pink-50 pb-4 md:pb-0 flex items-center gap-2">
        <span className="text-xl md:text-2xl">❤️</span> 專案開發甘特圖
      </h2>
      
      <div className="overflow-x-auto custom-scrollbar no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[800px]">
          {/* 表頭 */}
          <div className="flex mb-4 relative h-8 border-b border-pink-50">
            <div className="w-32 md:w-48 flex-shrink-0 font-bold text-pink-400 text-xs md:text-sm pl-2">任務名稱</div>
            <div className="flex-1 relative">
              {headerDays.map((day, idx) => {
                const leftPos = differenceInDays(day, rangeStart) * 35;
                return (
                  <div key={idx} className="absolute text-[10px] md:text-[11px] font-bold text-pink-300" style={{ left: `${leftPos}px` }}>
                    {format(day, 'MM/dd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 任務行 */}
          <div className="space-y-6 md:space-y-8">
            {tasks.map((task) => {
              const start = new Date(task.startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(task.endDate);
              end.setHours(0, 0, 0, 0);
              
              const left = differenceInDays(start, rangeStart) * 35;
              const width = Math.max((differenceInDays(end, start) + 1) * 35, 40);
              const duration = differenceInDays(end, start) + 1;

              // 根據優先度獲取顏色
              const priorityColor = COLORS.priority[task.priority] || '#f3f4f6';
              // 🍓 修正：使用任務本身的顏色作為進度條顏色，若無則用優先級顏色，並加深一點以突顯
              const barColor = task.color || priorityColor;

              return (
                <div key={task.id} className="flex group items-center">
                  <div className="w-32 md:w-48 flex-shrink-0">
                    <div className="text-xs md:text-sm font-bold text-[#5c4b51] truncate pr-2">{task.title}</div>
                    <div className="text-[9px] md:text-[10px] text-pink-300 font-bold">{task.progress}% 完成</div>
                  </div>
                  <div className="flex-1 relative h-6 md:h-8">
                    {/* 進度條背景軌道 (半透明) */}
                    <div 
                      className="absolute top-0 h-5 md:h-6 rounded-full transition-transform group-hover:scale-[1.01] cursor-pointer flex items-center justify-end pr-2 md:pr-3 overflow-hidden border border-white shadow-sm"
                      style={{ 
                        left: `${left}px`, 
                        width: `${width}px`,
                        backgroundColor: priorityColor,
                        opacity: 0.3, // 🍓 關鍵修正：讓軌道變淡
                      }}
                    />
                    
                    {/* 實體進度條 (前景) */}
                    <div 
                      className="absolute top-0 h-5 md:h-6 rounded-full transition-all duration-300 pointer-events-none z-10 flex items-center overflow-hidden"
                      style={{
                        left: `${left}px`,
                        width: `${Math.max((width * task.progress) / 100, 12)}px`, // 確保至少有一點點寬度可見
                        backgroundColor: barColor,
                        filter: 'saturate(1.2) brightness(0.95)', // 🍓 讓顏色稍微飽和一點，突出顯示
                        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                      }}
                    >
                       {/* 只有當進度大於 20% 才顯示文字，避免擠壓 */}
                       {task.progress > 20 && (
                          <span className="ml-2 text-[9px] font-black text-white/90 drop-shadow-md whitespace-nowrap">
                            {task.progress}%
                          </span>
                       )}
                    </div>
                    
                    {/* 天數標記 (浮在最上面) */}
                    <div 
                        className="absolute top-0 h-5 md:h-6 flex items-center justify-end pr-2 pointer-events-none z-20"
                        style={{ 
                            left: `${left}px`, 
                            width: `${width}px`,
                        }}
                    >
                        <span className="text-[9px] font-bold text-[#5c4b51] opacity-60">{duration}天</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
