## Why

The existing examples only run in the terminal via `tsx`. Developers evaluating Plexis benefit from being able to run demos in a browser without a build step — seeing formatted output in a page rather than a console. Vite's dev server transforms TypeScript on the fly, so the existing `.ts` example files can be reused directly without duplication.

## What Changes

- Add Vite as a `devDependency`.
- Add `npm run dev` script that launches Vite serving `examples/`.
- Add `examples/index.html` — a single-page demo shell that lets users pick an example, run it, and see console output rendered in the page (via a thin `console.log` capture shim). No changes to the existing `examples/*.ts` files.
- Add `vite.config.ts` at root (or `examples/vite.config.ts`) configured to serve the `examples/` directory with the `src/` root aliased so `.ts` imports resolve correctly.
- The terminal workflow (`npm run example:*` via tsx) remains unchanged.

## Capabilities

### New Capabilities

- `browser-demos`: A Vite-powered dev page at `localhost:5173` that runs any of the three examples in the browser, rendering console output to the DOM.

### Modified Capabilities

## Impact

- **New devDependency**: `vite` (dev-only; zero impact on published artifact).
- **New files**: `vite.config.ts`, `examples/index.html`.
- **Modified**: `package.json` — add `dev` script.
- **Unchanged**: all `examples/*.ts` source files, all `src/` runtime files, all tests.
