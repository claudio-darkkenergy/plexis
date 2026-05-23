## Context

`Tracer.export('text')` was updated in `tracer-text-format` to produce `[timestamp] [scope] type`, where `scope` is `domainId ?? pipelineId`. The events themselves already carry `nodeId` (on pipeline-node, action, condition, fork events) and `stateId` (on guard, state.exit/enter events) — these fields are populated by the emitting code in `domain.js` and `pipeline.js` and are visible in `export('json')`. The text format simply doesn't use them yet.

## Goals / Non-Goals

**Goals:**
- Text lines include a sub-scope segment (`/nodeId` or `/stateId`) when the event carries one.
- Events without a sub-scope (`pipeline.started`, `domain.follow.started`, etc.) are unchanged.
- One-line change to `tracer.js`. No changes to event emission in `domain.js` or `pipeline.js`.

**Non-Goals:**
- No changes to event field names or the `level`/`status`/`nodeId`/`stateId` fields themselves.
- No changes to `export('json')` or `export('tree')`.

## Decisions

### D1 — Format: `[scope/sub-scope]` with `/` separator

The scope bracket becomes `[pipelineId/nodeId]` or `[domainId/stateId]`. The `/` reads naturally as a path ("inside pipeline `payment`, at node `validate-card`").

**Alternative considered:** A space: `[payment validate-card]`. Rejected — harder to parse visually and breaks the bracket-as-single-token feel.

**Alternative considered:** Two separate brackets: `[payment] [validate-card]`. Rejected — doubles the prefix width for every event that has a sub-scope.

### D2 — Sub-scope priority: `nodeId` over `stateId`; omit when absent

```js
const sub = e.nodeId ?? e.stateId;
const scope = (e.domainId ?? e.pipelineId ?? '?') + (sub ? `/${sub}` : '');
```

Events that have both (unlikely in current implementation, but possible in future cross-boundary traces) would show `nodeId`. Events that have neither show just the primary scope — unchanged from the previous format.

## Risks / Trade-offs

- **[Breaking change for text-parsers]** Same caveat as the previous text-format change: the text format is documented as human-readable, not machine-parseable; JSON is the stable programmatic format.
