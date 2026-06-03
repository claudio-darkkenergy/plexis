# authoring-vocabulary

## Requirement: A domain is a flow of phases connected by events

Prose, specs, README, and example code SHALL describe the domain layer with one vocabulary: a **domain** is a **flow** (the journey an entity travels over its lifetime); a `when` is a **phase** (a named position the domain rests in); an `on` is an **event** (what moves the domain from one phase to another). The word **"state"** SHALL NOT be used for a `when` or for the domain's current position, and the word **"transition"** SHALL be reserved for incidental description only and minimized in favor of event-anchored phrasing.

### Scenario: A `when` is named a phase, not a state

- **WHEN** prose or a spec refers to a position the domain occupies, or to the domain's current position
- **THEN** it uses "phase" (and the runtime member `domain.phase`) and SHALL NOT use "state"

### Scenario: An `on` is named an event, not a transition or edge

- **WHEN** prose describes the construct that moves the domain between phases or that carries a `guard` / `action` / `pipeline`
- **THEN** it calls it an "event" (the `on` handler) and SHALL NOT call it a "transition", a "flow", or a domain "edge"

### Scenario: The domain as a whole may be called a flow

- **WHEN** prose describes the domain's overall journey across phases
- **THEN** it MAY call the domain "a flow"; "flow" SHALL NOT be used as a graph node/edge kind, as a name for a single `when`, or as a synonym for a Pipeline

## Requirement: The domain sense of "edge" is forbidden; graph-theory "edge" is retained

The word "edge" SHALL NOT be used to mean a domain event anywhere in prose, specs, README, or example code. The word "edge" SHALL remain valid only in its graph-theory sense: the `GraphEdge` type, the `edges: GraphEdge[]` array, `inbound`/`outbound` edge queries, pipeline fork edges, the graph-kind literals `'edge-action'` / `'edge-pipeline'` / `'subpipeline'`, the tracer level `'edge'`, and unrelated senses such as serverless/edge runtimes.

### Scenario: No domain-sense "edge" or "state" survives in the domain layer

- **WHEN** the repository (excluding `openspec/changes/archive/`) is searched case-insensitively for "domain edge", "edge on a domain", or "state"/"transition" used for a domain position or move
- **THEN** no such usage SHALL be found

### Scenario: Graph-theory "edge" is preserved

- **WHEN** the repository is searched for `GraphEdge`, `descriptor.edges`, `'edge-pipeline'`, the tracer level `'edge'`, and "edge runtime"
- **THEN** those usages SHALL remain present and unchanged

## Requirement: Authoring helpers are ambient imports, never object-form or injected arguments

Authored examples and specs SHALL register a domain event with `on(event, target(id))` (simple form) or `on(event, () => { …; return target(id); })` (setup-function form). They SHALL NOT use any `on(event, { … })` object form. Inside the setup-function form, `guard`, `action`, and `pipeline` SHALL be shown as top-level ambient imports called as statements — never as destructured/injected arguments of the setup function.

### Scenario: No `on(event, { … })` object form appears

- **WHEN** a snippet or spec registers a domain event
- **THEN** it uses `target(id)` or a setup function returning `target(id)`, and SHALL NOT pass an object literal as the second argument to `on`

### Scenario: `guard` / `action` / `pipeline` are shown as ambient calls

- **WHEN** a snippet shows a `guard`, `action`, or `pipeline` registered inside an `on` setup function
- **THEN** each is invoked as an ambient imported helper (e.g. `action(async (ctx) => …)`) and SHALL NOT be destructured from an injected argument such as `({ action }) => …`
