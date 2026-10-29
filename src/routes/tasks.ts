// EXAMPLE ROUTES — template for a resource + an async AI action.
import { Router } from "express";
import { conflict, notFound } from "../lib/errors.js";
import { parse } from "../lib/validate.js";
import { Store } from "../lib/store.js";
import { callLLM } from "../lib/llm.js";
import type { JobQueue } from "../lib/jobs.js";
import { CreateTask, ListQuery, TaskSummary, UpdateTask, canTransition, type Task } from "../domain/task.js";

export function createTaskDeps(jobs: JobQueue) {
  return { tasks: new Store<Task>(), jobs };
}

export function tasksRouter({ tasks, jobs }: ReturnType<typeof createTaskDeps>) {
  const r = Router();

  r.post("/", (req, res) => {
    const input = parse(CreateTask, req.body);
    res.status(201).json(tasks.create({ ...input, status: "todo" }));
  });

  r.get("/", (req, res) => {
    const q = parse(ListQuery, req.query);
    res.json(tasks.list({
      filter: (t) => (!q.status || t.status === q.status) && (!q.assignee || t.assignee === q.assignee),
      limit: q.limit, offset: q.offset,
    }));
  });

  r.get("/:id", (req, res) => {
    const t = tasks.get(req.params.id);
    if (!t) throw notFound("task");
    res.json(t);
  });

  r.patch("/:id", (req, res) => {
    const t = tasks.get(req.params.id);
    if (!t) throw notFound("task");
    const patch = parse(UpdateTask, req.body);
    if (patch.status && !canTransition(t.status, patch.status)) throw conflict(`cannot move ${t.status} -> ${patch.status}`);
    res.json(tasks.update(t.id, patch));
  });

  r.delete("/:id", (req, res) => {
    if (!tasks.delete(req.params.id)) throw notFound("task");
    res.status(204).end();
  });

  // Async AI action: 202 + job id; client polls GET /jobs/:id.
  r.post("/:id/summarize", (req, res) => {
    const t = tasks.get(req.params.id);
    if (!t) throw notFound("task");
    const job = jobs.enqueue("summarize", async () => {
      const ai = await callLLM({
        system: "You are an operations assistant. Summarize the task, set a priority, and produce a short checklist. JSON keys: summary, priority (low|medium|high), checklist (string[]).",
        prompt: JSON.stringify({ title: t.title, description: t.description, dueDate: t.dueDate }),
        schema: TaskSummary,
        mock: { summary: `Summary of: ${t.title}`, priority: "medium" as const, checklist: ["Review", "Execute", "Confirm"] },
      });
      tasks.update(t.id, { ai });
      return ai;
    });
    res.status(202).json({ jobId: job.id, status: job.status, poll: `/jobs/${job.id}` });
  });

  return r;
}
