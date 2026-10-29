import { describe, expect, it } from "vitest";
import { JobQueue } from "../../src/lib/jobs.js";

describe("JobQueue", () => {
  it("retries then succeeds", async () => {
    const q = new JobQueue(1, 3, 1);
    let n = 0;
    const job = q.enqueue("x", async () => { if (++n < 2) throw new Error("flaky"); return "ok"; });
    await q.idle();
    expect(q.get(job.id)).toMatchObject({ status: "succeeded", attempts: 2, result: "ok" });
  });
  it("fails after max attempts", async () => {
    const q = new JobQueue(1, 2, 1);
    const job = q.enqueue("x", async () => { throw new Error("boom"); });
    await q.idle();
    expect(q.get(job.id)).toMatchObject({ status: "failed", attempts: 2, error: "boom" });
  });
});
