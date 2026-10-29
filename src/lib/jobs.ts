import { randomUUID } from "node:crypto";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";
export type Job<R = unknown> = {
  id: string; type: string; status: JobStatus; attempts: number;
  result?: R; error?: string; createdAt: string; finishedAt?: string;
};

/**
 * Tiny in-process async queue: concurrency limit + retry with backoff.
 * Stand-in for BullMQ/SQS. Same contract: enqueue -> poll status.
 */
export class JobQueue {
  private jobs = new Map<string, Job>();
  private pending: Array<() => Promise<void>> = [];
  private running = 0;

  constructor(private concurrency = 4, private maxAttempts = 3, private baseDelayMs = 200) {}

  enqueue<R>(type: string, fn: () => Promise<R>): Job<R> {
    const job: Job<R> = { id: randomUUID(), type, status: "queued", attempts: 0, createdAt: new Date().toISOString() };
    this.jobs.set(job.id, job);
    this.pending.push(() => this.run(job, fn));
    this.drain();
    return job;
  }

  get(id: string) {
    return this.jobs.get(id);
  }

  /** Test helper: resolves when the queue is idle. */
  async idle() {
    while (this.running > 0 || this.pending.length > 0) await new Promise((r) => setTimeout(r, 5));
  }

  private drain() {
    while (this.running < this.concurrency && this.pending.length) {
      const task = this.pending.shift()!;
      this.running++;
      task().finally(() => { this.running--; this.drain(); });
    }
  }

  private async run<R>(job: Job<R>, fn: () => Promise<R>) {
    job.status = "running";
    while (job.attempts < this.maxAttempts) {
      job.attempts++;
      try {
        job.result = await fn();
        job.status = "succeeded";
        break;
      } catch (e) {
        job.error = (e as Error).message;
        if (job.attempts >= this.maxAttempts) { job.status = "failed"; break; }
        await new Promise((r) => setTimeout(r, this.baseDelayMs * 2 ** (job.attempts - 1)));
      }
    }
    job.finishedAt = new Date().toISOString();
  }
}
