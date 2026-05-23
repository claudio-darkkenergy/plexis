## 1. Project Setup

- [x] 1.1 Add `tsx` to `devDependencies` in root `package.json`
- [x] 1.2 Add `example:order`, `example:payment`, `example:graph` scripts to root `package.json` (each runs `tsx examples/<file>.ts`)
- [x] 1.3 Create `examples/tsconfig.json` that extends `../tsconfig.json`, sets `rootDir` to `.`, and includes `../src` so examples resolve source types without a build step

## 2. Payment Pipeline Example (`examples/payment-pipeline.ts`)

- [x] 2.1 Create `examples/payment-pipeline.ts` using `definePipeline`, `node`, `fork`, `terminal`, `createTracer`
- [x] 2.2 Wire the pipeline: `validate-card` → (`card-ok`) `fraud-check` → (`low-risk`) `charge` | (`high-risk`) `manual-review`; `validate-card` → (`card-invalid`) `decline`; all leaf nodes are `terminal`
- [x] 2.3 Add a `main()` that runs the pipeline twice: once with a valid card (starts with `'4'`) and once with an invalid card — log `finalNode` and `context` for each
- [x] 2.4 Log `pipeline.trace('text')` at the end
- [x] 2.5 Verify `npm run example:payment` exits 0 and prints expected output

## 3. Order Domain Example (`examples/order-domain.ts`)

- [x] 3.1 Create `examples/order-domain.ts`; inline a small `validationPipeline` (`definePipeline`) with nodes: `validate-order` → (`valid`) `check-payment` (terminal) | (`invalid`) `reject` (terminal)
- [x] 3.2 Define the domain with `defineDomain`: states `pending` (edges: `SUBMIT` with guard, action, and the inline pipeline), `processing` (onEnter, edges: `COMPLETE`), `done` (terminal); `strict: true`
- [x] 3.3 In `main()`: log initial state; call `follow('SUBMIT', { userId: 'u_1' })`; log result status, current state, and context
- [x] 3.4 Use `current.can('COMPLETE')` then `current.follow('COMPLETE')` to complete the order; log final state
- [x] 3.5 Demonstrate `snapshot()` and `restore()`: capture snapshot after SUBMIT, advance to done, restore, log state
- [x] 3.6 Wrap a `followFrom('pending', 'SUBMIT')` call in a try/catch after transitioning to processing — log the `STATE_MISMATCH` error code
- [x] 3.7 Log `domain.history()` entries in `from --EVENT--> to` format
- [x] 3.8 Log `domain.trace('tree')` (JSON.stringify with 2-space indent)
- [x] 3.9 Verify `npm run example:order` exits 0 and prints expected output

## 4. Graph Inspection Example (`examples/graph-inspection.ts`)

- [x] 4.1 Create `examples/graph-inspection.ts`; inline the same payment pipeline and order domain definitions (self-contained, no cross-file imports)
- [x] 4.2 Pipeline introspection section: call `pipeline.inspectNode('fraud-check')`, log inbound/outbound edge node ids, `pathsTo` node sequences, and `reachableNodes` ids
- [x] 4.3 Domain introspection section: call `domain.inspectNode('processing')`, log inbound/outbound edge events, and `domain.graph.reachableFrom('pending')` ids
- [x] 4.4 Descriptor section: call `domain.describe()`, log node ids and attachments (`kind:pipelineId`)
- [x] 4.5 Cross-boundary section: call `domain.inspectNode({ kind: 'pipeline-node', pipelineId: 'payment', nodeId: 'fraud-check' })` inside a try/catch; log result or caught error message
- [x] 4.6 Verify `npm run example:graph` exits 0 and prints expected output

## 5. Verification

- [x] 5.1 Run `npm run typecheck` (which includes `examples/` via tsconfig include pattern) — zero errors
- [x] 5.2 Run all three example scripts in sequence and confirm each exits 0
