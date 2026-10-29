import { randomUUID } from "node:crypto";

export type Entity = { id: string; createdAt: string; updatedAt: string };

/** In-memory repository. Swap for Mongo/Postgres behind the same interface if asked. */
export class Store<T extends Entity> {
  private rows = new Map<string, T>();

  create(data: Omit<T, keyof Entity>): T {
    const now = new Date().toISOString();
    const row = { ...data, id: randomUUID(), createdAt: now, updatedAt: now } as T;
    this.rows.set(row.id, row);
    return row;
  }
  get(id: string): T | undefined {
    return this.rows.get(id);
  }
  update(id: string, patch: Partial<Omit<T, keyof Entity>>): T | undefined {
    const cur = this.rows.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, id, updatedAt: new Date().toISOString() } as T;
    this.rows.set(id, next);
    return next;
  }
  delete(id: string): boolean {
    return this.rows.delete(id);
  }
  list(opts: { filter?: (r: T) => boolean; limit?: number; offset?: number } = {}) {
    const all = [...this.rows.values()].filter(opts.filter ?? (() => true));
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    return { items: all.slice(offset, offset + limit), total: all.length, limit, offset };
  }
  clear() {
    this.rows.clear();
  }
}
