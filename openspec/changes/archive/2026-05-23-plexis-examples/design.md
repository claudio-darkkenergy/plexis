## Context

The Plexis library implementation is complete (`bootstrap-plexis-core` archived). All runtime source lives under `src/core/` and `src/graph/`; the public barrel is `src/index.js`. The existing reference examples in `.specs/plexis/examples/` use the old `createMachine`/`createPipeline` options-based API and import from a different path — they cannot be run against the current implementation.

The goal is a small `examples/` folder that any developer can clone, install, and run immediately to see the library working end-to-end.

## Goals / Non-Goals

**Goals:**
- Three self-contained example files, each runnable with a single `npm run example:*` command.
- Cover the key composable-API surface: `defineDomain`, `definePipeline`, `createTracer`, `state`, `edge`, `node`, `fork`, `terminal`, `follow`, `can`, `followFrom`, `snapshot`/`restore`, `history`, `run`, `inspectNode`, `graph`, `describe`.
- Demonstrate branching, guards, lifecycle hooks, edge pipelines, and trace export.
- Type-check cleanly with the existing `src/types.ts`.

**Non-Goals:**
- No new runtime features or spec changes.
- No published artifact changes (examples are dev-only).
- No new permanent devDependencies beyond `tsx` (added only to enable `npm run example:*`).
- No test files for the examples (they are demo scripts, not test cases).

## Decisions

### D1 — Import from `src/index.js`, not from `dist/`

Examples import directly from the source barrel (`../src/index.js`). This keeps the dev feedback loop tight (no build step before running) and avoids a stale `dist/` dependency.

**Alternative considered:** import from `dist/esm/index.js` (built artifact). Rejected — requires `npm run build` before every example run, which hurts the onboarding experience.

### D2 — Runner: `tsx` via `npx`

`tsx` executes TypeScript files natively in Node.js without a separate compile step. Added as a `devDependency` so `npm run example:*` works out of the box.

**Alternative considered:** `ts-node`. Less maintained and requires additional ESM configuration. `tsx` has simpler zero-config ESM support.

### D3 — Shared `examples/tsconfig.json`

A minimal `examples/tsconfig.json` extends the root `tsconfig.json` and adds `../src` to `paths`/`rootDirs` so TypeScript resolves the source files correctly from inside `examples/`. This keeps type checking clean without needing a full build.

### D4 — Three examples, each focused on one axis

| File | Primary axis |
|---|---|
| `order-domain.ts` | Domain lifecycle — states, edges, guard, action, pipeline, hooks, history |
| `payment-pipeline.ts` | Pipeline execution — nodes, forks, branching, trace export |
| `graph-inspection.ts` | Static introspection — `inspectNode`, paths, cross-boundary, `describe()` |

`graph-inspection.ts` intentionally reuses the same domain + pipeline from the other two files (inlined) so it is self-contained, but recognizably the same scenario.

## Risks / Trade-offs

- **[Risk]** `tsx` version incompatibility with TypeScript 6 → **Mitigation**: pin `tsx` to latest stable (`^4.x`) which tracks TS 5–6.
- **[Trade-off]** Importing from `src/` rather than `dist/` means examples wouldn't work in a bare `npm install plexis` scenario — but that's acceptable for dev demos; the README can note this.

## Open Questions

None — scope is narrow and fully determined by the reference examples and the composable API surface.
