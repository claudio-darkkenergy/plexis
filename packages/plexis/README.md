# Plexis

[![Build, Test, and Publish](https://github.com/claudio-darkkenergy/plexis/actions/workflows/build.yml/badge.svg)](https://github.com/claudio-darkkenergy/plexis/actions/workflows/build.yml)
[![npm](https://img.shields.io/npm/v/@tde.io/plexis)](https://www.npmjs.com/package/@tde.io/plexis)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

Zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines.

## Installation

```bash
npm install @tde.io/plexis
# pnpm add @tde.io/plexis
# yarn add @tde.io/plexis
```

## Quick Start

```typescript
import { defineDomain, definePipeline, state, edge, node, fork, terminal } from '@tde.io/plexis';

type OrderContext = { cardValid: boolean };

// Pipeline: runs once per invocation — validate then route to charge or decline
const payment = definePipeline<OrderContext>('payment', () => {
  node('validate', {
    forks: [
      fork((ctx) => ctx.cardValid,  'charge',  { label: 'card-ok' }),
      fork((ctx) => !ctx.cardValid, 'decline', { label: 'card-invalid' }),
    ],
  });
  node('charge',  terminal());
  node('decline', terminal());
  return { initial: 'validate' };
});

// Domain: durable order state — pending → processing → fulfilled
const order = defineDomain<OrderContext>('order', () => {
  state('pending', {
    edges: {
      SUBMIT: edge({ target: 'processing', pipeline: payment }),
    },
  });
  state('processing', {
    edges: { FULFILL: edge({ target: 'fulfilled' }) },
  });
  state('fulfilled', { terminal: true });
  return { context: { cardValid: true }, initial: 'pending' } as const;
});

// Drive the domain forward
const result = await order.follow('SUBMIT');
console.log(result.status); // 'followed'
console.log(result.to);     // 'processing'
```

## Core Concepts

Plexis separates business logic into two layers:

**Domain** — durable state that persists across time. A domain has named states, transitions (edges) triggered by events, optional guards, lifecycle hooks (`onEnter`/`onExit`), and can invoke pipelines on transitions. Define one with `defineDomain()` and advance it with `domain.follow(event)`.

**Pipeline** — a finite, single-run workflow. Execution starts at the initial node and follows the first matching fork at each step until it reaches a terminal node. Define one with `definePipeline()` and run it with `pipeline.run(context)`.

The two layers compose naturally: an edge on a domain can invoke a pipeline, so workflow logic (validation, enrichment, side effects) lives in the pipeline while the domain tracks the resulting state.

## Zero Dependencies

Plexis has no runtime dependencies. It runs in Node.js ≥ 19, modern browsers, and serverless environments without polyfills.

## CI & Releasing

A single GitHub Actions workflow (`build.yml`) handles the entire delivery pipeline.

| Job | Trigger | What it does |
|---|---|---|
| `build` | pull request, tag `v*.*.*` | Typechecks and builds the code, then uploads `dist/` as the `plexis-dist` artifact. |
| `test` | after `build` succeeds | Downloads `plexis-dist` and runs `pnpm test` against it. |
| `publish` | tag `v*.*.*` (after `test` succeeds) | Downloads `plexis-dist` and publishes it to npm. |

**To release a new version:**

1.  Bump the version in `packages/plexis/package.json` and merge the change to `main`.
2.  Push a git tag that matches the new version (e.g., `git tag v1.2.3 && git push origin v1.2.3`).

The `publish` job, triggered by the tag, will verify the package version against the tag and then publish the package to npm with provenance via OIDC.

## License

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) © Claudio Nunez Jr
