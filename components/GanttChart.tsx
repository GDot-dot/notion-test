
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

  // 1. 找出所有任務中最早的開始時間和最晚的結束時間
  const allStartDates = tasks.map(t => new Date(t.startDate).getTime());
  const allEndDates = tasks.map(t => new Date(t.endDate).getTime());
  
  const minTime = Math.min(...allStartDates);
  const maxTime = Math.max(...allEndDates);
  
  // 2. 設定顯示範圍：最早日期前推 1 天，最晚日期後推 2 天 (留一點呼吸空間)
  const rangeStart = addDays(new Date(minTime), -1);
  rangeStart.setHours(0, 0, 0, 0);
  
  const rangeEnd = addDays(new Date(maxTime), 2);
  rangeEnd.setHours(0, 0, 0, 0);

  // 產生日期陣列
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  // 每 3 天顯示一次日期標籤，避免太擁擠
  const headerDays = allDays.filter((_, i) => i % 3 === 0);

  // 每個格子的寬度
  const CELL_WIDTH = 40; 

  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-4 md:p-8 overflow-hidden cute-shadow border border-pink-100">
      <h2 className="text-lg md:text-xl font-bold text-pink-600 mb-6 md:border-none border-b border-pink-50 pb-4 md:pb-0 flex items-center gap-2">
        <span className="text-xl md:text-2xl">❤️</span> 專案開發甘特圖
      </h2>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
        {/* 動態計算容器寬度，確保不會被切掉 */}
        <div style={{ minWidth: `${allDays.length * CELL_WIDTH + 200}px` }}>
          {/* 表頭 */}
          <div className="flex mb-4 relative h-8 border-b border-pink-50">
            <div className="w-32 md:w-48 flex-shrink-0 font-bold text-pink-400 text-xs md:text-sm pl-2 sticky left-0 bg-white z-20">任務名稱</div>
            <div className="flex-1 relative">
              {headerDays.map((day, idx) => {
                const leftPos = differenceInDays(day, rangeStart) * CELL_WIDTH;
                return (
                  <div key={idx} className="absolute text-[10px] md:text-[11px] font-bold text-pink-300 transform -translate-x-1/2" style={{ left: `${leftPos + (CELL_WIDTH/2)}px` }}>
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
              
              const left = differenceInDays(start, rangeStart) * CELL_WIDTH;
              const daysDiff = differenceInDays(end, start) + 1;
              const width = Math.max(daysDiff * CELL_WIDTH, CELL_WIDTH); // 至少顯示一格寬

              // 根據優先度獲取顏色
              const priorityColor = COLORS.priority[task.priority] || '#f3f4f6';
              // 使用任務本身的顏色作為進度條顏色，若無則用優先級顏色
              const barColor = task.color || priorityColor;

              return (
                <div key={task.id} className="flex group items-center hover:bg-pink-50/30 rounded-xl transition-colors">
                  <div className="w-32 md:w-48 flex-shrink-0 sticky left-0 bg-white group-hover:bg-pink-50/10 z-20 pr-2">
                    <div className="text-xs md:text-sm font-bold text-[#5c4b51] truncate" title={task.title}>{task.title}</div>
                    <div className="text-[9px] md:text-[10px] text-pink-300 font-bold">{task.progress}% 完成</div>
                  </div>
                  <div className="flex-1Hx relative h-6 md:h-8">
                    {/* 進度條背景軌道 */}
                    <div 
                      className="absolute top-1 h-4 md:h-6 rounded-full transition-transform group-hover:scale-[1.01] cursor-pointer flex items-center justify-end pr-2 md:pr-3 overflow-hidden border border-white shadow-sm"
                      style={{ 
                        left: `${left}px`, 
                        width: `${width}px`,
                        backgroundColor: priorityColor,
                        opacity: 0.3, 
                      }}
                    />
                    
                    {/* 實體進度條 (前景) */}
                    <div 
                      className="absolute top-1 h-4 md:h-6 rounded-full transition-all duration-300 pointer-events-none z-10 flex items-center overflow-hidden"
                      style={{
                        left: `${left}px`,
                        width: `${Math.max((width * task.progress) / 100, 12)}px`,
                        backgroundColor: barColor,
                        filter: 'saturate(1.2) brightness(0.95)',
                        boxShadow: '1px 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                       {task.progress > 30 && (
                          <span className="ml-2 text-[8px] font-black text-white/90 drop-shadow-md whitespace-nowrap">
                            {task.progress}%
                          </span>
                       )}
                    </div>
                    
                    {/* 天數標記 (浮在最上面) */}
                    <div 
                        className="absolute top-1 h-4 md:h-6 flex items-center justify-end pr-2 pointer-events-none z-10"
                        style={{ 
                            left: `${left}px`, 
                            width: `${width}px`,
                        }}
                    >
                        <span className="text-[8px] font-bold text-[#5c4b51] opacity-50 hidden sm:inline-block">{daysDiff}天</span>
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
