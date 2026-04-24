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
  tags?: string[];
  dueDate?: string | null;
  estimateHours?: number;
  isFavorite?: boolean;
}
