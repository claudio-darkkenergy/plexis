## Why

The library now has a working implementation but no runnable demo files. Developers evaluating Plexis need tangible, copy-pasteable examples that show the composable API in action — the very style the codebase is built around.

## What Changes

- Add `examples/` directory at the repo root with three standalone TypeScript demo files, each runnable via `tsx` or `ts-node` in dev mode.
- **Example 1 — `order-domain.ts`**: A domain-level state machine for an e-commerce order lifecycle (pending → processing → done). Demonstrates `defineDomain`, `state`, `edge`, guard, edge action, attached edge pipeline, `onEnter` lifecycle hook, `follow`, `can`, `followFrom`, `snapshot`/`restore`, `history`, and tracer output.
- **Example 2 — `payment-pipeline.ts`**: A standalone payment processing pipeline (validate-card → fraud-check → charge | decline | manual-review). Demonstrates `definePipeline`, `node`, `fork`, `terminal`, branching logic, `run`, and trace export.
- **Example 3 — `graph-inspection.ts`**: Static graph introspection over both a domain and a pipeline — `inspectNode`, `pathsTo`, `pathsFrom`, `reachableFrom`, `inbound`/`outbound`, cross-boundary ref inspection, and `describe()`. Reuses the pipeline and domain from examples 1 and 2.

## Capabilities

### New Capabilities

- `examples`: Runnable demo files in `examples/` that exercise the composable API end-to-end.

### Modified Capabilities

## Impact

- **New code**: `examples/order-domain.ts`, `examples/payment-pipeline.ts`, `examples/graph-inspection.ts`.
- **New config**: `examples/tsconfig.json` pointing at `src/` types so examples type-check without a full build.
- **Package scripts**: Add `example:order`, `example:payment`, `example:graph` scripts to `package.json` using `tsx` (dev-only, not a published dependency).
- No published API changes. No runtime dependency changes.
