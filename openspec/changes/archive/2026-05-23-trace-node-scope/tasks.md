## 1. Implementation

- [x] 1.1 Update the `export('text')` case in `src/core/tracer.js`: compute `sub = e.nodeId ?? e.stateId` and set `scope = (e.domainId ?? e.pipelineId ?? '?') + (sub ? \`/${sub}\` : '')`, then render `` `[${e.timestamp}] [${scope}] ${e.type}` ``

## 2. Tests

- [x] 2.1 Update the existing `export("text") uses [timestamp] [scope] type format` test to assert that lines with a `nodeId` match `[pipelineId/nodeId]` — record a `pipeline-node.started` event with both `pipelineId` and `nodeId` and assert the sub-scope appears
- [x] 2.2 Add test: `export("text") includes nodeId in scope for pipeline-node events` — record with `pipelineId: 'pay'` and `nodeId: 'charge'`, assert line contains `[pay/charge]`
- [x] 2.3 Add test: `export("text") includes stateId in scope for guard events` — record with `domainId: 'order'` and `stateId: 'pending'`, assert line contains `[order/pending]`
- [x] 2.4 Add test: `export("text") omits sub-scope when neither nodeId nor stateId present` — record with only `pipelineId`, assert line contains `[pipelineId]` with no `/`

## 3. Verification

- [x] 3.1 Run `npm test` — 112 tests pass
- [x] 3.2 Run `npm run example:payment` and confirm trace lines show node ids (e.g. `[payment/validate-card] pipeline-node.started`)
