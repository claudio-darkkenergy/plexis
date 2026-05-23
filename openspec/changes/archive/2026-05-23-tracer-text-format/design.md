## Context

`Tracer.export('text')` is used in the terminal examples and in any downstream tooling that wants a human-readable timeline. The current format is `[timestamp] level/type status`. The `level/` prefix is the first token of `type` (e.g. `action` in `action.completed`), so it's always redundant. The trailing `status` word is often the last token of `type` (`started`, `completed`) — redundant in the common case, and unhelpful in the divergent cases (`guard.passed` → `status: completed`) since the type string is already the more descriptive term. Neither the event `type` names nor the `status` field itself change — only the text rendering.

The scope gap: a shared tracer attached to multiple primitives emits events from different domains and pipelines. The text format currently provides no way to tell them apart. Adding `domainId ?? pipelineId` as a bracketed scope column closes this.

## Goals / Non-Goals

**Goals:**
- Text format becomes `[timestamp] [scope] type` — concise and scope-aware.
- One-line change to `src/core/tracer.js`. One assertion update in `tests/tracer.test.ts`.
- `export('json')` and `export('tree')` formats unchanged.
- Event `type` string names, `level` field, and `status` field on event objects unchanged.

**Non-Goals:**
- No renaming of event types (e.g., `guard.passed` stays `guard.passed`).
- No three-part naming scheme (`guard.completed.passed`) — adds structure without clarity gain.
- No changes to the tracer API surface.

## Decisions

### D1 — Scope column: `domainId ?? pipelineId ?? '?'`

Each trace event carries either `domainId`, `pipelineId`, or both. For the text column, prefer `domainId` when present (domain-level events); fall back to `pipelineId` (pipeline-level events); use `'?'` only for boundary/dropped-events records.

**Alternative considered:** Always show both when present (`order/payment`). Rejected — most events belong to one scope; the extra slash adds noise. The full IDs are always available in the JSON export.

### D2 — Drop `level/` prefix and trailing `status`

The `level` field is redundant with the first token of `type`. The `status` field is useful for programmatic filtering on the event object but adds noise to a human-readable line. Both are retained on event objects; neither appears in the text line.

**Alternative considered:** Keep `status` only when it diverges from the type's implied outcome. Rejected — inconsistent rendering is harder to parse visually than consistently dropping it.

## Risks / Trade-offs

- **[Breaking change for text-parsers]** Any downstream code that parses `export('text')` line-by-line will break. Acceptable: the text format is documented as human-readable, not machine-parseable; JSON is the stable programmatic format.
- **[Spec delta required]** `openspec/specs/tracer/spec.md` has a scenario for the text export — it needs a MODIFIED entry in this change's delta spec.
