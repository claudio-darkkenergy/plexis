## Context

The API reference lives in a single MDX file (`apps/docs/src/content/docs/reference/api.mdx`) rendered by Astro Starlight. It is authored as Markdown tables plus fenced `typescript` signature blocks. The current tables vary in shape: some are `Field | Type | Description`, some are just `Field | Type`, and instance members mix inputs and outputs into one `Member | Type | Description` row (e.g. `follow(event, payload?)` shows the call signature in the name column and the return type in the type column). There is no markup distinguishing inputs from outputs, no optionality/default column, and the field name carries no extra emphasis.

The source of truth for the surface is `packages/plexis/src/index.ts` (the export barrel) and `packages/plexis/src/types.ts` (the shapes). This change is documentation-only; no runtime code changes.

## Goals / Non-Goals

**Goals:**

- Close coverage gaps so the page documents the entire public surface declared by `index.ts`.
- Establish one readability convention and apply it uniformly so a reader can instantly tell input from output and required from optional.
- Keep the page faithful to `types.ts` — docs must match real signatures.
- Stay within plain Starlight MDX + Markdown; no new docs dependencies.

**Non-Goals:**

- No changes to the library source, types, or public surface.
- No auto-generation of docs from types (e.g. TypeDoc) — that is a larger, separate effort; this change is a hand-authored pass.
- No restructuring of the sidebar or other docs pages.
- No new prose guides; deep topics (Tracer, Error Handling) keep their existing "see the guide" links.

## Decisions

### Decision 1: Per-symbol "Parameters" / "Returns" structure

For each function, method, and helper, document inputs and outputs under separate, clearly labeled tables — a **Parameters** table and a **Returns** table — instead of one mixed table.

- Functions list positional parameters (`id`, `setup`, `options?`) in the Parameters table; the object-shaped params (`DomainSetupResult`, `DefineDomainOptions`) get their own field tables immediately below, labeled by type name.
- Instance members that take arguments (e.g. `domain.follow(event, payload?)`) get a Parameters table for `event` / `payload` and a Returns line/table for `DomainFollowResult`, rather than cramming the signature into a name cell.

_Alternative considered:_ keep single mixed tables and just add an "I/O" column. Rejected — it does not visually separate the two and reads worse for object-shaped returns with many fields.

### Decision 2: Standard column set — `Field | Type | Required | Default | Description`

All field tables adopt a consistent column order:

| Column | Purpose |
|---|---|
| `Field` | Leading column, name in backticks (code-formatted) so it is the dominant element |
| `Type` | The TypeScript type, in backticks |
| `Required` | `Yes` / `No` (derived from `?` optionality in `types.ts`) |
| `Default` | The default value, or `—` when none |
| `Description` | Short prose |

- The `Field` column always comes first and is always code-formatted; `Type` is code-formatted but plain weight — this makes the name the visually dominant element per the spec.
- For types where a column is uniformly empty (e.g. no field has a default), the `Default` column may be omitted for that table to avoid a column of `—`; `Required` is always kept since optionality always varies or is meaningful.

_Alternative considered:_ merge Required+Default into a single "Default / Optional" column. Rejected — separate columns scan faster and keep alignment predictable.

_Alternative considered:_ Starlight `<Badge>`/asides for required vs optional. Rejected for now — plain table columns are simpler, diff-friendly, and consistent across the whole page; badges add markup noise across dozens of rows.

### Decision 3: Defaults sourced from spec, not invented

Default values (e.g. `strict` default, `TracerOptions.enabled`, `captureContext`) are taken from `.specs/plexis-composable-spec.md` and the reference implementation, not guessed. Where the spec does not state a default, the cell is `—` (no default / required) rather than a fabricated value.

### Decision 4: Single-file edit, section order preserved

Keep the existing top-level section order (Definition Functions → Registration Helpers → Tracer → Domain Instance → Pipeline Instance → Errors → Key Types) so the change reads as an in-place enrichment. New input-type and graph-API tables are added within the relevant existing sections (handler input types near the helpers that use them; graph APIs under the Domain/Pipeline instance sections).

## Risks / Trade-offs

- **Docs drift from `types.ts`** → Author directly from `types.ts` in this change and cross-check each table; the spec scenarios pin the required coverage so review can verify against them.
- **Wrong default values** → Source defaults only from the spec/reference impl; use `—` when unknown rather than guessing (Decision 3).
- **Table verbosity / width** → Five columns can get wide in a narrow theme; mitigated by omitting an all-empty `Default` column per table (Decision 2) and keeping descriptions terse.
- **Manual maintenance burden going forward** → Accepted for this change; auto-generation is explicitly a non-goal and can be proposed separately later.

## Open Questions

- None blocking. If a future change introduces TypeDoc-style generation, this hand-authored page becomes the migration target, but that is out of scope here.
