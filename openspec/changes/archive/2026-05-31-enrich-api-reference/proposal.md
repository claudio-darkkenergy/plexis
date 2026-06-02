## Why

The API reference page (`apps/docs/src/content/docs/reference/api.mdx`) is hard to read and incomplete. Its tables don't distinguish input parameters from return-value structure, never indicate whether a field is required or optional, and show no default values. The field name — the single most important detail — is just another column, visually no louder than `Type`. Several parts of the public surface are also undocumented: `TracerOptions`, the graph query APIs (`DomainGraph`/`PipelineGraph` methods), handler input types (`GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, `PipelineConditionInput`), the `metadata` field on definitions, `MergeMetadata`, and the full field tables for result types (`DomainFollowResult`, `PipelineRunResult`, `NodeInspection`).

## What Changes

- **Audit coverage** of `api.mdx` against the actual public surface in `packages/plexis/src/index.ts` / `types.ts` and document every gap:
  - `TracerOptions` fields (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`).
  - `DomainGraph` / `PipelineGraph` query methods (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, plus domain-only `observedPathsTo`/`observedPathsFrom`).
  - Handler input types: `GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, `PipelineConditionInput`.
  - The `metadata` field on `StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, and `PipelineForkDef`.
  - `MergeMetadata` shape used by custom `merge` functions.
  - Full field tables for `DomainFollowResult`, `PipelineRunResult`, `DomainSnapshot`, `DomainHistoryEntry`, `NodeInspection`, `GraphDescriptor`, `PathQueryOptions`, `PatchLike`.
- **Adopt a consistent readability convention** across the page so a reader can tell at a glance what is input vs. output:
  - Separate **Parameters** sections from **Returns** sections for every function/method.
  - Add a **Required** indicator and a **Default** column (or equivalent) so optionality and defaults are explicit.
  - Make the **field name** the visually dominant element (leading column, code-formatted/emphasized) and standardize column order.
- **Apply the convention to every existing table** on the page, not just new content.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities

- `docs-site`: The "Starlight site has a complete content structure" requirement's API-reference behavior is strengthened — the API reference page MUST document the complete public surface (not just the top-level named exports) and MUST follow a readability convention that distinguishes parameters from return values, marks required/optional and default values, and emphasizes field names.

## Impact

- **Content**: `apps/docs/src/content/docs/reference/api.mdx` (rewrite/restructure).
- **Spec**: `openspec/specs/docs-site/spec.md` (delta to the content-structure requirement).
- **No source/runtime changes** — this is documentation-only. No change to `packages/plexis/src/**` or the published library.
- **Risk**: low; purely additive documentation. Must stay faithful to `types.ts` so docs don't drift from the real signatures.
