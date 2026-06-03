## MODIFIED Requirements

### Requirement: Execution and lifecycle page documents the runtime order

`execution-and-lifecycle.mdx` SHALL describe the ordered steps the runtime takes on `domain.follow()` (guard → `exit` → `on` action → `on` pipeline → phase change → `enter` → phase entry pipeline → history/subscribers) and the pipeline run loop (start at initial → action → evaluate forks first-match-wins → follow target → repeat until terminal), and SHALL indicate where side effects safely belong. The page SHALL describe the `on` action as registered by the ambient `action(fn)` helper called inside the `on` setup function, and SHALL NOT show any `on(event, { ... })` object form or imply that `action`/`guard`/`pipeline` are injected arguments. The page SHALL use the flow/phase/event vocabulary and SHALL NOT use "state" or "transition" for a domain position or move.

#### Scenario: Page presents the follow and run order

- **WHEN** a reader inspects `execution-and-lifecycle.mdx`
- **THEN** it lists the ordered domain `follow()` steps (guard, `exit`, `on` action, `on` pipeline, phase change, `enter`, phase entry pipeline, history/subscribers) and the pipeline run loop
- **AND** it indicates where side effects should be placed in that order

#### Scenario: Page describes the `on` action accurately and in phase/event terms

- **WHEN** a reader inspects how the `on` action is registered on `execution-and-lifecycle.mdx`
- **THEN** the page shows the ambient `action(fn)` helper called inside the `on` setup function
- **AND** it contains no `on(event, { action })` object form, no injected-argument (`({ action }) => ...`) form, and no use of "state" or "transition" for a domain position or move
