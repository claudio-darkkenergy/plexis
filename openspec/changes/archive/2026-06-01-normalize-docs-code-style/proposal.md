## Why

Code snippets across the docs, examples, and tests carry inconsistent
formatting: stray runs of horizontal whitespace used to "align" call
arguments, `on()` event names written in `ALL_CAPS`, and lines that
overflow 80 columns. The noise makes snippets harder to read, harder to
copy, and inconsistent with the kebab-case state/node naming the library
already uses. This change establishes one written convention and applies
it everywhere so every snippet a reader copies looks the same.

## What Changes

- **Collapse padded whitespace**: any run of 2+ spaces that is not
  leading indentation inside a code snippet is collapsed to a single
  space (e.g. `fork(undefined,        'saga-failed-no-stock', ...)` →
  `fork(undefined, 'saga-failed-no-stock', ...)`).
- **Re-case event names to camelCase**: every `ALL_CAPS` event name
  passed to `on()`, `follow()`, and `can()` (and referenced in tracer
  output, edge unions, and prose) is converted to camelCase —
  `SUBMIT` → `submit`, `SET_PAYMENT` → `setPayment`, `TO_A` → `toA`.
- **Wrap long lines**: code-snippet lines that would exceed 80 columns
  are broken across multiple lines following idiomatic JS/TS wrapping
  (one argument or chain segment per line) where the syntax allows.
- Scope spans `apps/docs/src/content/docs/**`, the package tests under
  `packages/plexis/tests/**`, and the authoring docs that share these
  snippets (`CLAUDE.md`, `.specs/plexis-composable-spec.md`) so the
  convention is uniform.
- Record the convention itself as a written capability so future
  snippets are held to the same rules.

This is a documentation/test-style normalization. **No runtime source
behavior changes** — `packages/plexis/src/**` logic is untouched except
for any in-snippet/event-name strings that appear in tests.

## Capabilities

### New Capabilities
- `docs-code-style`: the formatting conventions all authored code
  snippets must follow — no inline padding whitespace, camelCase event
  names, and 80-column line wrapping.

### Modified Capabilities
<!-- None. No runtime requirement changes; existing specs keep their behavior. -->

## Impact

- **Docs**: ~30 `.mdx` files under `apps/docs/src/content/docs/**`.
- **Tests**: 8 test files under `packages/plexis/tests/**` — event-name
  string literals (and any assertions on them) update to camelCase.
- **Authoring docs**: `CLAUDE.md` and `.specs/plexis-composable-spec.md`
  snippets re-cased and de-padded for consistency.
- **No dependency, build, or public-API changes.** Event names are
  user-defined strings, so re-casing example/test names is not a library
  breaking change.
