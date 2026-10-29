import type { z, ZodTypeAny } from "zod";
import { badRequest } from "./errors.js";

/** Parse untrusted input; throws 400 with field-level issues on failure. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw badRequest("Validation failed", r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }
  return r.data;
}
