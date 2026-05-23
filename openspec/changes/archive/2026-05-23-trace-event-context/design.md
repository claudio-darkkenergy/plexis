## Context

The text format is `[timestamp] [scope/sub-scope] type` after `tracer-text-format` and `trace-node-scope`. The `event` field is present on domain events (guard, action, state, domain.follow.*) but absent on pipeline events. Adding it as an optional trailing token keeps the format additive and backward-compatible in spirit (the text format is human-readable, not parsed).

The `order-domain.ts` example renders tree nodes with only `root.type` and `root.children.length`. The event objects also have `domainId`, `pipelineId`, `stateId`, `nodeId`, and `event` — exactly the fields needed to reproduce the scope that the text format already shows.

## Goals / Non-Goals

**Goals:**
- Text lines for domain events include the `event` name as a trailing token when present.
- Timestamp rendered as local `HH:MM:SS.mmm` instead of epoch milliseconds.
- The `order-domain.ts` tree renderer shows scope + event instead of `[root]`.
- One-line change to `tracer.js`. Small change to the example renderer.

**Non-Goals:**
- No changes to pipeline events (they have no `event` field — no change needed).
- No changes to `export('json')`, `export('tree')`, or event emission code.
- No changes to the `event` field name or meaning.
- The `timestamp` field on event objects stays as epoch milliseconds — only the text rendering changes.

## Decisions

### D1 — Event name as trailing token: `[scope/sub-scope] type event`

Appended after `type` with a space: `` `[${timestamp}] [${scope}] ${e.type}${e.event ? ' ' + e.event : ''}` ``

**Alternative considered:** Include event in scope bracket: `[order/pending:SUBMIT] guard.started`. Rejected — the bracket already encodes location (domain + state); the event name is the trigger, a different dimension, better kept separate.

**Alternative considered:** Wrap in brackets: `[order/pending] guard.started [SUBMIT]`. Acceptable but adds bracket noise. Plain trailing token is cleaner.

### D2 — Timestamp format: local `HH:MM:SS.mmm`

The epoch millisecond value (e.g. `1779571263261`) is replaced with local time `HH:MM:SS.mmm` derived from `new Date(e.timestamp)`. Local time is more useful than UTC for a dev tool. The `timestamp` field on the event object is unchanged — this is rendering-only.

**Alternative considered:** Relative offset (`+0ms`). Rejected — every event in a fast pipeline run fires within the same millisecond, so relative offset would show `+0ms` throughout, which is less informative than knowing when the run happened.

**Alternative considered:** Drop the timestamp. Rejected — meaningful for multi-`follow()` traces where you want to see when each state transition occurred.

### D3 — Example renderer: reproduce text-format scope logic inline

The tree renderer in `order-domain.ts` builds the scope string using the same `domainId ?? pipelineId` + `/(stateId ?? nodeId)` logic as the tracer. This keeps the display consistent with the text format without importing tracer internals.
