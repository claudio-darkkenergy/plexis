## 1. Scaffold

- [x] 1.1 Create directory `apps/docs/src/content/docs/guides/advanced/`
- [x] 1.2 Confirm the package import specifier and API signatures against `packages/plexis/src/types.ts` (`subscribe`/`snapshot`/`DomainSnapshot` shape, `DomainFollowResult.status`, `PipelineRunResult.status`) before authoring samples

## 2. API Route guide

- [x] 2.1 Create `advanced/api-route.mdx` with frontmatter (`title`, `description`)
- [x] 2.2 Author the handler pipeline: validation → service/business logic → database write → response nodes, with forks routing failures to an error-response path
- [x] 2.3 Author the `request` domain tracking `pending → processing → complete | failed`
- [x] 2.4 Wire a runnable Node.js `http` server example that routes a request through the pipeline; add a note that the same pipeline plugs into any framework handler
- [x] 2.5 Ensure all fences are `typescript` or `bash` only

## 3. Multi-step Form guide

- [x] 3.1 Create `advanced/multi-step-form.mdx` with frontmatter (`title`, `description`)
- [x] 3.2 Author the domain with states `shipping → payment → review → confirmed` and forward transitions
- [x] 3.3 Author the per-step validation pipeline and attach it (or a pipeline-backed guard) so invalid step data blocks the transition and the domain stays on the current step
- [x] 3.4 Demonstrate a complete end-to-end run (valid advance + blocked invalid advance) in the example
- [x] 3.5 Ensure all fences are `typescript` or `bash` only

## 4. React guide

- [x] 4.1 Create `advanced/react.mdx` with frontmatter (`title`, `description`)
- [x] 4.2 Author a minimal `useSyncExternalStore` hook bound to `domain.subscribe` and `domain.snapshot`, showing the component re-rendering on transition
- [x] 4.3 Mention `useReducer` as an alternative in prose; keep all fences `typescript` or `bash` only

## 5. Vue guide

- [x] 5.1 Create `advanced/vue.mdx` with frontmatter (`title`, `description`)
- [x] 5.2 Author a minimal composable that initializes a `ref` from `domain.snapshot()`, updates it inside `domain.subscribe`, and unsubscribes on unmount
- [x] 5.3 Ensure all fences are `typescript` or `bash` only

## 6. Sidebar wiring

- [x] 6.1 Add an `Advanced` group to the `sidebar` array in `apps/docs/astro.config.mjs`, positioned after `Guides` and before `Reference`
- [x] 6.2 Add links for slugs `guides/advanced/api-route`, `guides/advanced/multi-step-form`, `guides/advanced/react`, `guides/advanced/vue`

## 7. Verification

- [x] 7.1 Run `pnpm --filter @tde.io/docs build` (or `pnpm docs:build`) and confirm it exits 0 with no broken-link or content-collection errors
- [x] 7.2 Grep the four new MDX files to confirm no code fence uses a short alias or non-`typescript`/`bash` identifier
- [x] 7.3 Run `openspec validate docs-advanced-guides` and confirm the change is valid
