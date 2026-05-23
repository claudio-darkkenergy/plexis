## Why

The `tracer.export('text')` format currently renders each event as:

```
[timestamp] level/type status
```

producing output like `pipeline/pipeline.started started`. The `level/` prefix and trailing `status` word are both redundant with the `type` string — and for traces from shared tracers attached to multiple domains or pipelines, there is no scope identifier in the output at all, making it impossible to tell which domain or pipeline emitted each event.

## What Changes

- Change the `export('text')` format to `[timestamp] [scope] type` where `scope` is `domainId ?? pipelineId ?? '?'`.
- Drop the `level/` prefix and trailing `status` word from the text format — both are already encoded in `type` (e.g. `guard.passed`, `pipeline.stopped`) or are redundant with it.
- No changes to event `type` names, the `level` field, the `status` field, or the JSON/tree export formats.
- Update `tracer.export('text')` in `src/core/tracer.js` — one line change.
- Update the `export('text')` test in `tests/tracer.test.ts` to assert the new format.

**Before:**
```
[1748912345678] pipeline/pipeline.started started
[1748912345678] action/action.completed completed
[1748912345678] guard/guard.passed completed
```

**After:**
```
[1748912345678] [payment] pipeline.started
[1748912345678] [payment] action.completed
[1748912345678] [order]   guard.passed
```

## Capabilities

### New Capabilities

### Modified Capabilities

- `tracer`: The `export('text')` output format changes. Any code that parses the text format string would need updating.

## Impact

- **Modified**: `src/core/tracer.js` (one line), `tests/tracer.test.ts` (one assertion), `openspec/specs/tracer/spec.md` (text export scenario).
- **No API surface change**: `export('text')` still returns a string; only the content changes.
- **Example output**: `examples/order-domain.ts` and `examples/payment-pipeline.ts` log `trace('text')` — their output will improve automatically.
