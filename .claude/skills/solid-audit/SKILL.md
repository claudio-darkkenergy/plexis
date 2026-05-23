---
name: solid-audit
version: 1.0.0
description: Audits existing project code for SOLID principle violations and maintains SOLID-AUDIT-REPORT.md as a living document.
triggers: >
    Run a full audit, audit a specific file or folder, update the report after
    fixing a violation, or when opening a file that has open audit entries.
config: .claude/skills/skill-config.md
---

## ⚠️ Read Config First

Before applying any rule in this skill, read `.claude/skills/skill-config.md`.
All folder paths, tooling references, and framework conventions must use the values defined there. Never assume conventions from a previous project.

---

## Project Conventions

See `.claude/skills/skill-config.md` for the full list of:

- All layer folders and their purposes (components, services, utilities, etc.)
- External data layer (what external services are used; where DIP boundaries are prescribed)
- Test runner in use (to know which test file locations to exclude from audit scope)
- Class utility in use (to distinguish accepted patterns from violations)
- Framework-level DOM API usage policy (to avoid false-positive DIP flags)

---

## Purpose

This skill audits **existing** code for SOLID principle violations. It does not govern new code.

- For rules about writing new code and refactoring guidance: `.claude/skills/solid-principles/SKILL.md`
- For violations that block writing tests: `.claude/skills/tdd-workflow/SKILL.md`
- The audit report is maintained at `SOLID-AUDIT-REPORT.md` in the project root.

---

## Audit Modes

### 1. Full audit

**Triggered by:** "audit the project" or "run a full SOLID audit"

1. Walk every source file in the project (skip generated/vendored folders — see "What NOT to Flag" below).
2. Evaluate each file against all five SOLID principles using the checklist below.
3. Write findings into `SOLID-AUDIT-REPORT.md` using the violation entry schema.
4. Generate (or regenerate) the Summary table with accurate counts.

Run this mode once per deliberate audit pass — do not re-run on an already-audited project unless explicitly asked.

### 2. File audit

**Triggered by:** opening or being asked to modify an existing file

1. Audit only that file (or folder, if a folder is specified).
2. Check `SOLID-AUDIT-REPORT.md` for existing open entries for this path.
3. If a new violation is found with no existing entry, add it.
4. If an existing open entry is no longer accurate (code has changed), update it.
5. If a resolved entry is re-opened by a regression, move it back to the open section and reset its status.

### 3. Resolve

**Triggered by:** fixing a violation

1. Find the relevant entry in `SOLID-AUDIT-REPORT.md`.
2. Change `**Status:** 🔲 Open` → `**Status:** ✅ Resolved`.
3. Add `**Resolved:** YYYY-MM-DD` below the Audited line.
4. Move the entry to the `## ✅ Resolved` section at the bottom of the report.
5. Decrement the relevant counts in the Summary table; increment the Resolved column.

---

## Violation Severity Definitions

**🔴 Critical** — fix before adding new code to this file:

- Breaks testability: requires a real external service (from skill-config.md → Stack) to unit test.
- Creates tight coupling across module boundaries that blocks safe refactoring.
- Direct SDK or service client instantiation at module level inside a handler or component.

**🟡 Moderate** — fix when the file is next touched:

- Principle violated but isolated to one file; does not immediately block testing.
- Component or function doing two distinct things but not actively preventing test isolation.
- Switch/if-else on a type field that will grow as the codebase evolves.
- Surprise behavior for callers (e.g. root element switching based on a prop).

**🟢 Minor** — fix opportunistically:

- Convention drift or naming inconsistency.
- Interface that could be split but is not causing active problems.
- Co-location of two related concerns in a single file that could be separated cleanly.

---

## Violation Entry Schema

Every entry in the report must use exactly this format. One block per violation per file heading.

```
### `[relative file path from project root]`
- **Principle violated:** [SRP | OCP | LSP | ISP | DIP]
- **Severity:** [🔴 Critical | 🟡 Moderate | 🟢 Minor]
- **Violation:** [One sentence describing what the code is doing wrong]
- **Impact:** [One sentence on the consequence — testability, coupling, etc.]
- **Recommended fix:** [Specific action referencing the relevant section in .claude/skills/solid-principles/SKILL.md]
- **Status:** [🔲 Open | ✅ Resolved]
- **Audited:** [YYYY-MM-DD]
```

---

## What NOT to Flag

Do not flag:

- Generated or vendored folders listed in skill-config.md → Audit Exclusions → Generated and vendored folders
- Config files listed in skill-config.md → Audit Exclusions → Config files, unless they contain business logic
- File patterns listed in skill-config.md → Audit Exclusions → File patterns
- `.d.ts` type definition files unless they contain runtime logic
- Test files at locations defined in skill-config.md → Test Conventions
- Framework-internal direct use of platform APIs when those APIs are the product — see skill-config.md → Notes for project-specific guidance
- Style preferences that are not genuine SOLID violations

---

## Audit Checklist Per File

For each file evaluated, run:

- [ ] **SRP** — Does this file or function have more than one reason to change?
- [ ] **OCP** — Would adding new behavior require editing this file rather than extending it?
- [ ] **LSP** — Do all implementations of interfaces here honor the full contract without adding hidden requirements?
- [ ] **ISP** — Are consumers forced to depend on fields or methods they don't use?
- [ ] **DIP** — Does any business logic import a concrete external service client directly (from skill-config.md → Stack → services/SDKs)?

Only flag genuine violations — not every file will have one.

---

## CLAUDE.md Enforcement Rule

Ensure the following section exists in `CLAUDE.md` (add it if absent):

```md
## Audit Rule

Before modifying any existing file, check `SOLID-AUDIT-REPORT.md` (project root) for open violations in that file. If a 🔴 Critical violation exists, resolve it before adding new code. After fixing a violation, update the report entry to ✅ Resolved using the solid-audit skill.
```

---

## Cross-references

- How to fix violations: `.claude/skills/solid-principles/SKILL.md`
- Violations that block testing: `.claude/skills/tdd-workflow/SKILL.md`
