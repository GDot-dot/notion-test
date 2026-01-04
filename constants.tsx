import { TaskPriority, TaskStatus, Project, KanbanColumn } from './types.ts';

export const COLORS = {
  primary: '#ff85b2',
  secondary: '#ffdeeb',
  accent: '#fff5f8',
  text: '#5c4b51',
  taskColors: [
    '#ffb8d1', // 粉
    '#b8e1ff', // 藍
    '#d1ffb8', // 綠
    '#fff7b8', // 黃
    '#e1b8ff', // 紫
  ],
  stickyNotes: [
    '#fff9c4', // 經典黃
    '#ffecf2', // 柔嫩粉
    '#e3f2fd', // 晴空藍
    '#f1f8e9', // 抹茶綠
    '#f3e5f5', // 薰衣草紫
  ],
  priority: {
    [TaskPriority.LOW]: '#e1f5fe',    
    [TaskPriority.MEDIUM]: '#fff9c4', 
    [TaskPriority.HIGH]: '#ffebee'    
  },
  status: {
    [TaskStatus.TODO]: '#ffcdd2',        
    [TaskStatus.IN_PROGRESS]: '#ffe0b2',  
    [TaskStatus.COMPLETED]: '#c8e6c9'     
  }
};

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: '待處理 🎀', icon: '☁️', color: '#ffcdd2' },
  { id: 'doing', title: '全力衝刺 🍓', icon: '⚡', color: '#ffe0b2' },
  { id: 'done', title: '大功告成 🎉', icon: '✨', color: '#c8e6c9' }
];

export const TAG_PALETTE = [
  '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', 
  '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', 
  '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', 
  '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC'
];

export const getTagColor = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
};

const MARKDOWN_EXAMPLE = `# 🍓 歡迎來到您的 Melody 空間！

這是一個強大的筆記區域，支援完整的 **Markdown** 語法。您可以嘗試以下功能：

### 🎀 基礎樣式
- **粗體文字** 與 *斜體文字*
- ~~刪除線效果~~
- [外部連結 (例如 Google)](https://google.com)

### 🍭 任務清單
- [x] 完成專案初始設定
- [ ] 邀請團隊成員
- [ ] 買一塊草莓蛋糕犒賞自己

### 🍰 資訊表格
| 項目 | 進度 | 負責人 |
| :--- | :---: | :--- |
| UI 設計 | 100% | Melody |
| API 串接 | 40% | Kero |
| 測試發佈 | 0% | Kuromi |

### 🖼️ 圖片嵌入
![Melody](https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=200)

> **小叮嚀**：點擊右上方「編輯」按鈕即可開始修改這份筆記喔！✨
`;

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'root-1',
    name: '我的夢想計畫 🎀',
    parentId: null,
    notes: MARKDOWN_EXAMPLE,
    logoUrl: '🍓', 
    precautions: ['記得要在圖表上放可愛的 Logo 喔！✨', '使用粉嫩色系（粉紅、粉藍、粉黃）。'],
    precautionsColor: '#fff9c4',
    kanbanColumns: DEFAULT_KANBAN_COLUMNS,
    tasks: [
      {
        id: 'task-1',
        title: '歡迎使用 Melody 管理工具',
        description: '這是一個示範任務，您可以點擊它查看詳細內容。',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        progress: 30,
        status: 'todo',
        priority: TaskPriority.MEDIUM,
        color: '#ffb8d1',
        tags: [
          { name: '入門', color: '#FFCDD2' },
          { name: '教學', color: '#B3E5FC' }
        ]
      }
    ],
    children: [
      {
        id: 'child-1',
        name: '子專案範例 ✨',
        parentId: 'root-1',
        notes: '這是子專案的筆記空間。',
        logoUrl: '📁',
        precautions: [],
        precautionsColor: '#ffecf2',
        kanbanColumns: DEFAULT_KANBAN_COLUMNS,
        tasks: [],
        children: []
      }
    ]
  }
];