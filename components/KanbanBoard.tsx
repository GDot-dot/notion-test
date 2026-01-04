
import React, { useMemo, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '../types.ts';
import { KanbanColumn } from './KanbanColumn.tsx';
import { KanbanTaskCard } from './KanbanTaskCard.tsx';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (taskId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskUpdate, onTaskClick }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(() => [
    { id: TaskStatus.TODO, title: '待處理 🍓', tasks: tasks.filter(t => t.status === TaskStatus.TODO) },
    { id: TaskStatus.IN_PROGRESS, title: '進行中 🍬', tasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS) },
    { id: TaskStatus.COMPLETED, title: '已完成 ✨', tasks: tasks.filter(t => t.status === TaskStatus.COMPLETED) },
  ], [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // 處理跨欄位的邏輯在 DragEnd 中統一處理狀態更新
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 判斷是否移動到了不同的欄位
    const activeTaskObj = tasks.find(t => t.id === activeId);
    if (!activeTaskObj) return;

    // 判斷 over 是不是欄位 ID
    const isOverColumn = Object.values(TaskStatus).includes(overId as TaskStatus);
    
    if (isOverColumn && activeTaskObj.status !== overId) {
      onTaskUpdate(activeId, { status: overId as TaskStatus });
      return;
    }

    // 如果 over 是另一個任務，則取該任務的 status
    const overTaskObj = tasks.find(t => t.id === overId);
    if (overTaskObj && activeTaskObj.status !== overTaskObj.status) {
      onTaskUpdate(activeId, { status: overTaskObj.status });
    }
  };

  return (
    <div className="flex gap-6 h-full min-h-[600px] overflow-x-auto pb-6 no-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 w-full">
          {columns.map(col => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              tasks={col.tasks} 
              onTaskClick={onTaskClick}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <div className="w-[300px] rotate-3 scale-105 pointer-events-none">
              <KanbanTaskCard task={activeTask} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
