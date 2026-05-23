## Why

Domain trace events carry an `event` field (e.g. `'SUBMIT'`, `'COMPLETE'`) that names the edge/event being followed — but this field is never surfaced in the text format or in the example tree renderer. The current output for a domain following `SUBMIT` looks like:

```
[order/pending] guard.started
[order/pending] guard.passed
[order] domain.follow.started
```

Without the event name you can't tell which edge triggered these events, making the timeline useless when a domain has multiple outgoing edges from the same state. Additionally, the `order-domain.ts` example renders the tree format as `[root] type (N children)`, discarding all scope information that the event objects actually carry.

## What Changes

- **Text format** (`src/core/tracer.js`): append the `event` field to the line when present — `[order/pending] guard.started SUBMIT`. Pipeline events are unaffected (they have no `event` field).
- **Example tree display** (`examples/order-domain.ts`): improve the abbreviated renderer to show `[scope/sub-scope] type event? (N children)` using the same scope logic as the text format.

**Before:**
```
[order/pending] guard.started
[order] domain.follow.started
--- tree ---
[root] guard.started (0 children)
[root] domain.follow.started (0 children)
```

**After:**
```
[order/pending] guard.started SUBMIT
[order] domain.follow.started SUBMIT
--- tree ---
[order/pending] guard.started SUBMIT (0 children)
[order] domain.follow.started SUBMIT (5 children)
```

## Capabilities

### New Capabilities

### Modified Capabilities

- `tracer`: `export('text')` lines gain an optional trailing `event` token when the event object carries an `event` field.
- `examples`: The `order-domain.ts` tree renderer displays scope and event context.

## Impact

- **Modified**: `src/core/tracer.js` (one line), `tests/tracer.test.ts` (one format test + one new test), `examples/order-domain.ts` (tree renderer).
- No changes to `export('json')`, `export('tree')`, or the event emission in `domain.js`/`pipeline.js`.
