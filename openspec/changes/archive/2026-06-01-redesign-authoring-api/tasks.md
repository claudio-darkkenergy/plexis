## 1. Tests first (red)

- [x] 1.1 Rewrite `packages/plexis/tests/helpers.test.ts` for the new helpers: `when`/`enter`/`exit`/`on`, `node`/`action`/`fork`, `terminal()` sentinel — including BUILDER_CLOSED for each scoped helper called outside its scope and the wrong nesting level, and `terminal()` NOT throwing outside scope
- [x] 1.2 Rewrite `packages/plexis/tests/domain.test.ts` to author states with `when`/`on`/`enter`/`exit` and `terminal()`; assert `OnActionInput` shape on flow actions; keep all `follow`/guard/`can`/strict/history/subscribe assertions
- [x] 1.3 Rewrite `packages/plexis/tests/pipeline.test.ts` to author nodes with `node(id, fn)` + `action`/`fork` and `terminal(fn?)`; add the terminal-final-action case
- [x] 1.4 Update `packages/plexis/tests/graph.test.ts` to expect kind `'domain-flow'` (was `'domain-edge'`) and confirm `'edge-action'`/`'edge-pipeline'` unchanged
- [x] 1.5 Update `packages/plexis/tests/smoke.test.ts` and any others (`context`, `errors`, `tracer`) that reference `state`/`edge`/`onEnter`/`onExit`/`TransitionActionInput`
- [x] 1.6 Run `pnpm test` and confirm the suites fail for the expected reasons (red)

## 2. Types

- [x] 2.1 In `src/types.ts` rename `TransitionActionInput` → `OnActionInput` (and its use inside the flow action signature). Leave `GuardInput` unchanged (deferred `OnGuardInput` rename)
- [x] 2.2 Rename `EdgeDef` → `OnDef` (keep `target`/`guard`/`action`/`pipeline`/`metadata`; action input is `OnActionInput`)
- [x] 2.3 Rename `StateNodeDef` → `WhenDef` with fields `enter?`, `exit?`, `on?: Record<string, OnDef>`, `pipeline?`, `terminal?`, `metadata?`
- [x] 2.4 Update `DomainConfig` and any generic constraints referencing `StateNodeDef`/`EdgeDef`
- [x] 2.5 Change the `'domain-edge'` literal to `'domain-flow'` in both `GraphNodeKind` and `GraphEdgeKind`; leave `'edge-action'`/`'edge-pipeline'`/`GraphEdge`/`edges` untouched
- [x] 2.6 Replace the `state`/`edge` declared-function signatures with `when(id, fn | terminal())`, `enter(fn)`, `exit(fn)`, `on(event, def)`; update `node` to `node(id, fn | terminal(fn?))`; make `action(fn)` and `fork(...)` declared helpers; update `terminal<T>(fn?)` signature
- [x] 2.7 Update `src/index.ts` type-only re-exports (`OnActionInput`, `OnDef`, `WhenDef`; drop `TransitionActionInput`, `EdgeDef`, `StateNodeDef`)

## 3. Helpers (scope stack)

- [x] 3.1 In `src/core/helpers.ts` replace the single `_currentScope` cell with a `_scopeStack` and a `getCurrentScope()` returning the top; keep `withScope` pushing/popping
- [x] 3.2 Add scope kinds `domain` (collects `whens`), `when` (single `WhenDef`), `pipeline` (collects `nodes`), `node` (single `NodeDef`)
- [x] 3.3 Implement `when(id, x)`: brand-detect `terminal()` → terminal `WhenDef`; else push a `when` scope, run `fn`, pop, register into enclosing `domain` scope; throw BUILDER_CLOSED if not inside a domain scope
- [x] 3.4 Implement `enter(fn)`, `exit(fn)`, `on(event, def)` writing to the top `when` scope; throw BUILDER_CLOSED otherwise
- [x] 3.5 Implement `node(id, x)`: brand-detect `terminal(fn?)` → terminal `NodeDef` (carrying optional action); else push a `node` scope, run `fn`, pop, register into enclosing `pipeline` scope
- [x] 3.6 Implement `action(fn)` and `fork(condition, target, opts?)` writing to the top `node` scope (forks in declaration order); throw BUILDER_CLOSED otherwise
- [x] 3.7 Implement `terminal(fn?)` returning a `Symbol`-branded sentinel `{ [TERMINAL]: true, action?: fn }` with no scope lookup
- [x] 3.8 Remove the old `state` and `edge` exports

