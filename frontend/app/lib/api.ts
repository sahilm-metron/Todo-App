import type { Task } from "~/tasks/types";

export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
}

export async function fetchTaskList(): Promise<Task[]> {
  const res = await fetch(`${getApiBase()}/api/tasks`);
  if (!res.ok) throw new Error(`Failed to load tasks: ${res.status}`);
  const body = (await res.json()) as { tasks: Task[] };
  return body.tasks;
}

export async function fetchTaskById(id: string): Promise<Task> {
  const res = await fetch(`${getApiBase()}/api/tasks/${id}`);
  if (res.status === 404) throw new Response("Task not found", { status: 404 });
  if (!res.ok) throw new Error(`Failed to load task: ${res.status}`);
  return (await res.json()) as Task;
}

export async function createTaskApi(payload: Record<string, unknown>): Promise<Task> {
  const res = await fetch(`${getApiBase()}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Create failed: ${res.status}`);
  }
  return (await res.json()) as Task;
}

export async function updateTaskApi(id: string, payload: Record<string, unknown>): Promise<Task> {
  const res = await fetch(`${getApiBase()}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 404) throw new Error("Task not found");
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Update failed: ${res.status}`);
  }
  return (await res.json()) as Task;
}

export async function deleteTaskApi(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/tasks/${id}`, { method: "DELETE" });
  if (res.status === 404) throw new Error("Task not found");
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}
