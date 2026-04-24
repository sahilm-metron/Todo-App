import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });
import { ensureSchema } from "./db.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  parseCreateBody,
  updateTask,
} from "./store.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

/**
 * Allow any origin: echo `Origin` when the browser sends it (required for credentialed
 * requests from arbitrary sites in dev); otherwise `*` for tools like curl.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  const reqHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    typeof reqHeaders === "string" && reqHeaders.length > 0
      ? reqHeaders
      : "Content-Type, Authorization",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/tasks", async (_req, res, next) => {
  try {
    res.json({ tasks: await listTasks() });
  } catch (e) {
    next(e);
  }
});

app.get("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await getTask(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const parsed = parseCreateBody(req.body);
    if (!parsed) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const task = await createTask(parsed);
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const parsed = parseCreateBody(req.body);
    if (!parsed) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const task = await updateTask(req.params.id, parsed);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (e) {
    next(e);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const ok = await deleteTask(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

async function main() {
  await ensureSchema();
  app.listen(PORT, () => {
    console.log(`Todo API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
