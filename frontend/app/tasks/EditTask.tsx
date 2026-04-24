import type { Route } from "./+types/EditTask";
import type { Task, TaskPriority, TaskStatus } from "~/tasks/types";
import { fetchTaskById } from "~/lib/api";
import { useRootStore } from "~/store/RootStore";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  FlagOutlined,
  FormOutlined,
  TagsOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  theme,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router";
import { coerceStringList } from "~/helpers/common.helper";

const CONTEXT_OPTIONS = [
  { label: "Deep work", value: "deep-work" },
  { label: "Quick win", value: "quick-win" },
  { label: "Needs review", value: "needs-review" },
];

const CONTEXT_VALUES = new Set(CONTEXT_OPTIONS.map((o) => o.value));

type EditTaskFormValues = {
  title: string;
  description: string;
  tags?: string[];
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  isFavorite?: boolean;
  estimateHours?: number;
  context?: string[];
};

export async function loader({ params }: Route.LoaderArgs) {
  const task = await fetchTaskById(params.taskId!);
  return { task };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const t = loaderData?.task;
  return [{ title: t ? `Edit · ${t.title}` : "Edit task" }];
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Space align="center" size="small">
      <span style={{ color: "var(--ant-color-primary)", fontSize: 16 }}>{icon}</span>
      <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
        {children}
      </Typography.Title>
    </Space>
  );
}

