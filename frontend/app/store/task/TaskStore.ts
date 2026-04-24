import { makeAutoObservable, runInAction } from "mobx";
import type { Task } from "~/tasks/types";
import {
  createTaskApi,
  deleteTaskApi,
  fetchTaskById,
  fetchTaskList,
  updateTaskApi,
} from "~/lib/api";
import { message } from "antd";

export class TaskStore {
  tasks: Task[] = [];
  isLoading = false;

  constructor(initialTasks: Task[]) {
    makeAutoObservable(this);
    runInAction(() => {
      this.tasks = initialTasks;
    });
  }

  replaceTasks(tasks: Task[]) {
    runInAction(() => {
      this.tasks = tasks;
    });
  }

  async createTask(task: Partial<Task>) {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const res = await createTaskApi(task);
      runInAction(() => {
        this.tasks.push(res);
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not create task");
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async updateTask(id: string, patch: Record<string, unknown>) {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const updated = await updateTaskApi(id, patch);
      runInAction(() => {
        const i = this.tasks.findIndex((t) => t.id === id);
        if (i >= 0) this.tasks[i] = updated;
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not update task");
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async deleteTask(id: string) {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      await deleteTaskApi(id);
      runInAction(() => {
        this.tasks = this.tasks.filter((t) => t.id !== id);
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not delete task");
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async deleteTasks(ids: string[]) {
    if (ids.length === 0) return;
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      await Promise.all(ids.map((id) => deleteTaskApi(id)));
      const idSet = new Set(ids);
      runInAction(() => {
        this.tasks = this.tasks.filter((task) => !idSet.has(task.id));
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not delete tasks");
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async fetchTasks() {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const tasks = await fetchTaskList();
      runInAction(() => {
        this.tasks = tasks;
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Could not fetch task list");
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async getTaskById(id: string) {
    runInAction(() => {
      this.isLoading = true;
    });
    try {
      const task = await fetchTaskById(id);
      return task;
    } catch (error) {
      message.error(error instanceof Error ? error.message : `Could not fetch task by id: ${id}`);
      throw error;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}
