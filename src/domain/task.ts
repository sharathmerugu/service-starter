// EXAMPLE DOMAIN — delete or rename once the real problem lands.
// Shows the pattern: zod schemas = contract, pure functions = business rules.
import { z } from "zod";
import type { Entity } from "../lib/store.js";

export const TaskStatus = z.enum(["todo", "in_progress", "done"]);
export const CreateTask = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  assignee: z.string().trim().min(1).optional(),
  dueDate: z.string().datetime().optional(),
});
export const UpdateTask = CreateTask.partial().extend({ status: TaskStatus.optional() }).strict();
export const ListQuery = z.object({
  status: TaskStatus.optional(),
  assignee: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export const TaskSummary = z.object({
  summary: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  checklist: z.array(z.string()).max(10),
});

export type Task = Entity & z.output<typeof CreateTask> & { status: z.infer<typeof TaskStatus>; ai?: z.infer<typeof TaskSummary> };

const ALLOWED: Record<Task["status"], Task["status"][]> = {
  todo: ["in_progress", "done"],
  in_progress: ["todo", "done"],
  done: [],
};
export const canTransition = (from: Task["status"], to: Task["status"]) => from === to || ALLOWED[from].includes(to);
