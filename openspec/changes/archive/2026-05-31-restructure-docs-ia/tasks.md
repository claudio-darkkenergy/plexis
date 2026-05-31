## 1. Prepare the Reference section structure

- [x] 1.1 Inventory every H3 symbol currently in `reference/api.mdx` (grouped by H2) to use as the split checklist and the no-symbol-dropped guard
- [x] 1.2 Decide and record the stable slug for each section page (`reference/definition-functions`, `reference/registration-helpers`, `reference/handler-inputs`, `reference/tracer`, `reference/domain`, `reference/pipeline`, `reference/errors`, `reference/types`)

## 2. Split the monolithic page into per-section pages

- [x] 2.1 Create `reference/definition-functions.mdx` (Definition Functions: `defineDomain`, `definePipeline`, `MergeMetadata`), demoting H3→H2, preserving Parameters/Return sections and field tables
- [x] 2.2 Create `reference/registration-helpers.mdx` (`state`, `edge`, `node`, `fork`, `terminal` + their def tables and `metadata` fields)
- [x] 2.3 Create `reference/handler-inputs.mdx` (`GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, `PipelineConditionInput`)
- [x] 2.4 Create `reference/tracer.mdx` (`createTracer`, full `TracerOptions`, `Tracer` methods)
- [x] 2.5 Create `reference/domain.mdx` (Domain instance members + `DomainGraph` query API)
- [x] 2.6 Create `reference/pipeline.mdx` (Pipeline instance members + `PipelineGraph` query API)
- [x] 2.7 Create `reference/errors.mdx` (`PlexisError` and error codes)
- [x] 2.8 Create `reference/types.mdx` (Key Types: `DomainFollowResult`, `PipelineRunResult`, `DomainSnapshot`, `DomainHistoryEntry`, `NodeInspection`, `GraphDescriptor`, `PatchLike`, `ErrorPolicy`, `TraceEvent`, `TraceLevel`, `TraceStatus`)
- [x] 2.9 Convert `reference/api.mdx` into a Reference overview/index page that links every section page
- [x] 2.10 Verify no symbol from the original page was dropped (cross-check against the 1.1 inventory)

## 3. Add inline usage examples (MDN pattern)

- [x] 3.1 Add a short `typescript` example to each definition function and registration helper, placed after its Parameters/Return tables, scoped to the symbol (minimal enclosing scope where needed, e.g. `fork` inside a `node`)
- [x] 3.2 Add a short `typescript` example to each documented Domain and Pipeline instance method
- [x] 3.3 Add brief construction/usage snippets to the tracer and key result types where an example clarifies usage
- [x] 3.4 Confirm every example uses the long-form `typescript` hint (no `ts` aliases) and references shapes faithful to `packages/plexis/src/types.ts`

## 4. Update navigation and guides framing

- [x] 4.1 Update `astro.config.mjs`: replace the single `reference/api` link with a Reference group enumerating the section pages in intentional order
- [x] 4.2 Reframe the Guides positioning text as a common → advanced → edge-case use-case progression; ensure guides link into the new reference pages rather than restating signatures
- [x] 4.3 Grep for and fix any `reference/api#...` anchor links elsewhere in the docs that the split would break

## 5. Verify

- [x] 5.1 Run `pnpm --filter @tde.io/docs build` and confirm it exits 0 with no broken-link warnings
- [x] 5.2 Spot-check the rendered Reference sidebar group and several section pages for correct headings, examples, and input/output convention
- [x] 5.3 Update `.claude/skills/skill-config.md` if the reference page structure/conventions changed in a way skills rely on
