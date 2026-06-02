## Why

The redesign-authoring-api change made `when` and `node` dual-form (setup fn | `terminal()`), but left `on` stuck on the legacy `{ target: 'x' }` object form — an inconsistency that also leaves no clean place to attach a guard, action, or pipeline to a transition. At the same time, `action`'s valid scopes were never formalised, and there is no defined error when a single-slot registration (guard/action/pipeline) is declared twice. This change finishes the composable authoring story so every state, node, and transition reads the same way and misuse fails loudly at definition time.

## What Changes

- **BREAKING** `on(event, def)` becomes dual-form, mirroring `when`/`node`:
  - Simple form: `on('cancel', target('cancelled'))` — second arg is a `target()` sentinel.
  - Setup function form: `on('submit', () => { guard(...); action(...); pipeline(p); return target('processing'); })` — a synchronous setup fn that registers sub-helpers and **returns** a `target()`.
  - The `{ target: 'x', guard, action, pipeline }` object form is **removed**. `target(id)` is the only way to express a transition's destination at every call site.
- New scope-independent sentinel `target(id)` returning `{ __type: 'TargetDef', id }`. Safe to call anywhere; never throws `BUILDER_CLOSED`.
- New top-level exports `guard(fn)` and `pipeline(p)`, scoped to `on` setup functions only. Called outside an active `on` scope, they throw `BUILDER_CLOSED`.
- `action(fn)` scope is formalised to exactly three contexts: inside a `node` setup, inside an `on` setup, or as the optional argument to `terminal(fn?)`. Called inside a `when` setup (but outside an `on`) or anywhere else, it throws `BUILDER_CLOSED`.
- `action`'s registered handler receives a scope-determined `input` type: `PipelineActionInput` in a `node` scope, `OnActionInput` in an `on` scope.
- **BREAKING** Singleton-slot enforcement: `guard`, `action`, and `pipeline` may each be called at most once per `on` setup. A second call throws `PlexisError` with the new code `DUPLICATE_REGISTRATION`. (`fork` inside `node` remains repeatable and order-sensitive — unchanged.)
- An `on` setup function that runs without returning `target()` throws `PlexisError` with the new code `MISSING_TARGET` — semantically distinct from `BUILDER_CLOSED` (the scope was valid; the contract was unmet). TypeScript users also get a compile error via `OnSetupFn`'s `TargetDef` return type.
- `terminal(fn?)` accepts an optional final action (already specced in the redesign) — this change confirms and tests its node-context behavior; `when`-level `terminal()` takes no action argument.
- New error code `DUPLICATE_REGISTRATION` joins the documented `PlexisError` code union.
- Type changes: add `TargetDef`, `OnSetupFn`, `OnGuardInput`; update `OnDef`'s second-arg type to `TargetDef | OnSetupFn`; add `DUPLICATE_REGISTRATION` and `MISSING_TARGET` to the error-code union.
- Documentation, the reference spec (`.specs/plexis-composable-spec.md`), `CLAUDE.md`, and all docs/README examples are updated: every `on('EVENT', { target: ... })` becomes `on('event', target(...))` or the setup-fn form.

## Capabilities

### New Capabilities
<!-- None — this extends existing authoring and error-handling capabilities. -->

### Modified Capabilities
- `domain`: `on` becomes dual-form (`target()` sentinel | setup fn returning `target()`); the `{ target }` object form is removed. New scoped helpers `guard` and `pipeline` register a transition's guard predicate and attached pipeline. `action` is valid inside an `on` setup (receiving `OnActionInput`) but not directly inside a `when` setup. `guard`/`action`/`pipeline` are singleton per `on`. `target()` is a scope-independent sentinel. Runtime `follow`/guard/exit/action/pipeline/enter semantics are unchanged.
- `pipeline`: `action` inside a `node` setup receives `PipelineActionInput`; `terminal(fn?)`'s optional node-context action is confirmed. Run/fork/terminal/sub-pipeline semantics are unchanged.
- `error-handling`: new documented codes `DUPLICATE_REGISTRATION` (thrown when `guard`/`action`/`pipeline` is registered twice in one `on` setup) and `MISSING_TARGET` (thrown when an `on` setup function returns no `target()`). `BUILDER_CLOSED` is extended to cover `guard`, `pipeline`, and `on`/`node`-scoped `action` misuse.

## Impact

- **Source** (`packages/plexis/src/`): `types.ts` (add `TargetDef`/`OnSetupFn`/`OnGuardInput`, update `OnDef`, extend error-code union), `core/helpers.ts` (implement `target`/`guard`/`pipeline`; extend `on` and `action` for the setup-fn form and scope routing; enforce singleton slots and `DUPLICATE_REGISTRATION`), `core/domain.ts` (consume new `OnDef` shape and attached guard/action/pipeline), `index.ts` (export `target`, `guard`, `pipeline`).
- **Tests** (`packages/plexis/tests/`): new coverage for `on` setup-fn form, `on` simple `target()` form, `DUPLICATE_REGISTRATION` for guard/action/pipeline, `BUILDER_CLOSED` for misused scoped helpers, `terminal(fn)` in node context, and `target()` called outside any setup (must not throw). TDD — tests first.
- **Reference spec**: `.specs/plexis-composable-spec.md` updated (`on` section, `target`/`guard`/`pipeline` helpers, `DUPLICATE_REGISTRATION`, complete example).
- **Docs** (`apps/docs/src/content/docs/`) and README: every `on('EVENT', { target: ... })` example replaced with `target()` simple form or setup-fn form.
- **Project guidance**: `CLAUDE.md` authoring vocabulary table, `on` dual-form note, `action` scope rules, `no-shadow` rationale for ambient imports; `.claude/skills/skill-config.md` per the Skill Config Rule.
- **No external dependencies** added; zero-dependency and dual-build (ESM/CJS/types) constraints preserved.
