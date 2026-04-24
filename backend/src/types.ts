export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  /** optional extras from create form */
  tags?: string[];
  dueDate?: string | null;
  estimateHours?: number;
  isFavorite?: boolean;
}

export type CreateTaskBody = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  dueDate?: string | null;
  estimateHours?: number;
  isFavorite?: boolean;
};
