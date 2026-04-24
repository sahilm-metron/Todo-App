import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/api", () => ({
  createTaskApi: vi.fn(),
  deleteTaskApi: vi.fn(),
  fetchTaskById: vi.fn(),
  fetchTaskList: vi.fn(),
  updateTaskApi: vi.fn(),
}));

vi.mock("antd", () => ({
  message: { error: vi.fn() },
}));

import {
  createTaskApi,
  deleteTaskApi,
  fetchTaskList,
  updateTaskApi,
} from "~/lib/api";
import type { Task } from "~/tasks/types";
import { TaskStore } from "./TaskStore";

const taskFixture = (over: Partial<Task> = {}): Task => {
  const now = "2020-01-01T00:00:00.000Z";
  return {
    id: "id-1",
    title: "Title",
    description: "Desc",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    priority: "low",
    status: "pending",
    ...over,
  };
};

describe("TaskStore", () => {
  beforeEach(() => {
    vi.mocked(createTaskApi).mockReset();
    vi.mocked(deleteTaskApi).mockReset();
    vi.mocked(fetchTaskList).mockReset();
    vi.mocked(updateTaskApi).mockReset();
  });

  it("replaceTasks sets tasks", () => {
    const store = new TaskStore([]);
    const t = taskFixture({ id: "a" });
    store.replaceTasks([t]);
    expect(store.tasks).toEqual([t]);
  });

  it("deleteTask removes task after API succeeds", async () => {
    const a = taskFixture({ id: "a" });
    const b = taskFixture({ id: "b", title: "B" });
    vi.mocked(deleteTaskApi).mockResolvedValue(undefined);
    const store = new TaskStore([a, b]);

    await store.deleteTask("a");

    expect(deleteTaskApi).toHaveBeenCalledWith("a");
    expect(store.tasks.map((t) => t.id)).toEqual(["b"]);
    expect(store.isLoading).toBe(false);
  });

  it("deleteTasks removes all given ids", async () => {
    vi.mocked(deleteTaskApi).mockResolvedValue(undefined);
    const store = new TaskStore([
      taskFixture({ id: "1" }),
      taskFixture({ id: "2" }),
      taskFixture({ id: "3" }),
    ]);

    await store.deleteTasks(["1", "3"]);

    expect(store.tasks.map((t) => t.id)).toEqual(["2"]);
  });

  it("deleteTasks no-ops for empty ids", async () => {
    const store = new TaskStore([taskFixture()]);
    await store.deleteTasks([]);
    expect(deleteTaskApi).not.toHaveBeenCalled();
    expect(store.tasks).toHaveLength(1);
  });

  it("createTask appends returned task", async () => {
    const created = taskFixture({ id: "new", title: "New" });
    vi.mocked(createTaskApi).mockResolvedValue(created);
    const store = new TaskStore([]);

    await store.createTask({ title: "New", description: "D", priority: "low", status: "pending" });

    expect(createTaskApi).toHaveBeenCalledTimes(1);
    expect(store.tasks).toEqual([created]);
  });

  it("updateTask replaces task at index when id matches", async () => {
    const existing = taskFixture({ id: "same", title: "Old" });
    const updated = taskFixture({ id: "same", title: "New" });
    vi.mocked(updateTaskApi).mockResolvedValue(updated);
    const store = new TaskStore([existing]);

    await store.updateTask("same", { title: "New" });

    expect(updateTaskApi).toHaveBeenCalledWith("same", { title: "New" });
    expect(store.tasks[0]?.title).toBe("New");
  });

  it("fetchTasks replaces list from API", async () => {
    const list = [taskFixture({ id: "x" })];
    vi.mocked(fetchTaskList).mockResolvedValue(list);
    const store = new TaskStore([taskFixture({ id: "old" })]);

    await store.fetchTasks();

    expect(store.tasks).toEqual(list);
  });
});
