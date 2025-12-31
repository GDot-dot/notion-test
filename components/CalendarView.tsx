
import React, { useState } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameMonth, isToday, endOfWeek, addMonths, addYears } from 'date-fns';
// Import zhTW from subpath as barrel import from date-fns/locale was reported missing
import { zhTW } from 'date-fns/locale/zh-TW';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  // Replace startOfMonth and startOfWeek with native Date logic as they were reported as missing exports
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = endOfMonth(viewDate);
  
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  // Replace subMonths with addMonths negative value as subMonths was reported as missing export
  const prevMonth = () => setViewDate(addMonths(viewDate, -1));
  const nextYear = () => setViewDate(addYears(viewDate, 1));
  // Replace subYears with addYears negative value as subYears was reported as missing export
  const prevYear = () => setViewDate(addYears(viewDate, -1));

  // 簡單的亮度檢查函數，決定文字該用黑色還是白色
  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#5c4b51' : 'white';
  };

  return (
    <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-pink-600 flex items-center gap-2">
          <span className="text-2xl">📅</span> 日期表
        </h2>
        
        <div className="flex items-center gap-2 bg-pink-50/50 p-1 rounded-2xl">
          <button onClick={prevYear} className="p-2 hover:bg-white rounded-xl text-pink-300 transition-colors" title="上一年">
            <ChevronsLeft size={18} />
          </button>
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl text-pink-300 transition-colors" title="上一月">
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 font-bold text-pink-500 min-w-[140px] text-center">
            {format(viewDate, 'yyyy年 MMMM', { locale: zhTW })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl text-pink-300 transition-colors" title="下一月">
            <ChevronRight size={18} />
          </button>
          <button onClick={nextYear} className="p-2 hover:bg-white rounded-xl text-pink-300 transition-colors" title="下一年">
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-pink-50 rounded-3xl overflow-hidden border-r border-b shadow-inner">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="p-3 text-center text-xs font-bold text-pink-400 border-r border-b border-pink-50 bg-pink-50/20">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const dayTasks = tasks.filter(t => {
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            const d = new Date(day);
            d.setHours(0,0,0,0);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            return d >= start && d <= end;
          });

          return (
            <div 
              key={idx} 
              className={`min-h-[120px] p-2 border-r border-b border-pink-50 transition-colors hover:bg-pink-50/10 ${!isSameMonth(day, monthStart) ? 'opacity-30 bg-gray-50/50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center h-8 mb-1">
                <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all ${isToday(day) ? 'bg-pink-500 text-white shadow-sm' : 'text-[#5c4b51]'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="text-[10px] p-1.5 rounded-lg font-bold truncate shadow-sm leading-tight border border-white/50 block w-full text-left"
                    style={{ 
                      backgroundColor: task.color,
                      color: getContrastYIQ(task.color)
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
