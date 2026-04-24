import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "~/tasks/types";
import { createTaskApi, deleteTaskApi, fetchTaskList, updateTaskApi } from "./api";

describe("api", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetchTaskList returns tasks from JSON body", async () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "A",
        description: "d",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
        completedAt: null,
        priority: "low",
        status: "pending",
      },
    ];
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks }),
    } as Response);

    await expect(fetchTaskList()).resolves.toEqual(tasks);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks$/),
    );
  });

  it("fetchTaskList throws when response not ok", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchTaskList()).rejects.toThrow("Failed to load tasks: 500");
  });

  it("createTaskApi returns created task JSON", async () => {
    const created: Task = {
      id: "new",
      title: "t",
      description: "d",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
      completedAt: null,
      priority: "medium",
      status: "in_progress",
    };
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => created,
    } as Response);

    await expect(createTaskApi({ title: "t" })).resolves.toEqual(created);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("createTaskApi throws with server error message", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid body" }),
    } as Response);

    await expect(createTaskApi({})).rejects.toThrow("Invalid body");
  });

  it("updateTaskApi uses PATCH", async () => {
    const updated: Task = {
      id: "x",
      title: "t",
      description: "d",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-02T00:00:00.000Z",
      completedAt: null,
      priority: "high",
      status: "completed",
    };
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => updated,
    } as Response);

    await expect(updateTaskApi("x", { title: "t" })).resolves.toEqual(updated);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks\/x$/),
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("deleteTaskApi resolves on success", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    await expect(deleteTaskApi("abc")).resolves.toBeUndefined();
  });
});
