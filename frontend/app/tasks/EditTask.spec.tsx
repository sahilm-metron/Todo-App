import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { RootStore, RootStoreProvider } from "~/store/RootStore";
import type { Task } from "~/tasks/types";
import EditTask from "./EditTask";

const { useLoaderDataMock, navigateMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useLoaderData: () => useLoaderDataMock(),
    useNavigate: () => navigateMock,
  };
});

function createTaskFixture(over: Partial<Task> = {}): Task {
  const now = "2020-01-01T00:00:00.000Z";
  return {
    id: "edit-1",
    title: "Original title",
    description: "Original description",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    priority: "low",
    status: "pending",
    tags: ["frontend"],
    dueDate: null,
    estimateHours: 2,
    isFavorite: false,
    ...over,
  };
}

function renderEditTask(store: RootStore, task: Task) {
  useLoaderDataMock.mockReturnValue({ task });
  return render(
    <MemoryRouter>
      <RootStoreProvider store={store}>
        <EditTask />
      </RootStoreProvider>
    </MemoryRouter>,
  );
}

describe("EditTask", () => {
  let successSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useLoaderDataMock.mockReset();
    navigateMock.mockReset();
    successSpy = vi.spyOn(message, "success").mockImplementation(() => {
      const p = Promise.resolve(true);
      return Object.assign(p, { destroy: () => {} }) as unknown as ReturnType<
        (typeof message)["success"]
      >;
    });
  });

  it("renders edit heading and loader task title", () => {
    const store = new RootStore();
    const task = createTaskFixture({ title: "Acme item" });
    renderEditTask(store, task);

    expect(screen.getByRole("heading", { name: /edit task/i })).toBeInTheDocument();
    expect(screen.getByText("Acme item")).toBeInTheDocument();
  });

  it("prefills title and description from the loader task", () => {
    const store = new RootStore();
    const task = createTaskFixture({
      title: "Loaded title",
      description: "Loaded body",
    });
    renderEditTask(store, task);

    expect(screen.getByDisplayValue("Loaded title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Loaded body")).toBeInTheDocument();
  });

  it("submits update with trimmed fields and navigates home", async () => {
    const user = userEvent.setup();
    const store = new RootStore();
    const task = createTaskFixture();
    const updateSpy = vi.spyOn(store.taskStore, "updateTask").mockImplementation(async () => {});
    renderEditTask(store, task);

    await user.clear(screen.getByPlaceholderText("What needs to be done?"));
    await user.type(screen.getByPlaceholderText("What needs to be done?"), "  Updated title  ");
    await user.clear(screen.getByPlaceholderText("Context, links, acceptance criteria…"));
    await user.type(screen.getByPlaceholderText("Context, links, acceptance criteria…"), "  New body  ");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith(
      "edit-1",
      expect.objectContaining({
        title: "Updated title",
        description: "New body",
        priority: "low",
        status: "pending",
        tags: expect.arrayContaining(["frontend"]),
        dueDate: null,
        estimateHours: 2,
        isFavorite: false,
      }),
    );
    expect(successSpy).toHaveBeenCalledWith("Task updated");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("shows validation when title is cleared", async () => {
    const user = userEvent.setup();
    const store = new RootStore();
    const task = createTaskFixture();
    const updateSpy = vi.spyOn(store.taskStore, "updateTask").mockImplementation(async () => {});
    renderEditTask(store, task);

    await user.clear(screen.getByPlaceholderText("What needs to be done?"));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Enter a title")).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
