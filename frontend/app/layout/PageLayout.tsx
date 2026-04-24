import type { Route } from "./+types/PageLayout";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import { Link, Outlet, useLocation } from "react-router";

const { Header, Content, Footer } = Layout;

export default function PageLayout(_args: Route.MetaArgs) {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const location = useLocation();
  const path = location.pathname;

  const menuItems = [
    {
      key: "/",
      label: <Link to="/">All tasks</Link>,
    },
    {
      key: "/tasks/new",
      label: <Link to="/tasks/new">Create task</Link>,
    },
  ];

  const isNewTask = path === "/tasks/new";
  const isEditTask = /^\/tasks\/[^/]+\/edit$/.test(path);
  const selectedKeys = [isNewTask ? "/tasks/new" : "/"];

  const breadcrumbItems = isNewTask
    ? [
        { title: <Link to="/">Tasks</Link> },
        { title: "Create" },
      ]
    : isEditTask
      ? [
          { title: <Link to="/">Tasks</Link> },
          { title: "Edit" },
        ]
      : [{ title: "Tasks" }];

  const currentYear = new Date().getFullYear();

  return (
    <Layout
      className="app-shell w-full"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "transparent",
      }}
    >
      <Header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          paddingInline: "clamp(12px, 3vw, 28px)",
          height: 56,
          lineHeight: "56px",
        }}
      >
        <span className="app-brand">Todo</span>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={menuItems}
          style={{ flex: 1, minWidth: 0, borderBottom: "none", background: "transparent" }}
        />
      </Header>
      <Content
        className="app-main"
        style={{
          flex: "1 1 auto",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Breadcrumb className="app-breadcrumb" items={breadcrumbItems} />
        <div
          className="app-surface"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </div>
      </Content>
      <Footer className="app-footer" style={{ flexShrink: 0, textAlign: "center" }}>
        This is a footer
      </Footer>
    </Layout>
  );
}
