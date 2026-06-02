## ADDED Requirements

### Requirement: API reference documents the complete public surface

The API reference page (`apps/docs/src/content/docs/reference/api.mdx`) SHALL document the complete public surface of `@tde.io/plexis` as declared by `packages/plexis/src/index.ts`, not merely the top-level named exports. The documentation MUST stay faithful to the signatures and field shapes declared in `packages/plexis/src/types.ts`.

At minimum, the page MUST document each of the following, including every field with its type:

- **Definition functions**: `defineDomain`, `definePipeline` — with their `DomainSetupResult` / `PipelineSetupResult` return shapes and `DefineDomainOptions` / `DefinePipelineOptions`.
- **Registration helpers**: `state`, `edge`, `node`, `fork`, `terminal` — with `StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, and `PipelineForkDef`, including the `metadata` field present on each.
- **Handler input types**: `GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, and `PipelineConditionInput`.
- **Tracer**: `createTracer` with the full `TracerOptions` shape (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`) and the `Tracer` methods.
- **Domain instance** members, including the `DomainGraph` query API (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, `observedPathsTo`, `observedPathsFrom`).
- **Pipeline instance** members, including the `PipelineGraph` query API (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`).
- **Result and supporting types**: `DomainFollowResult`, `PipelineRunResult`, `DomainSnapshot`, `DomainHistoryEntry`, `NodeInspection`, `GraphDescriptor`, `PathQueryOptions`, `MergeMetadata`, `PatchLike`, `ErrorPolicy`, and `PlexisError` with its error codes.

#### Scenario: TracerOptions is documented

- **WHEN** a visitor reads the Tracer section of the API reference
- **THEN** every `TracerOptions` field (`enabled`, `captureContext`, `maxEvents`, `clock`, `idFactory`, `onSubscriberError`) is listed with its type

#### Scenario: Graph query API is documented

- **WHEN** a visitor reads the Domain instance and Pipeline instance sections
- **THEN** the `graph` member's query methods (`describe`, `node`, `inbound`, `outbound`, `pathsTo`, `pathsFrom`, `reachableFrom`, and the domain-only `observedPathsTo` / `observedPathsFrom`) are each documented with their parameters and return types

#### Scenario: Handler input types are documented

- **WHEN** a visitor reads the documentation for a guard, action, hook, or fork condition
- **THEN** the corresponding input type (`GuardInput`, `TransitionActionInput`, `StateHookInput`, `PipelineActionInput`, or `PipelineConditionInput`) is documented with its fields

#### Scenario: metadata fields are documented

- **WHEN** a visitor reads the `StateNodeDef`, `EdgeDef`, `PipelineNodeDef`, or `PipelineForkDef` tables
- **THEN** the optional `metadata` field appears in each

#### Scenario: Result type fields are documented

- **WHEN** a visitor reads the documentation for `DomainFollowResult` or `PipelineRunResult`
- **THEN** every field is listed (including `status` enum values, `traceId`, and `error`), rather than a single inline summary line

### Requirement: API reference distinguishes inputs from outputs and marks optionality

The API reference page SHALL present a consistent, scannable convention that lets a reader tell at a glance what is an input parameter versus a return value, and whether each field is required or optional.

For every documented function, method, or helper, the page MUST:

- Separate input documentation (parameters / argument-object fields) from return-value documentation under clearly distinct sub-sections or labeled headings (e.g. **Parameters** and **Return value** as section headings).
- Indicate whether each field is required or optional, and show a default value where one applies (for example, via a dedicated **Required** and/or **Default** column, or an explicit `optional` marker).
- Make the parameter or field name the visually dominant element — code-formatted and visually emphasized so it stands out from surrounding type and description text.
- Apply a consistent structure across all documented symbols of the same kind.

This convention MUST be applied to every function, method, and field table on the page, including those that already existed before this change.

#### Scenario: Parameters are visually separated from return values

- **WHEN** a visitor reads the documentation for any function or method that has both inputs and a structured return value
- **THEN** the input parameters and the return value appear under distinct, clearly labeled sections

#### Scenario: Optionality and defaults are explicit

- **WHEN** a visitor reads any field table on the API reference page
- **THEN** each field indicates whether it is required or optional
- **AND** any field with a default value shows that default

#### Scenario: Parameter name stands out

- **WHEN** a visitor scans the documentation for any function or method parameter
- **THEN** the parameter name is code-formatted and visually emphasized (e.g. larger or bolder than surrounding body text) so it is immediately distinguishable from its type and description

#### Scenario: Convention applies to pre-existing content

- **WHEN** a visitor reads a section that existed before this change (for example, the Domain instance member table)
- **THEN** it follows the same input/output separation, optionality, and name-emphasis convention as the rest of the page
