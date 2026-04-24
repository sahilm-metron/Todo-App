import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("./layout/PageLayout.tsx", [
    index("tasks/Tasks.tsx"),
    route("tasks/new", "tasks/NewTask.tsx"),
    route("tasks/:taskId/edit", "tasks/EditTask.tsx"),
  ]),
] satisfies RouteConfig;
