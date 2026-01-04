
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types.ts';
import { Link, CheckSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanTaskCardProps {
  task: Task;
  onClick?: () => void;
  isOverlay?: boolean;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, onClick, isOverlay = false }) => {
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
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="w-full h-[120px] bg-pink-100/30 dark:bg-gray-800/50 border-2 border-dashed border-pink-200 dark:border-gray-600 rounded-3xl opacity-50"
      />
    );
  }

  const hasSubtasks = task.subtasksTotal && task.subtasksTotal > 0;
  const subtaskProgress = hasSubtasks ? (task.subtasksCompleted || 0) / task.subtasksTotal! : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white dark:bg-kuromi-card p-5 rounded-3xl border border-pink-50 dark:border-gray-700 
        hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group select-none
        ${isOverlay ? 'shadow-2xl opacity-90 border-pink-300 ring-2 ring-pink-200' : 'shadow-sm'}
      `}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-[#5c4b51] dark:text-gray-200 text-sm leading-tight group-hover:text-pink-500 transition-colors">
            {task.title}
          </h4>
          <div className="flex gap-1">
            {(task.dependencies && task.dependencies.length > 0) && (
              <Link size={14} className="text-blue-400 opacity-70" title="有前置任務連結" />
            )}
          </div>
        </div>

        {/* 子任務進度 */}
        {hasSubtasks && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black text-pink-300 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <CheckSquare size={10} /> {task.subtasksCompleted}/{task.subtasksTotal} 子任務
              </span>
              <span>{Math.round(subtaskProgress * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-pink-50 dark:bg-gray-800 rounded-full overflow-hidden border border-white dark:border-gray-700">
              <div 
                className="h-full bg-pink-400 dark:bg-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${subtaskProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {task.tags?.map(tag => (
            <span 
              key={tag.name} 
              className="text-[9px] px-2 py-0.5 rounded-full font-bold text-[#5c4b51] opacity-80"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-pink-50/50 dark:border-gray-800/50 mt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-200 dark:text-gray-500">
            <Clock size={10} />
            {format(new Date(task.endDate), 'MM/dd')}
          </div>
          <div 
            className="w-2.5 h-2.5 rounded-full shadow-sm" 
            style={{ backgroundColor: task.color }}
          />
        </div>
      </div>
    </div>
  );
};