## 4. Runtime + graph

- [x] 4.1 Update `src/core/domain.ts` to read `whens`/`WhenDef` fields `enter`/`exit`/`on` (was `onEnter`/`onExit`/`edges`); keep execution order and result shapes identical
- [x] 4.2 Update `src/core/pipeline.ts` to consume the imperatively-built `NodeDef` (action + ordered forks + terminal/final action)
- [x] 4.3 Update `src/graph/descriptor.ts` to walk `on` instead of `edges` and emit `'domain-flow'`; verify `inspection.ts`/`paths.ts` still compile against unchanged `GraphEdge`
- [x] 4.4 Update `src/index.ts` value exports to `when, enter, exit, on, node, action, fork, terminal` (remove `state`, `edge`)

## 5. Green + build

- [x] 5.1 Run `pnpm test` until all suites pass (green)
- [x] 5.2 Run `pnpm typecheck` and `pnpm build`; confirm ESM/CJS/types outputs build clean
- [x] 5.3 Grep `packages/plexis/src` and `tests` for residual `\b(state\(|edge\(|onEnter|onExit|TransitionActionInput|StateNodeDef|EdgeDef)\b`; resolve any hits

## 6. Reference spec

- [x] 6.1 Update `.specs/plexis-composable-spec.md` terminology throughout: authoring examples, Domain/Pipeline API, Definition Lifecycle, Public Exports, Source Structure, and Finalized Type Alignment — `state`/`edge`→`when`/`on`, `onEnter`/`onExit`→`enter`/`exit`, `TransitionActionInput`→`OnActionInput`, `'domain-edge'`→`'domain-flow'`
- [x] 6.2 Verify no `transition` synonym or removed helper remains in the spec

## 7. Documentation

- [x] 7.1 Update concept pages (`concepts/*.mdx`) — two-layer model, definition lifecycle, execution-and-lifecycle, context-and-patches — to the new vocabulary and execution-order wording
- [x] 7.2 Update guides (`guides/domain.mdx`, `guides/pipeline.mdx`, `guides/error-handling.mdx`, `guides/tracer.mdx`, `guides/advanced/*`, `guides/integrations/*`) code samples
- [x] 7.3 Update pattern pages (`patterns/*.mdx`) including `designing-the-state-graph`, `forks-in-depth`, `guards-vs-forks`, `graph-introspection`, `reusable-factories`, `type-safe-domains`
- [x] 7.4 Update reference pages (`reference/registration-helpers.mdx`, `reference/definition-functions.mdx`, `reference/handler-inputs.mdx`, `reference/domain.mdx`, `reference/pipeline.mdx`, `reference/types.mdx`, `reference/api.mdx`, `reference/errors.mdx`) to document `when`/`enter`/`exit`/`on`/`node`/`action`/`fork`/`terminal`, `OnActionInput`, `WhenDef`, `OnDef`
- [x] 7.5 Update `docs/index.mdx` landing examples
- [x] 7.6 Grep `apps/docs` for residual `state(`/`edge(`/`onEnter`/`onExit`/`TransitionActionInput`/`'domain-edge'` and resolve

## 8. Project guidance

- [x] 8.1 Update `CLAUDE.md` — the composable API examples, the helper list, and the domain/pipeline execution-order sections — to the new vocabulary
- [x] 8.2 Update `.claude/skills/skill-config.md` per the Skill Config Rule (authoring conventions changed): new helper names and any module notes
- [x] 8.3 Final full verification: `pnpm test && pnpm typecheck && pnpm build`, then a repo-wide grep confirming no obsolete `state`/`edge`/`onEnter`/`onExit`/`transition` authoring references remain outside the graph-theory `GraphEdge` surface
