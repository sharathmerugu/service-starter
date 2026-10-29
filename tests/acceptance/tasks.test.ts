// Acceptance tests = the spec, executable. One `it` per acceptance criterion in SPEC.md.
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

let ctx: ReturnType<typeof createApp>;
beforeEach(() => { ctx = createApp(); });
const api = () => request(ctx.app);

describe("AC: tasks", () => {
  it("AC1 creates a task with defaults", async () => {
    const r = await api().post("/tasks").send({ title: "Open store" });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ title: "Open store", status: "todo", description: "" });
  });

  it("AC2 rejects invalid input with field details", async () => {
    const r = await api().post("/tasks").send({ title: "" });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].path).toBe("title");
  });

  it("AC3 rejects malformed JSON", async () => {
    const r = await api().post("/tasks").set("content-type", "application/json").send("{bad");
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("BAD_JSON");
  });

  it("AC4 filters and paginates", async () => {
    for (const t of ["a", "b", "c"]) await api().post("/tasks").send({ title: t, assignee: t === "c" ? "sam" : "ana" });
    const r = await api().get("/tasks?assignee=ana&limit=1");
    expect(r.body).toMatchObject({ total: 2, limit: 1 });
    expect(r.body.items).toHaveLength(1);
  });

  it("AC5 enforces status transitions (409)", async () => {
    const { body: t } = await api().post("/tasks").send({ title: "x" });
    await api().patch(`/tasks/${t.id}`).send({ status: "done" }).expect(200);
    const r = await api().patch(`/tasks/${t.id}`).send({ status: "todo" });
    expect(r.status).toBe(409);
  });

  it("AC6 404s unknown ids and routes", async () => {
    await api().get("/tasks/nope").expect(404);
    await api().get("/nope").expect(404);
  });

  it("AC7 AI summarize is async: 202 -> job succeeds -> task enriched", async () => {
    const { body: t } = await api().post("/tasks").send({ title: "Close store" });
    const r = await api().post(`/tasks/${t.id}/summarize`);
    expect(r.status).toBe(202);
    await ctx.jobs.idle();
    const job = await api().get(`/jobs/${r.body.jobId}`);
    expect(job.body.status).toBe("succeeded");
    const after = await api().get(`/tasks/${t.id}`);
    expect(after.body.ai.priority).toMatch(/low|medium|high/);
  });
});
