## Why

Plexis has no public-facing README. Without one, the project lacks a discoverable entry point: developers can't understand what it does, how to install it, or how to start using it in under a minute.

## What Changes

- Add a `README.md` at the repo root covering project purpose, installation, quick-start usage, API overview, and links to deeper documentation
- The README targets library consumers (not contributors), so it leads with the composable API (`defineDomain`, `definePipeline`) rather than internals

## Capabilities

### New Capabilities

- `readme`: Top-level `README.md` document for the Plexis library — covers what it is, installation, quick-start example, core concepts, and links to the spec

### Modified Capabilities

<!-- none — this change only adds documentation, no spec-level behavior changes -->

## Impact

- `README.md` (new file at repo root)
- No runtime code, types, or build configuration affected
- No breaking changes
