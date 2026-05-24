# Plexis

[![CI](https://github.com/claudio-darkkenergy/plexis/actions/workflows/ci.yml/badge.svg)](https://github.com/claudio-darkkenergy/plexis/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/plexis)](https://www.npmjs.com/package/plexis)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

Zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines.

> **Pre-release** — API is stable; npm publication pending.

## Installation

```sh
npm install plexis
# pnpm add plexis
# yarn add plexis
```

## Quick Start

```typescript
import { defineDomain, definePipeline, state, edge, node, fork, terminal } from 'plexis';

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

## License

MIT — see [LICENSE](LICENSE)
