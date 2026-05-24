## Context

Plexis is a zero-dependency TypeScript library in early implementation. The current toolchain is:

- **Package manager**: pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml` present)
- **Build**: `rolldown -c` produces ESM + CJS bundles; `tsc -p tsconfig.types.json` produces declarations
- **Test**: `vitest run`
- **Typecheck**: `tsc --noEmit`
- **Node engines**: `>=19`

There is no GitHub Actions configuration today. Pushes to `main` rely on manual verification. As the codebase grows (the composable runtime is being built out per `.specs/plexis-composable-spec.md`), the absence of an automated gate becomes a real regression risk.

## Goals / Non-Goals

**Goals:**
- Run typecheck, build, and tests on every push to `main`.
- Use the exact same commands developers use locally (no special CI-only scripts).
- Keep CI fast through pnpm store caching.
- Surface health via a status badge in the README.
- Fail loudly: any non-zero exit from typecheck / build / test fails the run.

**Non-Goals:**
- Pull-request triggers — explicitly out of scope per the user's request ("on every push to `main`"). PR triggers can be added later without rework.
- Multi-version Node matrix — start with one version (`20`, the active LTS that satisfies `>=19`) for speed; matrix expansion is a follow-up.
- Multi-OS matrix — Ubuntu only initially.
- Coverage upload / Codecov integration — `@vitest/coverage-v8` is installed but not wired here; deferred.
- Publish / release automation — separate concern.
- Branch protection / required-checks configuration — repo settings, out of code's scope.
- Caching the `node_modules` directory — pnpm's content-addressable store is the correct cache layer; `node_modules` is reconstructed from it cheaply.

## Decisions

### Use GitHub Actions, single workflow file
**Choice**: One workflow at `.github/workflows/ci.yml` with a single `build-test` job containing sequential steps.
**Alternatives considered**:
- *Multiple jobs* (separate `typecheck`, `build`, `test`) — gives parallelism and clearer status checks but triples the install + cache work and complicates step ordering (build artifacts not shared without `actions/upload-artifact`). For a small library at this stage, the overhead outweighs the benefit. Reconsider if test time grows.
- *Reusable workflow* — premature; there's only one workflow.

### Trigger on `push: branches: [main]` only
**Choice**: Match the user's stated requirement exactly.
**Why**: Adding `pull_request` triggers now would expand scope. The workflow file is the single source of truth and easily extended later by adding triggers.

### Pin Node to `20.x` (single version)
**Choice**: Use `actions/setup-node@v4` with `node-version: 20`.
**Alternatives considered**:
- *Node 19* (the engines minimum) — using the minimum on CI maximizes regression surface but Node 19 is end-of-life. Node 20 is active LTS, satisfies `>=19`, and is what most developers will run.
- *Matrix [20, 22]* — useful but doubles runtime. Defer until the library nears a 1.x release.

### Use pnpm via `pnpm/action-setup@v4`, install with `--frozen-lockfile`
**Choice**: Read the pnpm version from `package.json`'s `packageManager` field if present; otherwise let the action pick a recent version. Run `pnpm install --frozen-lockfile`.
**Why**: `--frozen-lockfile` makes CI fail if `pnpm-lock.yaml` is stale, which is what we want. The repo currently has no `packageManager` field in `package.json` — the action will use a default. If that proves fragile, a follow-up can pin pnpm via `packageManager`.

### Cache pnpm store via `actions/setup-node`'s built-in cache
**Choice**: `actions/setup-node@v4` supports `cache: 'pnpm'` directly. Use it.
**Alternatives considered**:
- *Manual `actions/cache@v4` keyed on `pnpm-lock.yaml`* — works but is more YAML for the same result.

### Step order: install → typecheck → build → test
**Choice**: Typecheck first (cheapest, catches the most common breakage); then build (verifies emitted output is consistent); then tests (slowest, depends on neither but runs against source so safe to run last).
**Why**: Each step uses the same `pnpm` script developers run locally — `pnpm typecheck`, `pnpm build`, `pnpm test`. Reusing existing scripts means CI never drifts from local behavior.

### Status badge in README.md
**Choice**: Add a single shields.io-style GitHub Actions badge linked to the workflow runs page, placed at the top of `README.md` (above the existing title or just under it).
**Why**: Visible signal of `main` health; no maintenance burden.

### Skill-config not affected
The skill-config rule in CLAUDE.md says to update `.claude/skills/skill-config.md` when changes affect folder structure, import aliases, dependencies, test config, or architectural conventions. **None of those apply** — this change adds a `.github/workflows/` directory and a README badge but does not touch `src/`, build config, or test config. No skill-config update needed.

## Risks / Trade-offs

- **[Risk]** pnpm version drift between local and CI → **Mitigation**: `--frozen-lockfile` catches lockfile mismatches; a follow-up can add a `packageManager` field to lock pnpm explicitly.
- **[Risk]** Single Node version doesn't catch version-specific regressions → **Mitigation**: Acceptable now (pre-1.x library); the workflow is trivially extensible to a matrix later.
- **[Risk]** `pnpm test` doesn't surface flakes — CI runs once per push → **Mitigation**: Out of scope here; rerun-on-failure or scheduled runs are future work.
- **[Trade-off]** Only triggers on `main` pushes, not on PRs → Means a broken PR can be merged before CI catches it. This matches the user's explicit ask and is a known limitation; documented in `tasks.md` as a follow-up.
- **[Trade-off]** No coverage reporting → Defer until coverage targets are agreed.

## Open Questions

None blocking. Future follow-ups (each its own change):
1. Add `pull_request` trigger and branch protection requiring CI green.
2. Add Node version matrix once the library has a stable API.
3. Wire `@vitest/coverage-v8` output to a coverage service.
4. Add a `packageManager` field to `package.json` to pin pnpm.
