## Context

Snippets are authored by hand across ~30 `.mdx` doc pages, 8 test files,
`CLAUDE.md`, and the composable spec. They drifted on three axes:
interior padding whitespace (`fork(undefined,        'x', ...)`),
`ALL_CAPS` event names, and lines past 80 columns. There is no
formatter enforcing snippet style — `.mdx` fenced blocks aren't linted,
and Prettier doesn't reformat string contents or event-name casing.
So the cleanup is a deliberate, reviewed pass rather than an automated
reformat.

## Goals / Non-Goals

**Goals:**
- One consistent snippet style across docs, tests, and authoring docs.
- camelCase event names everywhere an event is named or referenced.
- No interior multi-space padding; no snippet line over 80 columns.
- Keep each snippet's behavior identical — purely cosmetic edits plus
  consistent renaming of user-defined event strings.

**Non-Goals:**
- No changes to `packages/plexis/src/**` runtime logic.
- No new lint tooling or CI gate in this change (noted as a follow-up).
- Not reflowing prose, headings, or tables — only fenced code snippets
  and the inline-code event names that reference them.
- Not renaming state names, node names, or node labels (already
  kebab-case); only `on`/`follow`/`can` event names change.

## Decisions

**Decision: camelCase for event names.**
Chosen over kebab-case and bare-lowercase. Single words lowercase
(`SUBMIT` → `submit`); underscore words camelCase (`SET_PAYMENT` →
`setPayment`, `TO_A` → `toA`). Rationale: event names are object-ish
message keys idiomatic to JS; kebab-case is reserved here for
state/node identifiers, keeping the two namespaces visually distinct.
*Alternative considered:* kebab-case (matches node names) — rejected to
avoid blurring event vs. node naming. *Alternative:* lowercase-with-
underscores — rejected as a half-measure that still reads as a constant.

**Decision: manual, file-by-file edits — not a global regex sweep.**
The three transforms interact (re-casing an event may push a line over
or under 80 cols; wrapping changes indentation that a naive space-
collapse could corrupt). Apply per file in order — re-case → collapse
padding → wrap long lines — and visually verify each fenced block.
*Alternative considered:* a `sed`/script sweep — rejected because event
names also appear in prose and assertions, and an unguarded collapse
would eat intentional table/indent spacing.

**Decision: consistency within each snippet is mandatory.**
When an event is re-cased at its `on()` site, every `follow()`, `can()`,
edge-union member, tracer expectation, and prose mention of that event
in the same page/test must change too, or examples and assertions break.

**Decision: include `CLAUDE.md` and `.specs/plexis-composable-spec.md`.**
They share the same snippets; leaving them `ALL_CAPS` would contradict
the docs. Treated as in-scope "authoring docs."

## Risks / Trade-offs

- [Collapsing whitespace corrupts intentional alignment, e.g. markdown
  tables or aligned comments] → Only operate inside fenced code blocks
  and on non-leading runs; leave tables and prose untouched.
- [Re-casing misses a reference, breaking a doc example or a test
  assertion] → After each file, grep the file for the old `ALL_CAPS`
  token to confirm zero remain; run the test suite after test edits.
- [Wrapping a line changes meaning (template literals, regex, URLs)] →
  Leave genuinely unbreakable lines intact (spec'd), prefer arg-per-line
  wraps that the parser treats identically.
- [Large diff is hard to review] → Group commits by area (docs vs.
  tests vs. authoring) so each diff is scannable.

## Migration Plan

1. Re-case + de-pad + wrap docs `.mdx` files under
   `apps/docs/src/content/docs/**`.
2. Apply the same to `packages/plexis/tests/**`; run the test suite to
   confirm green.
3. Apply to `CLAUDE.md` and `.specs/plexis-composable-spec.md`.
4. Final verification grep: no non-leading multi-space runs and no
   `ALL_CAPS` event tokens remain in scope; spot-check for >80-col lines.

Rollback is a plain revert — no runtime or data impact.

## Open Questions

- Should a CI lint (markdownlint rule + a custom event-casing check) be
  added so this can't regress? Proposed as a separate follow-up change,
  out of scope here.
