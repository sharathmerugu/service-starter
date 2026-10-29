---
description: Break down a problem statement into plain-language requirements and simple questions. No code.
argument-hint: <problem statement> [timebox, e.g. "timebox 30m"]
---
First run: `touch .claude/LOOP_OFF && rm -f .claude/SPEC_LOCKED` (no test gate while planning).

Problem:
$ARGUMENTS

Do NOT write code. Follow "How to communicate with me" in CLAUDE.md: plain words, short, no jargon.
Reply with these sections, each as short bullets:

1. **In plain words** — what we're building, who uses it, the main flow. 2–3 lines.
2. **Must have** — what the problem clearly asks for.
3. **Should also handle** — sensible things not stated (bad input, missing items, duplicates, slow AI calls). One line each, in plain words.
4. **Questions** — max 3, ranked by how much the answer changes the build. Each is one simple choice with my recommended option first:
   "Should X? (a) … — recommended (b) …"
5. **First version** — what to build within the timebox (default: the smallest useful version), and what to leave for later.
6. **Risks** — max 2 things most likely to go wrong or take long, in one line each.

Then fill the Problem, In plain words, Users & main flow, In scope, Out of scope, and Assumptions sections of SPEC.md.
Stop and wait for my answers. Whole reply under 30 lines.
