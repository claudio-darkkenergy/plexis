## 1. Type declarations

- [ ] 1.1 Widen `TargetDef` in `packages/plexis/src/types.ts` to a union carrying either `{ __type: 'TargetDef'; id: string }` or `{ __type: 'TargetDef'; pipeline: Pipeline }`
- [ ] 1.2 Update the `target` declaration to `target(idOrPipeline: string | Pipeline): TargetDef`
- [ ] 1.3 Rewrite the `fork` declaration to `fork<TContext>(label: string, target: TargetDef, condition?: (ctx, input: PipelineConditionInput) => boolean | Promise<boolean>): void`
- [ ] 1.4 Verify `on('submit', target('processing'))` domain-side usage still type-checks against the widened `TargetDef` (the `{ id }` variant is unchanged)

## 2. Runtime / helper behavior

- [ ] 2.1 Update the `target(...)` helper implementation to wrap a `Pipeline` into the `{ pipeline }` sentinel variant alongside the existing `{ id }` string variant
- [ ] 2.2 Update the `fork(...)` helper implementation to read `(label, target, condition?)`, unwrap the `TargetDef` sentinel into the internal `PipelineForkDef.target: string | Pipeline`, store `label` (always present), and store `condition` (omitted = unconditional)
- [ ] 2.3 Add a runtime guard in `fork(...)` that throws `PlexisError` when the second argument is not a `TargetDef` sentinel (non-sentinel target from untyped JS callers)

## 3. Spec scenario migration

- [ ] 3.1 Apply the `pipeline` capability delta: migrate all `fork(...)` calls in `openspec/specs/pipeline/spec.md` scenarios to `fork(label, target(...), condition?)` and add the new label/catch-all/sub-pipeline/rejection scenarios

## 4. Examples & documentation

- [ ] 4.1 Update the composable example in `CLAUDE.md` to the new `fork('label', target('id'), cond)` order
- [ ] 4.2 Migrate every other `fork(...)` occurrence across guides/examples/docs specs to the new order (grep `fork(` to find all call sites)

## 5. Verification

- [ ] 5.1 Run `pnpm typecheck` and confirm the new `fork`/`target` declarations and all migrated call sites compile
- [ ] 5.2 Run `pnpm test` and confirm pipeline-authoring tests pass under the new signature (catch-all, sub-pipeline target, label population, non-sentinel rejection)
- [ ] 5.3 Grep the repo for any remaining old-form `fork(` calls (`{ label:` options object or bare-string target) and confirm none remain
