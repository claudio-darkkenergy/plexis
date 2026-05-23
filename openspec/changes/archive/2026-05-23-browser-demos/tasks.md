## 1. Vite Setup

- [x] 1.1 Add `vite` to `devDependencies` in root `package.json`
- [x] 1.2 Add `"dev": "vite examples"` script to root `package.json`
- [x] 1.3 Create `vite.config.ts` at root: set `root: 'examples'`, add resolve alias `'../src'` → `path.resolve(__dirname, 'src')` so example imports resolve through Vite

## 2. Demo Page (`examples/index.html`)

- [x] 2.1 Create `examples/index.html` with a minimal layout: page title, three buttons (Payment Pipeline, Order Domain, Graph Inspection), and a `<pre id="output">` element for rendered output
- [x] 2.2 Add an inline `<script>` block that patches `console.log` and `console.error` to append to the `<pre>` element (objects serialized via `JSON.stringify(val, null, 2)`); retain original console functions so devtools still receive output
- [x] 2.3 Wire each button to a handler that clears the output panel and dynamically imports the corresponding `.ts` file with a `?t=${Date.now()}` cache-buster so re-runs work without a page reload
- [x] 2.4 Add basic CSS inline: monospace font, readable line height, a clear visual separation between the buttons and output panel; keep it minimal — this is a demo, not a product

## 3. Verification

- [x] 3.1 Run `npm run dev`, open `localhost:5173` in the browser, click each button, and confirm output appears in the page
- [x] 3.2 Click the same button twice and confirm the output clears and re-populates (re-execution works)
- [x] 3.3 Confirm `npm run example:payment`, `npm run example:order`, and `npm run example:graph` still exit 0 (terminal workflow unaffected)
- [x] 3.4 Run `npm run typecheck` — zero errors
