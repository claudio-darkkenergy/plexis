## Context

The `examples/` directory has three TypeScript demo files that run via `tsx` in the terminal. The library itself is fully browser-compatible (`crypto.randomUUID()` works in Chrome 92+, Firefox 95+, Safari 15.4+; no Node.js-specific APIs). The gap is purely toolchain: `tsx` is Node-only. Vite bridges this: it runs a dev server that transforms `.ts` on the fly via esbuild before sending JS to the browser.

## Goals / Non-Goals

**Goals:**
- `npm run dev` launches a Vite dev server at `localhost:5173` serving `examples/index.html`.
- All three existing `examples/*.ts` files are usable from the browser without modification.
- Console output from each example is captured and rendered into the page.
- `npm run example:*` (tsx, terminal) continues to work unchanged.

**Non-Goals:**
- No hosted/deployed demo (GitHub Pages, etc.) — local dev only.
- No React, Vue, or other UI framework — plain HTML + vanilla JS shim.
- No code editor or live-edit UI in the browser.
- No duplicate browser-specific versions of example files.

## Decisions

### D1 — Single `examples/index.html` with a tab/button per example

One HTML page with three trigger buttons. Clicking a button clears output and dynamically re-imports the example module. Vite handles the `.ts` import.

**Alternative considered:** Three separate `examples/payment.html` etc. pages. Rejected — more files, worse demo UX; a unified page is simpler to navigate.

### D2 — `console.log` shim injected into the page before example import

The page replaces `console.log` (and `console.error`) with a function that appends to a `<pre>` element. Since examples use `console.log` throughout, no example code changes are needed.

Objects are serialized via `JSON.stringify(val, null, 2)` for readable output. The shim also forwards to the original `console.log` so devtools still work.

**Alternative considered:** Rewrite examples with a pluggable `print` function. Rejected — breaks the terminal examples and adds boilerplate.

### D3 — Vite config with `root: 'examples'` and alias `../src → /src`

`vite.config.ts` sets `root: 'examples'` so `index.html` is the entry. An alias maps `../src` → the actual `src/` directory so the TypeScript imports in example files resolve. Vite's built-in TypeScript support (esbuild) handles the rest.

**Alternative considered:** `root: '.'` with examples as a sub-path. Works but requires the HTML to live at root, cluttering the project. Rejected.

### D4 — Dynamic re-import using cache-busting query param

Each button click does:
```js
await import(`./payment-pipeline.ts?t=${Date.now()}`);
```

The `?t=` cache buster forces Vite to re-execute the module on each click, so the demo reruns without a page reload.

**Alternative considered:** `import()` without cache buster — module is cached after first run, demo cannot be rerun. Rejected.

## Risks / Trade-offs

- **[Risk]** Vite version incompatibility with TypeScript 6 → **Mitigation**: Vite 6.x supports TS 5/6 via esbuild; pin `vite@^6`.
- **[Trade-off]** Dynamic re-import with `?t=` is a Vite-specific behavior — standard ES module spec would not allow this. Acceptable for a dev-only demo tool.

## Open Questions

None — scope is narrow and decisions are clear.
