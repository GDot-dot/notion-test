
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../types.ts';
import { KanbanTaskCard } from './KanbanTaskCard.tsx';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col w-[300px] md:w-[350px] flex-shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-black text-pink-600 dark:text-kuromi-accent flex items-center gap-2">
          {title}
          <span className="bg-pink-100 dark:bg-gray-700 text-pink-500 px-2 py-0.5 rounded-lg text-xs">
            {tasks.length}
          </span>
        </h3>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 bg-pink-50/30 dark:bg-black/20 rounded-[32px] p-4 border border-pink-100/50 dark:border-gray-800 space-y-4 min-h-[500px]"
      >
        {/* 🍓 Fix: Passing children explicitly as a prop to SortableContext to satisfy strict type checking in some environments where JSX children are not correctly mapped to the 'children' prop. */}
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
          children={
            <React.Fragment>
              {tasks.map(task => (
                <KanbanTaskCard 
                  key={task.id} 
                  task={task} 
                  onClick={() => onTaskClick?.(task.id)} 
                />
              ))}
              {tasks.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-pink-100 dark:border-gray-700 rounded-2xl flex items-center justify-center text-pink-200 dark:text-gray-600 text-xs font-bold italic">
                  拖曳任務到此 🍰
                </div>
              ) : null}
            </React.Fragment>
          }
        />
      </div>
    </div>
  );
};
