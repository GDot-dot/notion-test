
export enum TaskStatus {
  TODO = '待處理',
  IN_PROGRESS = '進行中',
  COMPLETED = '已完成'
}

export enum TaskPriority {
  LOW = '低',
  MEDIUM = '中',
  HIGH = '高'
}

export type ResourceCategory = 'document' | 'image' | 'design' | 'link' | 'video';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  category: ResourceCategory;
  createdAt: string;
}

// 🍓 新增標籤介面
export interface TaskTag {
  name: string;
  color: string;
}

// ⏰ 新增提醒設定型別
export type ReminderType = 'none' | '1_day' | '3_days' | 'custom';

export interface TaskReminder {
  type: ReminderType;
  date?: string; // ISO string for custom time
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  color: string;
  tags?: TaskTag[]; 
  relatedProjectId?: string;
  attachments?: Attachment[];
  reminder?: TaskReminder; // 新增提醒欄位
  // 🍓 看板功能增強欄位
  subtasksTotal?: number;
  subtasksCompleted?: number;
  dependencies?: string[]; // 前置任務 ID 列表
}

export interface Project {
  id: string;
  name: string;
  logoUrl?: string;
  notes: string;
  precautions: string[];
  precautionsColor?: string;
  tasks: Task[];
  children: Project[];
  parentId: string | null;
  lastAccessedAt?: string;
  attachments?: Attachment[];
}

export type ViewType = 'dashboard' | 'kanban' | 'gantt' | 'calendar' | 'notes';
