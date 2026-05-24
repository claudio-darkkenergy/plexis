## Context

Plexis is a zero-dependency TypeScript library with a composable API (`defineDomain`, `definePipeline`). It has full type definitions, a detailed spec, and reference implementations — but no `README.md`. Developers landing on the repo have no quick orientation.

## Goals / Non-Goals

**Goals:**
- Give developers a < 2-minute path from "what is this?" to "I can try it"
- Showcase the composable API with a realistic but compact example
- Surface the two-layer model (Domain vs. Pipeline) at a conceptual level
- Link to the authoritative spec for deeper reading

**Non-Goals:**
- Full API reference (that belongs in the spec or generated docs)
- Contributor/development guide (that's a future CONTRIBUTING.md)
- Changelog or roadmap

## Decisions

**Lead with the composable API, not `createMachine`/`createPipeline`.**
The old options-based API in `.specs/plexis/` is the reference, not the target. The README must reflect the current authoring style to avoid confusion.

**Single end-to-end example over multiple small snippets.**
A cohesive `defineDomain` + `definePipeline` example teaches context, edges, pipelines, and forks together. Fragmented snippets would obscure how the pieces connect.

**Minimal badge set (build status, npm version, license).**
Badges signal maturity at a glance. More than three clutters the header without adding value at this stage.

**Section order: badge bar → one-liner → install → quick-start → concepts → links.**
This mirrors the progressive disclosure pattern used by well-adopted TypeScript libraries (e.g., xstate, zod). Each section answers the next question a developer would have.

## Risks / Trade-offs

[Install instructions reference a package not yet published to npm] → Mitigation: note the package name as the intended name; add a note that the library is pre-release if appropriate.

[Quick-start example may drift from the actual API as implementation evolves] → Mitigation: the example is drawn directly from `src/types.ts` signatures and the composable spec — reviewers should verify it compiles against the current types before merging.
