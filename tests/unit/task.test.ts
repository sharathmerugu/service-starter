import { describe, expect, it } from "vitest";
import { canTransition } from "../../src/domain/task.js";

describe("task transitions", () => {
  it("allows todo -> in_progress", () => expect(canTransition("todo", "in_progress")).toBe(true));
  it("blocks done -> todo", () => expect(canTransition("done", "todo")).toBe(false));
});
