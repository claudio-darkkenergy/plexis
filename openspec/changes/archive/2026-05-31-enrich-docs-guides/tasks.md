## 1. Scaffolding — directories, moves, and sidebar

- [x] 1.1 Create content directories `apps/docs/src/content/docs/concepts/`, `apps/docs/src/content/docs/patterns/`, and `apps/docs/src/content/docs/guides/integrations/`
- [x] 1.2 Move `guides/advanced/react.mdx` → `guides/integrations/react.mdx` and `guides/advanced/vue.mdx` → `guides/integrations/vue.mdx` (preserve frontmatter and content)
- [x] 1.3 Create frontmatter-only stub pages (title + description, body TODO) for the 4 Concepts, 11 Patterns, and 3 new Advanced pages so the sidebar resolves
- [x] 1.4 Reorganize the `sidebar` array in `apps/docs/astro.config.mjs` into groups in reading order: Concepts → Guides → Patterns → Advanced → Integrations → Reference → Contributing
- [x] 1.5 Point the Advanced group at the five framework-neutral slugs and the new Integrations group at `guides/integrations/react` and `guides/integrations/vue`
- [x] 1.6 Run `pnpm --filter docs build` (or the docs build script) and confirm the site builds with all groups and no broken slugs

## 2. Concepts bucket (4 pages)

- [x] 2.1 Write `concepts/two-layer-model.mdx` — Domain (durable cross-time state) vs Pipeline (run-once finite workflow) and the rule for choosing
- [x] 2.2 Write `concepts/context-and-patches.mdx` — immutability, return-a-patch, default shallow merge; link to Patterns custom-merge
- [x] 2.3 Write `concepts/execution-and-lifecycle.mdx` — the ordered `follow()` steps, the pipeline run loop, where side effects belong
- [x] 2.4 Write `concepts/definition-lifecycle.mdx` — synchronous setup, builder scope, `BUILDER_CLOSED` when helpers are called outside a scope
- [x] 2.5 Verify every concept page defers signatures to Reference and uses only `typescript`/`bash` fences

## 3. Patterns bucket (11 pages)

- [x] 3.1 Write `patterns/custom-merge.mdx` — default shallow merge vs a custom `merge` for nested objects/arrays/key removal
- [x] 3.2 Write `patterns/composing-pipelines.mdx` — sub-pipeline embedding (Pipeline as fork target) and reusing one pipeline at multiple sites
- [x] 3.3 Write `patterns/forks-in-depth.mdx` — first-match-wins ordering, default/catch-all fork, no-match stops the run
- [x] 3.4 Write `patterns/guards-vs-forks.mdx` — guard blocks a transition vs fork routes flow; when to use each
- [x] 3.5 Write `patterns/designing-the-state-graph.mdx` — choosing `initial`, terminals, unreachable states, what strict mode rejects
- [x] 3.6 Write `patterns/snapshots-and-restore.mdx` — take/restore mechanics, what is not serializable, version skew; link to Advanced persist-and-rehydrate
- [x] 3.7 Write `patterns/type-safe-domains.mdx` — `as const` for typed `follow()`/`can()`; unknown event is a TS error
- [x] 3.8 Write `patterns/testing.mdx` — `followFrom`, asserting on `history()`, exercising a fork in isolation
- [x] 3.9 Write `patterns/graph-introspection.mdx` — reading `domain.graph`/`pipeline.graph` and path queries; link to Advanced visualizer
- [x] 3.10 Write `patterns/reactive-subscriptions.mdx` — `subscribe`, reading the snapshot, unsubscribe cleanup (framework-agnostic)
- [x] 3.11 Write `patterns/reusable-factories.mdx` — a function returning a parameterized domain/pipeline definition, used more than once
- [x] 3.12 Verify each pattern page is example-first, self-contained, and uses only `typescript`/`bash` fences

## 4. Advanced bucket (3 new pages)

- [x] 4.1 Write `guides/advanced/saga.mdx` — compensation on later-step failure + retry of a transient failure, routed via forks/terminals
- [x] 4.2 Write `guides/advanced/persist-and-rehydrate.mdx` — snapshot to a store and rehydrate on a later invocation, framed by serverless statelessness; builds on Patterns snapshots
- [x] 4.3 Write `guides/advanced/state-graph-visualizer.mdx` — transform a `GraphDescriptor` into Mermaid/DOT; builds on Patterns graph-introspection
- [x] 4.4 Verify each new Advanced page is self-contained and uses only `typescript`/`bash` fences

## 5. Verification and consistency

- [x] 5.1 Confirm all example code matches the composable API in `packages/plexis/src/types.ts` and `.specs/plexis-composable-spec.md`
- [x] 5.2 Confirm `guides/advanced/` no longer contains `react.mdx`/`vue.mdx` and the Advanced/Integrations sidebar positions match the specs
- [x] 5.3 Run the docs build and a link/slug check; fix any unresolved internal links between Concepts ↔ Patterns ↔ Advanced
- [x] 5.4 Update `.claude/skills/skill-config.md` for the new folder structure (Skill Config Rule)
- [x] 5.5 Run `openspec validate "enrich-docs-guides"` and confirm it passes
