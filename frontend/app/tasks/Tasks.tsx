import type { ColumnsType } from "antd/es/table";
import type { Route } from "./+types/Tasks";
import type { Task } from "~/tasks/types";
import { fetchTaskList } from "~/lib/api";
import { Button, Popconfirm, Space, Table, Tag, message } from "antd";
import { useMemo, useRef, useState, type Key } from "react";
import { Link, useLoaderData } from "react-router";
import { observer } from "mobx-react";
import { useRootStore } from "~/store/RootStore";

export async function loader(_args: Route.LoaderArgs) {
  const tasks = await fetchTaskList();
  return { tasks };
}

/** Same output on Node (SSR) and in the browser to avoid hydration mismatches. */
function formatCell(d: string | null | undefined) {
  if (d == null || d === "") return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

const priorityColor: Record<Task["priority"], string> = {
  low: "default",
  medium: "blue",
  high: "red",
};

const statusColor: Record<Task["status"], string> = {
  pending: "default",
  in_progress: "processing",
  completed: "success",
};

function loaderSyncKey(tasks: Task[]) {
  return tasks.map((t) => `${t.id}:${t.updatedAt}`).join("|");
}

const Tasks = observer(function Tasks() {
  const { tasks: loaderTasks } = useLoaderData<typeof loader>();
  const { taskStore } = useRootStore();
  const lastLoaderSync = useRef("");

  const syncKey = loaderSyncKey(loaderTasks);
  if (lastLoaderSync.current !== syncKey) {
    lastLoaderSync.current = syncKey;
    taskStore.replaceTasks(loaderTasks);
  }

  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const columns: ColumnsType<Task> = useMemo(
    () => [
      {
        title: "Title",
        width: 160,
        dataIndex: "title",
        key: "title",
        ellipsis: true,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        width: 200,
      },
      {
        title: "Tags",
        key: "tags",
        width: 140,
        ellipsis: true,
        render: (_: unknown, row: Task) =>
          row.tags?.length ? (
            <Space size={[0, 4]} wrap>
              {row.tags.slice(0, 4).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {row.tags.length > 4 ? <Tag>+{row.tags.length - 4}</Tag> : null}
            </Space>
          ) : (
            "—"
          ),
      },
      {
        title: "Created",
        width: 140,
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v: string) => formatCell(v),
      },
      {
        title: "Updated",
        width: 140,
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (v: string) => formatCell(v),
      },
      {
        title: "Completed",
        width: 130,
        dataIndex: "completedAt",
        key: "completedAt",
        render: (v: string | null) => formatCell(v),
      },
      {
        title: "Priority",
        width: 100,
        dataIndex: "priority",
        key: "priority",
        render: (p: Task["priority"]) => <Tag color={priorityColor[p]}>{p}</Tag>,
      },
      {
        title: "Status",
        width: 120,
        dataIndex: "status",
        key: "status",
        render: (s: Task["status"]) => (
          <Tag color={statusColor[s]}>{s.replace("_", " ")}</Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 140,
        fixed: "right",
        render: (_: unknown, record: Task) => (
          <Space size="small">
            <Link to={`/tasks/${record.id}/edit`}>
              <Button type="link" size="small">
                Edit
              </Button>
            </Link>
            <Popconfirm
              title="Delete this task?"
              okText="Delete"
              okButtonProps={{ danger: true, loading: deletingId === record.id }}
              onConfirm={() => void handleDeleteOne(record.id)}
            >
              <Button type="link" size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deletingId],
  );

  async function handleDeleteOne(id: string) {
    setDeletingId(id);
    try {
      await taskStore.deleteTask(id);
      message.success("Task deleted");
      setSelectedRowKeys((keys) => keys.filter((k) => k !== id));
    } catch {
      // TaskStore already surfaced message.error
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSelected() {
    if (selectedRowKeys.length === 0) return;
    setBulkDeleting(true);
    try {
      const ids = selectedRowKeys.map((k) => String(k));
      await taskStore.deleteTasks(ids);
      message.success(`Deleted ${ids.length} task(s)`);
      setSelectedRowKeys([]);
    } catch {
      // TaskStore already surfaced message.error
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div data-testid="tasks-container">
      {selectedRowKeys.length > 0 && (
        <div className="app-toolbar">
          <Popconfirm
            title={`Delete ${selectedRowKeys.length} task(s)?`}
            okText="Delete all"
            okButtonProps={{ danger: true, loading: bulkDeleting }}
            onConfirm={() => void handleDeleteSelected()}
          >
            <Button type="primary" danger loading={bulkDeleting}>
              Delete selected ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
      )}
      <Table<Task>
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as Key[]),
        }}
        columns={columns}
        dataSource={taskStore.tasks}
        loading={taskStore.isLoading}
        pagination={false}
        scroll={{ x: 1100 }}
        rowKey="id"
        bordered
        size="middle"
        className="w-full"
        locale={{ emptyText: "No tasks yet. Create one from the header." }}
      />
    </div>
  );
});

export default Tasks;
