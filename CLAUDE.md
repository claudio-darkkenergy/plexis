# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Plexis** is a zero-dependency TypeScript library being built here. It models business state with domain-level state machines (`Domain`) and finite workflow pipelines (`Pipeline`).

This repository implements the **composable API** — the second-generation authoring style using `defineDomain()`/`definePipeline()` setup functions rather than large options objects. The full specification is in `.specs/plexis-composable-spec.md`.

> `.specs/plexis/` contains a reference implementation of the **original** options-based API (`createMachine`/`createPipeline`). It is useful for understanding runtime semantics but is **not the target API** being built here.

## Current State

The project is in early implementation. So far:

- `src/types.ts` — Complete TypeScript interface definitions for the entire composable API
- `src/tsconfig*.json` — Build configurations for ESM, CJS, and types outputs
- Root `package.json` — Minimal; build scripts and test infrastructure not yet configured

## Composable Authoring API

The public API uses setup functions with registration helpers instead of large config objects:

```ts
import { defineDomain, definePipeline, state, edge, node, fork, terminal } from 'plexis';

const payment = definePipeline('payment', () => {
  node('validate-card', {
    action: async (ctx) => ({ cardChecked: true }),
    forks: [
      fork((ctx) => ctx.cardValid, 'charge', { label: 'card-ok' }),
      fork((ctx) => !ctx.cardValid, 'decline', { label: 'card-invalid' }),
    ],
  });
  node('charge', terminal());
  node('decline', terminal());
  return { initial: 'validate-card' };
});

const order = defineDomain('order', () => {
  state('pending', {
    edges: {
      SUBMIT: edge({ target: 'processing', pipeline: payment }),
    },
  });
  state('processing', { edges: {} });
  state('done', { terminal: true });
  return { context: { orderId: null }, initial: 'pending', strict: true };
});
```

**Key difference from the old API:** setup functions run synchronously at definition time. Registration helpers (`state`, `edge`, `node`, `fork`, `terminal`) operate on a builder scope opened by `defineDomain`/`definePipeline`. Calling them outside an active builder scope throws `PlexisError` with code `BUILDER_CLOSED`.

## Architecture

### Two-layer model

**Domain** — durable business state that persists across time. Has states, edges (transitions), guards, actions, lifecycle hooks (`onEnter`/`onExit`), attached pipelines, history, and subscriptions.

**Pipeline** — a finite workflow that runs once per invocation. Has nodes, fork conditions (ordered, first-match-wins), actions, terminal nodes, and sub-pipeline embedding. Execution follows fork targets from `initial`, not registration order.

### Context and patches

Context is immutable. All handlers return patches:

```ts
// Patch returned — merged as: nextContext = { ...prev, ...patch }
action: async (ctx, input) => ({ processed: true })

// No change
action: async () => {}
```

Custom merge can be provided in `DefineDomainOptions` / `DefinePipelineOptions`.

### Domain execution order (on `follow(event, payload)`)

1. Guard check — blocks if false, no side effects run
2. `onExit` for current state
3. Edge action
4. Edge pipeline
5. State transitions to target
6. `onEnter` for target state
7. State entry pipeline
8. History recorded, subscribers notified

### Pipeline execution order (on `run(context, input?)`)

1. Start at `initial` node
2. Run node action, merge patch
3. Evaluate `forks` array in order — first matching condition wins
4. Follow fork target (string node or sub-Pipeline)
5. Repeat until terminal node or no matching fork
6. Return `PipelineRunResult`

### Key types in `src/types.ts`

| Type | Role |
|---|---|
| `Domain<TContext, TEdges>` | Runtime domain instance interface |
| `Pipeline<TContext>` | Runtime pipeline instance interface |
| `DomainConfig` | Config shape for the internal builder |
| `StateNodeDef` | Single state with edges, hooks, pipeline |
| `EdgeDef` | Edge with guard, action, pipeline |
| `PipelineNodeDef` | Node with action, forks |
| `PipelineForkDef` | Fork with condition, target, label |
| `DomainFollowResult` | Return from `domain.follow()` |
| `PipelineRunResult` | Return from `pipeline.run()` |
| `GraphDescriptor` | Static graph representation |
| `NodeInspection` | Node + paths + attached pipelines |
| `PlexisError` | Typed error with `code`, `domainId`, `pipelineId` |

### TypeScript edge inference

Use `as const` to get typed `follow()` and `can()`:

```ts
const order = defineDomain('order', () => {
  state('pending', { edges: { SUBMIT: edge({ target: 'processing' }) } });
  // ...
  return { context: {}, initial: 'pending' } as const;
});

await order.follow('SUBMIT');   // OK
await order.follow('CANCEL');   // TypeScript error
```

## Specification Reference

When implementing features, the authoritative spec is `.specs/plexis-composable-spec.md`. It covers:
- Definition lifecycle and builder scope
- Full Domain and Pipeline API surfaces
- Tracer event taxonomy and export formats
- Graph introspection API (`domain.graph`, `pipeline.graph`)
- Error codes and error policies
- Snapshot and restore semantics

## Development Workflow

This project uses **OpenSpec** for feature development:

- `/opsx:propose` — propose a new change and generate all artifacts
- `/opsx:explore` — think through ideas before implementing
- `/opsx:apply` — implement tasks from an open change
- `/opsx:archive` — finalize and archive a completed change

Active changes live in `openspec/changes/`. Completed work is archived in `openspec/changes/archive/`.

The project also enforces **TDD** (`/tdd-workflow`) and **SOLID principles** (`/solid-principles`). Run `/solid-audit` to audit for violations.

## Design Constraints

- **Zero dependencies** — no external packages in the published library
- **Async-first** — all handlers may be sync or async; runtime uses `await` throughout
- **Immutable context** — never mutate context; return patches from handlers
- **Sync setup** — `defineDomain`/`definePipeline` setup functions must be synchronous
- **Universal** — must run in Node.js, browsers, and serverless without polyfills
- **Build outputs** — must produce ESM (`dist/esm/`), CJS (`dist/cjs/`), and types (`dist/types/`)

## Skill Config Rule

If any change affects folder structure, import aliases, dependencies,
test configuration, or architectural conventions, update
`.claude/skills/skill-config.md` as part of that same task. This file
is the source of truth for all skill behavior in this project.
