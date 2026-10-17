export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done';

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  assignee: Assignee;
  dueDate: string;
  progress: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  maskVariationPreview?: 'horizontal-blinds' | 'random-grid' | 'vertical-blinds' | 'column-grid';
}

export interface ColumnDef {
  id: TaskStatus;
  title: string;
  description: string;
  accentColor: string;
}

export interface ActivityEvent {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetTask: string;
  timestamp: string;
}
