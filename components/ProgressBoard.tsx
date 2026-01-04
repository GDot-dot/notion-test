
import React, { useMemo, useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, KanbanColumn } from '../types.ts';
import { COLORS } from '../constants.tsx';
import { BarChart3, GripVertical, CheckCircle, Clock, Link as LinkIcon, Layers, Settings2, Plus, Trash2, Edit2 } from 'lucide-react';

interface ProgressBoardProps {
  tasks: Task[];
  columns: KanbanColumn[];
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onColumnsUpdate?: (newColumns: KanbanColumn[]) => void;
  onTaskClick?: (taskId: string) => void;
}

// 🍓 任務卡片組件
// Fix: Use React.FC to properly handle key and other standard React props in TypeScript
const SortableTaskCard: React.FC<{ task: Task, onClick?: (id: string) => void }> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id, data: { task, type: 'task' } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedSubtasks = task.subtasks?.filter(st => st.status.includes('done') || st.progress === 100).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-[#2a2428] p-4 rounded-2xl border border-pink-50 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group relative cursor-pointer active:cursor-grabbing`}
      onClick={() => onClick?.(task.id)}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="mt-1 text-pink-200 dark:text-gray-600 hover:text-pink-400 dark:hover:text-pink-300 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-[#5c4b51] dark:text-gray-200 truncate mb-1" title={task.title}>{task.title}</h4>
          
          <div className="flex flex-wrap gap-1 mb-3">
             <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.priority[task.priority], color: '#5c4b51' }}>
                {task.priority}
             </span>
             {task.dependencies && task.dependencies.length > 0 && (
               <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                 <LinkIcon size={8} /> 關聯
               </span>
             )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-pink-300 dark:text-gray-500">
              <span className="flex items-center gap-1">
                {task.progress === 100 ? <CheckCircle size={10} className="text-green-400" /> : <Clock size={10} />}
                {task.progress}%
              </span>
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-1">
                  <Layers size={10} /> {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
            <div className="h-1.5 w-full bg-pink-50 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-pink-400 transition-all duration-500" style={{ width: `${task.progress}%`, backgroundColor: task.color }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🍓 看板欄位組件
// Fix: Use React.FC to properly handle key and other standard React props in TypeScript
const SortableKanbanColumn: React.FC<{ 
  column: KanbanColumn, 
  tasks: Task[], 
  onTaskClick?: (id: string) => void,
  isEditing: boolean,
  onEdit: () => void,
  onDelete: () => void
}> = ({ column, tasks, onTaskClick, isEditing, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: { column, type: 'column' }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex flex-col min-w-[300px] flex-1 bg-pink-50/20 dark:bg-white/5 rounded-3xl border border-pink-50/50 dark:border-gray-800 p-4 h-full min-h-[500px] ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 group/title">
           <div {...(isEditing ? { ...attributes, ...listeners } : {})} className={isEditing ? 'cursor-grab active:cursor-grabbing' : ''}>
              <span className="text-xl">{column.icon}</span>
           </div>
           <h3 className="font-black text-[#5c4b51] dark:text-gray-200 tracking-tight">{column.title}</h3>
           <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-lg text-[10px] font-bold text-pink-300 dark:text-gray-500 shadow-sm border border-pink-100 dark:border-gray-600">
             {tasks.length}
           </span>
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-blue-400 transition-all"><Edit2 size={14}/></button>
            <button onClick={onDelete} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-red-400 transition-all"><Trash2 size={14}/></button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 custom-scrollbar">
        {/* Fix: SortableContext might have type issues in React 18 due to implicit children removal. We cast to any to ensure compilation. */}
        {(SortableContext as any) && (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
            {tasks.length === 0 && (
              <div className="h-24 border-2 border-dashed border-pink-100 dark:border-gray-700 rounded-2xl flex items-center justify-center text-[10px] font-bold text-pink-200 dark:text-gray-600">
                拖曳任務至此 🍰
              </div>
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ tasks, columns, onTaskUpdate, onColumnsUpdate, onTaskClick }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    } else if (active.data.current?.type === 'column') {
      setActiveColumn(active.data.current.column);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    // 處理欄位排序
    if (active.data.current?.type === 'column' && active.id !== over.id) {
      const oldIndex = columns.findIndex(c => c.id === active.id);
      const newIndex = columns.findIndex(c => c.id === over.id);
      onColumnsUpdate?.(arrayMove(columns, oldIndex, newIndex));
      return;
    }

    // 處理任務移動
    if (active.data.current?.type === 'task') {
      const taskId = active.id as string;
      const overId = over.id as string;
      
      let targetStatus: string | null = null;
      
      // 判斷是 drop 在欄位還是另一個卡片上
      const overColumn = columns.find(c => c.id === overId);
      if (overColumn) {
        targetStatus = overColumn.id;
      } else {
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) targetStatus = overTask.status;
      }

      if (targetStatus && onTaskUpdate) {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== targetStatus) {
          onTaskUpdate(taskId, { 
            status: targetStatus,
            progress: targetStatus.includes('done') ? 100 : task.progress
          });
        }
      }
    }
  };

  const addColumn = () => {
    const title = prompt('🍓 欄位名稱 (例如: 測試中)');
    if (!title) return;
    const icon = prompt('🍭 欄位圖示 (Emoji)', '💡') || '💡';
    const newCol: KanbanColumn = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      icon,
      color: '#ffdeeb'
    };
    onColumnsUpdate?.([...columns, newCol]);
  };

  const editColumn = (col: KanbanColumn) => {
    const newTitle = prompt('修改欄位名稱', col.title);
    if (newTitle === null) return;
    const newIcon = prompt('修改欄位圖示', col.icon);
    if (newIcon === null) return;
    onColumnsUpdate?.(columns.map(c => c.id === col.id ? { ...c, title: newTitle, icon: newIcon } : c));
  };

  const deleteColumn = (colId: string) => {
    if (!confirm('確定要刪除這個欄位嗎？此欄位中的任務將會保留在系統中但不會顯示在此看板。')) return;
    onColumnsUpdate?.(columns.filter(c => c.id !== colId));
  };

  return (
    <div className="bg-white dark:bg-kuromi-card rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all">
      <div className="w-full flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-pink-600 dark:text-kuromi-accent flex items-center gap-3">
          <span className="p-2 bg-pink-100 dark:bg-gray-700 rounded-xl text-pink-500 shadow-sm"><BarChart3 size={20} /></span>
          任務互動看板 (動態欄位)
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`p-2 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs ${isEditing ? 'bg-pink-500 text-white border-pink-500' : 'bg-white dark:bg-gray-800 text-pink-300 dark:text-gray-400 border-pink-100 dark:border-gray-700'}`}
          >
            <Settings2 size={16} /> {isEditing ? '儲存配置' : '編輯欄位'}
          </button>
          <button 
            onClick={addColumn}
            className="flex items-center gap-2 bg-pink-50 dark:bg-gray-700 text-pink-500 dark:text-pink-300 px-4 py-2 rounded-xl font-bold text-xs hover:bg-pink-100 dark:hover:bg-gray-600 transition-all shadow-sm"
          >
            <Plus size={16} /> 新增欄位
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max pb-4">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Fix: Use any cast for SortableContext to handle React 18 children type mismatch if necessary */}
            {(SortableContext as any) && (
              <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                {columns.map(col => (
                  <SortableKanbanColumn 
                    key={col.id} 
                    column={col} 
                    tasks={tasks.filter(t => t.status === col.id)} 
                    onTaskClick={onTaskClick}
                    isEditing={isEditing}
                    onEdit={() => editColumn(col)}
                    onDelete={() => deleteColumn(col.id)}
                  />
                ))}
              </SortableContext>
            )}
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.5' } }
              })
            }}>
              {activeTask ? <div className="scale-105 shadow-2xl rotate-2"><SortableTaskCard task={activeTask} /></div> : null}
              {activeColumn ? <div className="scale-105 shadow-2xl opacity-80"><SortableKanbanColumn column={activeColumn} tasks={tasks.filter(t => t.status === activeColumn.id)} isEditing={false} onEdit={()=>{}} onDelete={()=>{}} /></div> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
