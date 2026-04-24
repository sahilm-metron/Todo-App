import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import { RootStore, RootStoreProvider } from "~/store/RootStore";
import NewTask from "./NewTask";

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderNewTask(store: RootStore) {
  return render(
    <MemoryRouter>
      <RootStoreProvider store={store}>
        <NewTask />
      </RootStoreProvider>
    </MemoryRouter>,
  );
}

describe("NewTask", () => {
  let successSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    navigateMock.mockReset();
    successSpy = vi.spyOn(message, "success").mockImplementation(() => {
      const p = Promise.resolve(true);
      return Object.assign(p, { destroy: () => {} }) as unknown as ReturnType<
        (typeof message)["success"]
      >;
    });
  });

  it("renders the new task page shell", () => {
    const store = new RootStore();
    renderNewTask(store);
    expect(screen.getByRole("heading", { name: /new task/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create task/i })).toBeInTheDocument();
  });

  it("shows validation when title or description is missing", async () => {
    const user = userEvent.setup();
    const store = new RootStore();
    const createSpy = vi.spyOn(store.taskStore, "createTask").mockImplementation(async () => {});
    renderNewTask(store);

    await user.click(screen.getByRole("button", { name: /create task/i }));

    expect(await screen.findByText("Enter a title")).toBeInTheDocument();
    expect(screen.getByText("Add a short description")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("submits trimmed values, shows success, and navigates home", async () => {
    const user = userEvent.setup();
    const store = new RootStore();
    const createSpy = vi.spyOn(store.taskStore, "createTask").mockImplementation(async () => {});
    renderNewTask(store);

    await user.type(screen.getByPlaceholderText("What needs to be done?"), "  My task  ");
    await user.type(
      screen.getByPlaceholderText("Context, links, acceptance criteria…"),
      "  Some context  ",
    );
    await user.click(screen.getByRole("button", { name: /create task/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My task",
        description: "Some context",
        priority: "medium",
        status: "pending",
        tags: [],
        dueDate: null,
        estimateHours: 4,
        isFavorite: false,
      }),
    );
    expect(successSpy).toHaveBeenCalledWith("Task created");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });
});
