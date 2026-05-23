## 1. Implementation

- [x] 1.1 In `src/core/tracer.js`, add a helper that formats `e.timestamp` (epoch ms) as local `HH:MM:SS.mmm` using `new Date(e.timestamp)` and `getHours/getMinutes/getSeconds/getMilliseconds` with zero-padding
- [x] 1.2 Update the `export('text')` template: replace `e.timestamp` with the formatted time string, and append `e.event` as a trailing token when present — final format: `` `[HH:MM:SS.mmm] [${scope}] ${e.type}${e.event ? ' ' + e.event : ''}` ``

## 2. Example tree renderer

- [x] 2.1 In `examples/order-domain.ts`, replace the `[root] type (N children)` renderer with one that shows `[scope/sub-scope] type event? (N children)` — compute scope from `root.domainId ?? root.pipelineId`, sub-scope from `root.stateId ?? root.nodeId`, and append `root.event` when present

## 3. Tests

- [x] 3.1 Update the existing `export("text") uses [timestamp] [scope] type format` test: update the regex to match `HH:MM:SS.mmm` instead of `\d+`, and assert the line ends with `SUBMIT` after adding `event: 'SUBMIT'` to the recorded event
- [x] 3.2 Add test: `export("text") renders timestamp as HH:MM:SS.mmm` — record any event, assert the first field in each line matches `/^\[\d{2}:\d{2}:\d{2}\.\d{3}\]/`
- [x] 3.3 Add test: `export("text") appends event name for domain events` — record `guard.started` with `domainId: 'order'`, `stateId: 'pending'`, `event: 'SUBMIT'`, assert line contains `[order/pending] guard.started SUBMIT`
- [x] 3.4 Add test: `export("text") omits event token for pipeline events` — record `pipeline-node.started` with `pipelineId` and `nodeId` but no `event` field, assert line has no trailing token after the type

## 4. Verification

- [x] 4.1 Run `npm test` — 115 tests pass
- [x] 4.2 Run `npm run example:order` and confirm both text trace lines and tree display show the domain id, state, and event name
