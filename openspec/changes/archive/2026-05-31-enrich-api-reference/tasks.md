## 1. Audit and prep

- [x] 1.1 Cross-reference `apps/docs/src/content/docs/reference/api.mdx` against `packages/plexis/src/index.ts` exports and `packages/plexis/src/types.ts` shapes; list every missing symbol/field and every undocumented default.
- [x] 1.2 Collect default values for `strict`, `errorPolicy`, and all `TracerOptions` fields from `.specs/plexis-composable-spec.md` (and the reference impl); mark any with no stated default as `—`.

## 2. Establish the table convention

- [x] 2.1 Decide and apply the standard column set `Field | Type | Required | Default | Description` (per design Decision 2); field name in backticks and leading, type in backticks plain weight.
- [x] 2.2 Convert each function/method section to separate **Parameters** and **Returns** tables (per design Decision 1); omit an all-empty `Default` column on a per-table basis.

## 3. Definition functions section

- [x] 3.1 Rework `defineDomain` with Parameters (`id`, `setup`, `options?`) + `DomainSetupResult` (incl. `context`, `initial`, `strict` default, `errorPolicy`) and `DefineDomainOptions` (`tracer`, `merge`) tables using the convention.
- [x] 3.2 Rework `definePipeline` with Parameters + `PipelineSetupResult` and `DefinePipelineOptions` tables.
- [x] 3.3 Document `MergeMetadata` (fields `phase`, `domainId?`, `pipelineId?`, `nodeId?`, `stateId?`, `event?`) referenced by custom `merge`.

## 4. Registration helpers + input types

- [x] 4.1 Update `state` / `StateNodeDef` table to the convention and add the missing `metadata` field.
- [x] 4.2 Update `edge` / `EdgeDef` table; add `metadata`.
- [x] 4.3 Update `node` / `PipelineNodeDef` table; add `metadata`.
- [x] 4.4 Update `fork` / `PipelineForkDef` (params + def fields incl. `metadata`); document the `undefined` condition meaning.
- [x] 4.5 Update `terminal` to the convention.
- [x] 4.6 Add handler input-type tables: `GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, `PipelineConditionInput`.

## 5. Tracer section

- [x] 5.1 Document the full `TracerOptions` table (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`) with required/default columns.
- [x] 5.2 Keep/convert the `Tracer` methods table to the convention.

## 6. Domain & Pipeline instance sections

- [x] 6.1 Convert the Domain instance member table to the convention, splitting argument-taking members (e.g. `follow`, `followFrom`, `can`, `inspectNode`) into Parameters + Returns.
- [x] 6.2 Add the `DomainGraph` query-API table (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, `observedPathsTo`, `observedPathsFrom`) with params + returns.
- [x] 6.3 Convert the Pipeline instance member table to the convention, splitting `run` / `inspectNode`.
- [x] 6.4 Add the `PipelineGraph` query-API table (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`).
- [x] 6.5 Document `PathQueryOptions` (`maxDepth`, `includeCycles`, `includeCrossBoundary`, `direction`) used by the graph/inspect methods.

## 7. Result & supporting types

- [x] 7.1 Replace the inline `DomainFollowResult` summary with a full field table (`status` enum, `event`, `from`, `to?`, `context`, `traceId`, `error?`).
- [x] 7.2 Replace the inline `PipelineRunResult` summary with a full field table (`status` enum, `pipelineId`, `finalNode`, `context`, `traceId`, `localTrace`, `error?`).
- [x] 7.3 Add/convert tables for `DomainSnapshot`, `DomainHistoryEntry`, and `NodeInspection` (incl. `runtimeStats?`).
- [x] 7.4 Document `GraphDescriptor` shape and keep the `PlexisError` codes; ensure `PatchLike` and `ErrorPolicy` remain in the Key Types section.

## 8. Verify

- [x] 8.1 Re-check every table against `types.ts` for type/optionality accuracy; confirm no fabricated defaults remain.
- [x] 8.2 Confirm every spec scenario in `specs/docs-site/spec.md` is satisfied by the rewritten page.
- [x] 8.3 Run `pnpm --filter @tde.io/docs build` (or `pnpm docs:build`) and confirm it exits 0 with no MDX/table errors.
- [x] 8.4 Spot-check rendered output (dev server) to confirm field-name emphasis and Parameters/Returns separation read clearly in the Gruvbox theme.
