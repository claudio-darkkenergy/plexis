## Why

The API reference is a single 879-line page that mixes every symbol together and carries no usage examples — readers must jump to the guides to see how a function is actually called, and the guides in turn re-explain signatures the reference already owns. Adopting the MDN-style pattern (each symbol documented *with* a short inline example) and splitting the monolithic page by section makes the reference both self-sufficient and navigable, and frees the guides to be organized around use cases (common → advanced → edge cases) rather than API surface.

## What Changes

- **Inline examples on the API reference.** Every documented function, method, and helper gains a short, focused **Examples** snippet next to its signature and parameter/return tables (the MDN `WeakMap` pattern), so each entry is self-sufficient without leaving the page.
- **Split the monolithic API page by section.** `reference/api.mdx` is broken into one page per H2 section — Definition Functions, Registration Helpers, Handler Input Types, Tracer, Domain Instance, Pipeline Instance, Errors, and Key Types — under `reference/`, with a Reference overview/index page linking them.
- **Reference sidebar becomes a multi-page group.** `astro.config.mjs` replaces the single `{ label: 'API' }` link with a Reference group enumerating the new per-section pages.
- **Reposition the Guides IA around use cases.** Guides are framed as common-use-case → advanced → edge-case progressions rather than per-symbol explainers; the existing input/output-separation and name-emphasis conventions carry over to every new reference page.
- **Out of scope (deliberate follow-up).** Authoring net-new high-value guide content (e.g. composition examples) is *not* part of this change — it will be scoped in a separate `/opsx:explore` pass informed by the reorganized reference's gaps.

## Capabilities

### New Capabilities
<!-- none — this is an information-architecture change to the existing docs site -->

### Modified Capabilities
- `docs-site`: The "complete content structure" and "sidebar navigation" requirements change to reflect a multi-page Reference section; the "API reference documents the complete public surface" requirement is restated so the surface is documented across the per-section pages rather than a single `api.mdx`; a new requirement mandates inline usage examples on every documented symbol; the input/output-separation requirement is restated to apply per-page.

## Impact

- **Docs content**: `apps/docs/src/content/docs/reference/api.mdx` is split into ~8 new section pages plus a reference index; guide front-matter/positioning may be adjusted.
- **Site config**: `apps/docs/astro.config.mjs` sidebar.
- **Spec**: `openspec/specs/docs-site/spec.md` (modified via delta).
- **No library/runtime code changes.** Zero impact on `packages/plexis`.