function toDatetimeLocal(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function taskToFormValues(task: Task): EditTaskFormValues {
  const tags = task.tags ?? [];
  const context = tags.filter((t) => CONTEXT_VALUES.has(t));
  const tagOnly = tags.filter((t) => !CONTEXT_VALUES.has(t));
  return {
    title: task.title,
    description: task.description,
    tags: tagOnly,
    context,
    priority: task.priority,
    status: task.status,
    dueDate: toDatetimeLocal(task.dueDate),
    isFavorite: task.isFavorite ?? false,
    estimateHours: task.estimateHours ?? 0,
  };
}

export default function EditTask() {
  const { task } = useLoaderData<typeof loader>();
  const { token } = theme.useToken();
  const [form] = Form.useForm<EditTaskFormValues>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { taskStore } = useRootStore();

  const initialValues = useMemo(() => taskToFormValues(task), [task]);

  async function onFinish(values: EditTaskFormValues) {
    setSubmitting(true);
    try {
      const tagSet = new Set<string>([
        ...coerceStringList(values.tags),
        ...coerceStringList(values.context),
      ]);
      await taskStore.updateTask(task.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        status: values.status,
        tags: [...tagSet],
        dueDate:
          values.dueDate && !Number.isNaN(new Date(values.dueDate).getTime())
            ? new Date(values.dueDate).toISOString()
            : null,
        estimateHours: values.estimateHours,
        isFavorite: Boolean(values.isFavorite),
      });
      message.success("Task updated");
      navigate("/");
    } catch {
      // TaskStore already surfaced message.error
    } finally {
      setSubmitting(false);
    }
  }

  const cardStyles = {
    body: { padding: "20px 22px 22px" },
  } as const;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        style={{
          marginBottom: token.marginLG,
          padding: "20px 22px",
          borderRadius: token.borderRadiusLG,
          background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillAlter} 55%, ${token.colorBgContainer} 100%)`,
          border: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={16} lg={17}>
            <Space align="start" size="middle">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: token.borderRadiusLG,
                  background: token.colorPrimary,
                  color: token.colorTextLightSolid,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <FormOutlined />
              </div>
              <div className="min-w-0">
                <Typography.Title level={3} className="app-page-title" style={{ margin: "0 0 6px" }}>
                  Edit task
                </Typography.Title>
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, maxWidth: 420 }}
                  ellipsis={{ rows: 2 }}
                >
                  {task.title}
                </Typography.Paragraph>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} lg={7} style={{ textAlign: "right" }}>
            <Link to="/">
              <Button icon={<ArrowLeftOutlined />} size="large">
                Back to list
              </Button>
            </Link>
          </Col>
        </Row>
      </div>

      <Form<EditTaskFormValues>
        key={task.id}
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={onFinish}
        initialValues={initialValues}
        style={{ marginBottom: token.marginMD }}
      >
        <Space orientation="vertical" size="middle" className="w-full">
          <Card size="small" variant="outlined" styles={cardStyles}>
            <SectionTitle icon={<FormOutlined />}>Basics</SectionTitle>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: token.marginMD }}>
              Update the title and description.
            </Typography.Paragraph>

            <Form.Item
              name="title"
              label={<Typography.Text strong>Title</Typography.Text>}
              rules={[{ required: true, message: "Enter a title" }]}
            >
              <Input size="large" placeholder="What needs to be done?" allowClear />
            </Form.Item>

            <Form.Item
              name="description"
              label={<Typography.Text strong>Description</Typography.Text>}
              rules={[{ required: true, message: "Add a short description" }]}
            >
              <Input.TextArea
                rows={4}
                showCount
                maxLength={2000}
                placeholder="Context, links, acceptance criteria…"
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Card>

          <Card size="small" variant="outlined" styles={cardStyles}>
            <SectionTitle icon={<TagsOutlined />}>Classification</SectionTitle>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: token.marginMD }}>
              Tags and context labels are merged when you save.
            </Typography.Paragraph>

            <Row gutter={[token.marginMD, token.marginMD]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="tags"
                  label={<Typography.Text strong>Tags</Typography.Text>}
                  getValueFromEvent={(value) =>
                    Array.isArray(value) ? value : value != null && value !== "" ? [String(value)] : []
                  }
                >
                  <Select
                    mode="tags"
                    placeholder="Add tags — Enter to confirm"
                    tokenSeparators={[","]}
                    options={["frontend", "backend", "bug", "chore"].map((t) => ({ label: t, value: t }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="context" label={<Typography.Text strong>Context</Typography.Text>}>
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: token.borderRadius,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      background: token.colorFillQuaternary,
                    }}
                  >
                    <Checkbox.Group options={CONTEXT_OPTIONS} />
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[token.marginMD, token.marginMD]}>
              <Col xs={24} md={12}>
                <Form.Item name="priority" label={<Typography.Text strong>Priority</Typography.Text>} rules={[{ required: true }]}>
                  <Radio.Group optionType="button" buttonStyle="solid" size="large">
                    <Radio.Button value="low">Low</Radio.Button>
                    <Radio.Button value="medium">Medium</Radio.Button>
                    <Radio.Button value="high">High</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="status" label={<Typography.Text strong>Status</Typography.Text>} rules={[{ required: true }]}>
                  <Segmented
                    size="large"
                    block
                    options={[
                      { label: "Pending", value: "pending" },
                      { label: "In progress", value: "in_progress" },
                      { label: "Done", value: "completed" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" variant="outlined" styles={cardStyles}>
            <SectionTitle icon={<CalendarOutlined />}>Planning</SectionTitle>
            <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: token.marginMD }}>
              Optional due date and effort estimate.
            </Typography.Paragraph>

            <Row gutter={[token.marginMD, token.marginMD]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="dueDate"
                  label={<Typography.Text strong>Due date</Typography.Text>}
                  extra="Shown in your local timezone."
                >
                  <Input type="datetime-local" size="large" style={{ maxWidth: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Typography.Text strong>Favorite</Typography.Text>}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minHeight: 40,
                      padding: "4px 0",
                    }}
                  >
                    <Form.Item name="isFavorite" valuePropName="checked" noStyle>
                      <Switch checkedChildren="On" unCheckedChildren="Off" />
                    </Form.Item>
                    <Typography.Text type="secondary">Highlight this task in your list</Typography.Text>
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<Typography.Text strong>Estimated hours</Typography.Text>}
              tooltip="Combined slider and number input; saved as estimateHours."
            >
              <Row gutter={16} align="middle" wrap={false}>
                <Col flex="auto" style={{ minWidth: 0 }}>
                  <Form.Item name="estimateHours" noStyle>
                    <Slider
                      min={0}
                      max={40}
                      step={0.5}
                      marks={{ 0: "0h", 8: "8h", 40: "40h" }}
                      tooltip={{ formatter: (v) => (v != null ? `${v} h` : "") }}
                    />
                  </Form.Item>
                </Col>
                <Col flex="none">
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.estimateHours !== cur.estimateHours}>
                    {() => (
                      <Space.Compact className="w-full" style={{ display: "flex" }}>
                        <ThunderboltOutlined
                          style={{
                            padding: "4px 8px",
                            color: "var(--ant-color-text-secondary)",
                            border: "1px solid rgba(217, 217, 217, 1)",
                            borderRight: "none",
                          }}
                        />
                        <InputNumber
                          min={0}
                          max={80}
                          step={0.5}
                          size="large"
                          value={form.getFieldValue("estimateHours")}
                          onChange={(v) => form.setFieldValue("estimateHours", v ?? 0)}
                        />
                      </Space.Compact>
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Card>

          <Card
            size="small"
            variant="outlined"
            styles={{
              body: {
                padding: "16px 22px",
                background: token.colorFillQuaternary,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
              },
            }}
          >
            <Row gutter={16} align="middle" justify="space-between">
              <Col flex="auto">
                <Space align="center" size="small">
                  <FlagOutlined style={{ color: token.colorTextSecondary }} />
                  <Typography.Text type="secondary">Save changes or revert the form to loaded values.</Typography.Text>
                </Space>
              </Col>
              <Col flex="none">
                <Space size="middle" wrap>
                  <Button
                    size="large"
                    onClick={() => form.setFieldsValue(taskToFormValues(task))}
                    disabled={submitting}
                  >
                    Reset
                  </Button>
                  <Button type="primary" size="large" htmlType="submit" loading={submitting}>
                    Save changes
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Space>
      </Form>
    </div>
  );
}
