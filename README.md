# Plexis

[![Build](https://github.com/claudio-darkkenergy/plexis/actions/workflows/build.yml/badge.svg)](https://github.com/claudio-darkkenergy/plexis/actions/workflows/build.yml)
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

// Pipeline: runs once per invocation — validate then route to charge or decline.
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

## Repository Layout

```
packages/plexis/   — source and build of the published @tde.io/plexis package
apps/docs/         — reserved slot for the future documentation site (not yet scaffolded)
```

## CI & Releasing

Four GitHub Actions workflows form the delivery pipeline:

| Workflow | Trigger | What it does |
|---|---|---|
| **Build** (`build` job) | pull request, tag `v*.*.*` | Typechecks, builds, uploads `dist/` as artifact `plexis-dist` |
| **Build** (`test` job) | after `build` job succeeds | Downloads `plexis-dist`, runs `pnpm test` against it |
| **Publish** | tag `v*.*.*` | Waits for Build to succeed (both jobs), downloads `plexis-dist`, publishes to npm |

**To release a new version:**

1. Bump `packages/plexis/package.json` version and merge to `main`:
   ```bash
   cd packages/plexis && npm version patch --no-git-tag-version
   # or: pnpm --filter @tde.io/plexis exec npm version patch --no-git-tag-version
   git commit -am "release: vX.Y.Z" && git push
   ```
2. Push a tag matching the version — via CLI or GitHub UI:
   ```bash
   git tag v1.2.3 && git push origin v1.2.3
   ```
   Alternatively, create a release on GitHub (**Releases → Draft a new release**) and set the tag to `v1.2.3` there.
3. The Publish workflow verifies that the tag name matches `packages/plexis/package.json` version, then publishes `@tde.io/plexis@1.2.3` to npm.

The Publish workflow authenticates to npm via GitHub OIDC and publishes with npm provenance — no `NPM_TOKEN` secret is required.

## License

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) © Claudio Nunez Jr
