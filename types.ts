
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
  tags?: TaskTag[]; // 修改這裡：從 string[] 改為 TaskTag[]
  relatedProjectId?: string;
  attachments?: Attachment[];
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

export type ViewType = 'dashboard' | 'gantt' | 'calendar' | 'notes';
