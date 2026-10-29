---
name: backend-conventions
description: How to add a resource, endpoint, async job, or persistence layer in this repo. Use whenever creating or changing routes, domain schemas, the store, or the job queue.
---
# Adding a resource (copy the tasks example)
1. `src/domain/<x>.ts`: `Create<X>`, `Update<X>` (`.partial().strict()`), `ListQuery` (coerce numbers, default limit 20, max 100), type `<X> = Entity & z.output<typeof Create<X>> & {...server fields}`. Pure rule functions (e.g. `canTransition`) here.
2. `src/routes/<x>.ts`: `create<X>Deps()` returns stores; `<x>Router(deps)` with thin handlers: `parse` → rule → store → `res.status(...).json(...)`.
3. Register in `src/app.ts` and spread deps into the returned object so tests can reach them.
4. Acceptance tests via `createApp()` + supertest; fresh app per test (`beforeEach`).

# Status codes
201 create · 200 read/update · 204 delete · 202 async accepted · 400 validation · 404 missing · 409 state/duplicate · 422 only if spec demands it.

# Relationships
Store parent id on child; validate existence of the parent on create (404 if missing). For "list children" use `store.list({filter})`.

# Idempotency (payments, bookings, submissions)
Accept `Idempotency-Key` header; keep `Map<key, responseBody>`; return the stored response on repeat. Test with two identical requests → same id, one record.

# Concurrency on in-memory state
Node is single-threaded, but `await` between read and write breaks atomicity. Do check-and-set with no `await` in between, or use a per-key promise lock. Test with `Promise.all`.

# Async processing
`jobs.enqueue(type, fn)` → `202 {jobId, poll}`. `GET /jobs/:id` already exists. Tests call `await ctx.jobs.idle()`.

# If asked "how would this persist / scale"
Store interface → Mongo/Postgres repository; JobQueue → BullMQ (Redis) or SQS with DLQ; add outbox for events; cache reads in Redis; rate-limit LLM calls per tenant.
