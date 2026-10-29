import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "./lib/errors.js";
import { JobQueue } from "./lib/jobs.js";
import { healthRouter } from "./routes/health.js";
import { tasksRouter, createTaskDeps } from "./routes/tasks.js";

export function createApp() {
  const app = express();
  const jobs = new JobQueue();
  const taskDeps = createTaskDeps(jobs);

  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    const id = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", id);
    const t0 = Date.now();
    res.on("finish", () => {
      if (process.env.NODE_ENV !== "test") console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - t0}ms id=${id}`);
    });
    next();
  });

  app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), "../public")));
  app.use("/health", healthRouter);
  app.use("/tasks", tasksRouter(taskDeps));
  app.get("/jobs/:id", (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) throw new AppError(404, "NOT_FOUND", "job not found");
    res.json(job);
  });

  app.use((_req, _res, next) => next(new AppError(404, "NOT_FOUND", "route not found")));
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: { code: "BAD_JSON", message: "Malformed JSON body" } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
  };
  app.use(onError);

  return { app, ...taskDeps };
}
