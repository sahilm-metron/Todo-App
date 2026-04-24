import type { CreateTaskBody, Task, TaskPriority, TaskStatus } from "./types.js";
import { getPool } from "./db.js";

interface TaskRow {
  id: string;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  priority: string;
  status: string;
  tags: string[];
  due_date: Date | null;
  estimate_hours: number | null;
  is_favorite: boolean;
}

function rowToTask(row: TaskRow): Task {
  const tags = row.tags?.length ? row.tags : undefined;
  const estimate =
    row.estimate_hours != null ? Number(row.estimate_hours) : undefined;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    tags,
    dueDate: row.due_date ? row.due_date.toISOString() : null,
    estimateHours: Number.isFinite(estimate) ? estimate : undefined,
    isFavorite: row.is_favorite,
  };
}

export async function listTasks(): Promise<Task[]> {
  const { rows } = await getPool().query<TaskRow>(
    `SELECT * FROM tasks ORDER BY created_at DESC`,
  );
  return rows.map(rowToTask);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const { rows } = await getPool().query<TaskRow>(
    `SELECT * FROM tasks WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  return row ? rowToTask(row) : undefined;
}

export async function createTask(body: CreateTaskBody): Promise<Task> {
  const { rows } = await getPool().query<TaskRow>(
    `INSERT INTO tasks (
        title, description, priority, status,
        tags, due_date, estimate_hours, is_favorite
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
    [
      body.title,
      body.description,
      body.priority,
      body.status,
      body.tags ?? [],
      body.dueDate ? new Date(body.dueDate) : null,
      body.estimateHours ?? null,
      body.isFavorite ?? false,
    ],
  );
  const row = rows[0];
  if (!row) throw new Error("Insert returned no row");
  return rowToTask(row);
}

export async function updateTask(
  id: string,
  body: CreateTaskBody,
): Promise<Task | undefined> {
  const existing = await getTask(id);
  if (!existing) return undefined;

  let completedAt: Date | null = existing.completedAt
    ? new Date(existing.completedAt)
    : null;
  if (body.status === "completed") {
    completedAt = completedAt ?? new Date();
  } else {
    completedAt = null;
  }

  const { rows } = await getPool().query<TaskRow>(
    `UPDATE tasks SET
        title = $1,
        description = $2,
        priority = $3,
        status = $4,
        tags = $5,
        due_date = $6,
        estimate_hours = $7,
        is_favorite = $8,
        completed_at = $9,
        updated_at = now()
      WHERE id = $10
      RETURNING *`,
    [
      body.title,
      body.description,
      body.priority,
      body.status,
      body.tags ?? [],
      body.dueDate ? new Date(body.dueDate) : null,
      body.estimateHours ?? null,
      body.isFavorite ?? false,
      completedAt,
      id,
    ],
  );
  const row = rows[0];
  return row ? rowToTask(row) : undefined;
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await getPool().query(`DELETE FROM tasks WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

function isPriority(v: unknown): v is TaskPriority {
  return v === "low" || v === "medium" || v === "high";
}

function isStatus(v: unknown): v is TaskStatus {
  return v === "pending" || v === "in_progress" || v === "completed";
}

export function parseCreateBody(raw: unknown): CreateTaskBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.title !== "string" || typeof o.description !== "string") return null;
  if (!isPriority(o.priority) || !isStatus(o.status)) return null;
  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === "string")
    : undefined;
  const dueDate =
    o.dueDate === null || o.dueDate === undefined
      ? o.dueDate === null
        ? null
        : undefined
      : typeof o.dueDate === "string"
        ? o.dueDate
        : undefined;
  const estimateHours =
    typeof o.estimateHours === "number" && Number.isFinite(o.estimateHours)
      ? o.estimateHours
      : undefined;
  const isFavorite = typeof o.isFavorite === "boolean" ? o.isFavorite : undefined;
  return {
    title: o.title,
    description: o.description,
    priority: o.priority,
    status: o.status,
    tags,
    dueDate: dueDate === undefined ? undefined : dueDate,
    estimateHours,
    isFavorite,
  };
}
