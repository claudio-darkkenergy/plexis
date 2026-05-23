## ADDED Requirements

### Requirement: `npm run dev` serves a browser demo page

The repository SHALL provide a `dev` npm script that launches a Vite dev server. Navigating to the server root SHALL display a demo page (`examples/index.html`) in the browser.

#### Scenario: Dev server starts and serves the demo page

- **WHEN** a developer runs `npm run dev`
- **THEN** a Vite dev server SHALL start on a local port (default `5173`) and the root URL SHALL serve `examples/index.html`

### Requirement: Demo page runs each example and renders output

The demo page SHALL present one control per example (payment pipeline, order domain, graph inspection). Activating a control SHALL execute the corresponding example module and render its `console.log` output into the page.

#### Scenario: Running the payment pipeline example displays output

- **WHEN** the user activates the payment pipeline example control
- **THEN** the page SHALL display the final node, context, and trace output produced by `examples/payment-pipeline.ts` without requiring a page reload

#### Scenario: Running an example a second time re-executes it

- **WHEN** the user activates the same example control twice
- **THEN** the output panel SHALL clear and re-populate with fresh output from a new execution

### Requirement: Existing terminal examples are unmodified

The `examples/*.ts` files used by the browser demo SHALL be identical to those used by the `npm run example:*` scripts. No browser-specific fork of the example source files SHALL be created.

#### Scenario: Terminal examples still exit 0 after browser demo integration

- **WHEN** `npm run example:payment`, `npm run example:order`, and `npm run example:graph` are run after the browser demo is added
- **THEN** each SHALL exit with code 0 and produce the same output as before
