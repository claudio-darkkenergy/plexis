## Why

The `tracer.export('text')` format currently renders all pipeline events under the pipeline id alone (e.g. `[payment] pipeline-node.started`). When a pipeline has multiple nodes, every `pipeline-node`, `action`, `condition`, and `fork` event looks identical in the timeline — it's impossible to tell which node is executing without inspecting the raw JSON. The same gap exists on the domain side: `guard.*` and `state.*` events carry a `stateId` that isn't surfaced, so you can't see which state a guard evaluated on.

Both `nodeId` (pipeline) and `stateId` (domain) are already present on the relevant events — they just aren't included in the text line.

## What Changes

- Extend the `export('text')` line format from `[scope] type` to `[scope/sub-scope] type`, where:
  - `sub-scope` is `nodeId` when present (pipeline-node, action, condition, fork events)
  - `sub-scope` is `stateId` when present (guard, state.exit, state.enter events)
  - `sub-scope` is omitted for events that have neither (pipeline.started, domain.follow.started, etc.)
- One-line change to `src/core/tracer.js`.
- Update the `export('text')` test and add a node-scope assertion.

**Before:**
```
[payment] pipeline-node.started
[payment] action.started
[payment] pipeline-node.started   ← can't distinguish nodes
[payment] pipeline.completed
[order]   guard.passed
[order]   state.exit
```

**After:**
```
[payment/validate-card] pipeline-node.started
[payment/validate-card] action.started
[payment/fraud-check]   pipeline-node.started
[payment]               pipeline.completed
[order/pending]         guard.passed
[order/pending]         state.exit
[order/processing]      state.enter
[order]                 domain.follow.completed
```

## Capabilities

### New Capabilities

### Modified Capabilities

- `tracer`: The `export('text')` output format gains a sub-scope segment when `nodeId` or `stateId` is present on the event.

## Impact

- **Modified**: `src/core/tracer.js` (one line), `tests/tracer.test.ts` (format assertions), `openspec/specs/tracer/spec.md` (text format scenario).
- No API surface change. `export('json')` and `export('tree')` are unchanged.
- Example output improves automatically.
