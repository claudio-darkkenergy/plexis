## 1. Implementation

- [x] 1.1 Update the `export('text')` case in `src/core/tracer.js`: change the line template from `` `[${e.timestamp}] ${e.level}/${e.type}${e.status ? ' ' + e.status : ''}` `` to `` `[${e.timestamp}] [${e.domainId ?? e.pipelineId ?? '?'}] ${e.type}` ``

## 2. Tests

- [x] 2.1 Update the `export("text") returns a string` test in `tests/tracer.test.ts` to assert the new format: each line should match `/^\[\d+\] \[.+\] \S+$/` (timestamp, bracketed scope, type token — no level prefix, no status suffix)
- [x] 2.2 Add a new test: `export("text") includes the emitting scope` — record events from two different pipelines on a shared tracer, call `export('text')`, and assert each line contains the correct pipeline id in brackets

## 3. Spec Sync

- [x] 3.1 Verify the MODIFIED requirement in `specs/tracer/spec.md` of this change matches the implementation; update if needed

## 4. Verification

- [x] 4.1 Run `npm test` — 109 tests pass
- [x] 4.2 Run `npm run example:payment` and confirm trace output uses the new `[payment] pipeline.started` format
- [x] 4.3 Run `npm run example:order` and confirm domain events show `[order]` scope
