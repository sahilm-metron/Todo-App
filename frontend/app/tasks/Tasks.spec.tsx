import { render, screen, waitFor } from "@testing-library/react";
import { runInAction } from "mobx";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RootStore, RootStoreProvider } from "~/store/RootStore";
import type { Task } from "~/tasks/types";
import Tasks from "./Tasks";

const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useLoaderData: () => useLoaderDataMock(),
  };
});

function createTask(over: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: "task-1",
    title: "Test Task",
    description: "Test Description",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    priority: "low",
    status: "pending",
    ...over,
  };
}

function renderTasks(store: RootStore, tasks: Task[]) {
  useLoaderDataMock.mockReturnValue({ tasks });
  return render(
    <MemoryRouter>
      <RootStoreProvider store={store}>
        <Tasks />
      </RootStoreProvider>
    </MemoryRouter>,
  );
}

describe("Tasks", () => {
  beforeEach(() => {
    useLoaderDataMock.mockReset();
  });

  it("renders the tasks component", () => {
    const store = new RootStore();
    renderTasks(store, []);
    expect(screen.getByTestId("tasks-container")).toBeInTheDocument();
  });

  it("shows loading spinner on the table when taskStore.isLoading is true", async () => {
    const store = new RootStore();
    renderTasks(store, []);

    expect(document.querySelector(".ant-spin-spinning")).toBeNull();

    runInAction(() => {
      store.taskStore.isLoading = true;
    });

    await waitFor(() => {
      expect(document.querySelector(".ant-spin-spinning")).not.toBeNull();
    });
  });

  it("shows task title from the store after loader sync", () => {
    const store = new RootStore();
    const task = createTask({ title: "Synced title" });
    renderTasks(store, [task]);
    expect(screen.getByText("Synced title")).toBeInTheDocument();
  });
});