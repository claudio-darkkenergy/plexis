## 1. Documentation snippets — `apps/docs/src/content/docs/**`

For each file: re-case `ALL_CAPS` event names to camelCase, collapse
non-leading multi-space runs, and wrap lines over 80 columns. Keep every
in-snippet reference (`on`/`follow`/`can`, edge unions, prose) consistent.

- [x] 1.1 `index.mdx`
- [x] 1.2 `concepts/**` (two-layer-model, context-and-patches, execution-and-lifecycle, definition-lifecycle)
- [x] 1.3 `guides/*.mdx` (domain, pipeline, error-handling, tracer)
- [x] 1.4 `guides/advanced/*.mdx` (saga, multi-step-form, persist-and-rehydrate, state-graph-visualizer, api-route)
- [x] 1.5 `guides/integrations/*.mdx` (react, vue)
- [x] 1.6 `patterns/*.mdx` (all pattern pages — forks-in-depth, custom-merge, guards-vs-forks, type-safe-domains, testing, snapshots-and-restore, reactive-subscriptions, reusable-factories, designing-the-state-graph, composing-pipelines, graph-introspection)
- [x] 1.7 `reference/*.mdx` (api, domain, pipeline, types, registration-helpers, definition-functions, handler-inputs, errors)
- [x] 1.8 `contributing/index.mdx` and any remaining `.mdx`
- [x] 1.9 Grep the docs tree: confirm zero non-leading multi-space runs and zero `ALL_CAPS` event tokens remain

## 2. Tests — `packages/plexis/tests/**`

- [x] 2.1 Re-case event names in `domain.test.ts` (declarations, `follow`/`can` calls, and assertions)
- [x] 2.2 Re-case event names in `helpers.test.ts`
- [x] 2.3 Collapse padding and wrap >80-col lines in all touched test files
- [x] 2.4 Run the test suite (`pnpm test`) and confirm green

## 3. Authoring docs

- [x] 3.1 `CLAUDE.md` — re-case event names, collapse padding, wrap long snippet lines
- [x] 3.2 `.specs/plexis-composable-spec.md` — same transforms

## 4. Final verification

- [x] 4.1 Repo-wide grep: no `ALL_CAPS` event names in `on('…')`/`follow('…')`/`can('…')` within scope
- [x] 4.2 Repo-wide grep: no non-leading runs of 2+ spaces inside fenced code blocks within scope
- [x] 4.3 Spot-check each touched file's fenced blocks for lines over 80 columns
- [x] 4.4 Confirm `pnpm test` and the docs build still pass
