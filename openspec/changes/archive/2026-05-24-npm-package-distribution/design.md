## Context

The repository currently has a single CI workflow (`.github/workflows/ci.yml`) that runs as one job: install, typecheck, build, test. This works for "is `main` green?" but cannot serve as a reliable gate for npm publishing because:

1. The workflow always rebuilds — there is no way to publish "the exact artifact that was tested."
2. A publish workflow would have to either duplicate build+test logic or re-run them, both of which are fragile.
3. The package is currently unscoped (`plexis`), which conflicts with the actual publish target (`@tde.io/plexis`) under a scoped organization.

We want to split CI into composable workflows so that publishing reuses the *same* `dist/` artifact that build produced and test verified. This is the standard "build once, test once, publish that exact thing" CI pattern.

Constraints already in place from prior work:
- `package.json` build outputs `dist/{esm,cjs,types}/` via `pnpm build` (rolldown + tsc).
- `files` field already includes `dist`, so npm packaging is correct as long as the package name is right.
- pnpm `11.3.0` and Node `24` are pinned via `packageManager` and prior workflow setup.

## Goals / Non-Goals

**Goals:**
- Three workflows: `build.yml`, `test.yml`, `publish.yml` with a clear dependency chain.
- The `dist/` directory produced by `build.yml` is the single source of truth for what gets published — `test.yml` runs against it and `publish.yml` ships it.
- Publishing is gated: both build and test must succeed for the matching commit before npm sees anything.
- Package metadata is correct for a scoped public npm package (`@tde.io/plexis`, `publishConfig.access: public`).
- Documented secret and trigger contract so the first publish is a no-surprise operation.

**Non-Goals:**
- Automated semantic-release / changelog generation. (Manual tag-driven publish is fine for v1.)
- Provenance attestations / Sigstore. (Future enhancement; npm provenance is a one-flag add once the basic pipeline works.)
- Publishing on every push to `main`. (Only tag pushes trigger publish.)
- Multi-version Node test matrices. (Out of scope; keep parity with current single-version setup.)
- Pre-release / canary tags (`next`, `beta`). (Future; only `latest` for v1.)

## Decisions

### Decision 1: Use `workflow_run` for chaining, not a single workflow with `needs:`

**Choice:** Three separate workflow *files*. `test.yml` triggers on `workflow_run` from `build.yml`. `publish.yml` triggers on tag push and re-invokes build to guarantee a fresh artifact tied to the tag SHA.

**Alternatives considered:**
- *Single workflow with multiple jobs* — using `needs:` between `build`, `test`, `publish` jobs in one file. Simpler dependency wiring but couples concerns and makes it harder to re-run "just test" or "just publish." Also the user explicitly asked for separate workflows.
- *Reusable workflows (`workflow_call`)* — `test.yml` and `publish.yml` call `build.yml` as a reusable workflow. Cleanest artifact passing (artifacts are scoped per workflow run, but a called reusable workflow shares the same run). This is the strongest option but adds boilerplate for the v1 setup.

**Why this choice:** Three distinct files match the user's request literally and make each workflow independently re-runnable from the Actions UI. `workflow_run` chaining is well-understood and uses the standard `actions/upload-artifact` + `actions/download-artifact` pair.

**Concrete shape:**
- `build.yml` triggers on `push` to `main` and on tag push (`v*.*.*`). It checks out, installs, typechecks, builds, then uploads `dist/` as a workflow artifact named `plexis-dist`.
- `test.yml` triggers on `workflow_run` with `workflows: [Build]` and `types: [completed]`. It downloads the `plexis-dist` artifact from the triggering build run, installs deps, and runs `pnpm test`. It only proceeds when the build conclusion is `success`.
- `publish.yml` triggers on tag push matching `v*.*.*`. It waits for both `build.yml` and `test.yml` to succeed for the same commit SHA, then downloads `plexis-dist` and runs `pnpm publish --access public --no-git-checks`.

### Decision 2: Pass `dist/` between workflows via GitHub artifacts, not git or external storage

**Choice:** Use `actions/upload-artifact@v4` in `build.yml` and `actions/download-artifact@v4` in `test.yml` and `publish.yml` to pass the `dist/` directory.

**Alternatives considered:**
- *Rebuild in test and publish* — guarantees consistency but violates the user's explicit requirement ("the /dist artifact from the previous build step is what gets published").
- *Commit `dist/` to a branch* — terrible idea; pollutes git history.
- *External storage (S3, etc.)* — overkill; GitHub artifacts are exactly the right tool.

**Why this choice:** Artifacts are the GitHub-native way to pass file outputs between workflows. Retention is configurable (default 90 days, plenty for our purposes). `v4` of these actions supports cross-workflow downloads via `github-token` and `run-id`.

### Decision 3: Publish trigger is a git tag push (`v*.*.*`) on `main`

**Choice:** `publish.yml` triggers on `push: tags: ['v*.*.*']`. The workflow checks that the tag points to a commit reachable from `main`, then waits for build+test of that commit to succeed before publishing.

**Alternatives considered:**
- *Manual `workflow_dispatch`* — too easy to publish from an arbitrary commit. We want git tags as the canonical version record.
- *On `release` event* — requires creating a GitHub Release first. Slightly more ceremony, but actually nicer for changelogs. Rejected for v1 to keep it simple; can be added later.
- *On every push to `main`* — would require automatic version bumping. Out of scope for v1.

**Why this choice:** Tag-driven publish gives an unambiguous version anchor and matches the user's mental model: "I tagged v1.2.0, that's what gets published as 1.2.0." The workflow validates that the tag's `package.json` version matches the tag name (e.g., tag `v1.2.0` ↔ `"version": "1.2.0"`) to prevent drift.

### Decision 4: `npm publish` uses an `NPM_TOKEN` automation token, not OIDC trusted publishing

**Choice:** Store an npm automation token as the `NPM_TOKEN` repo secret. The publish workflow writes it to `~/.npmrc` and runs `pnpm publish`.

**Alternatives considered:**
- *npm OIDC trusted publishing* (no long-lived token) — strictly more secure but requires configuration on both npm and GitHub sides and is still relatively new on pnpm. Defer.

**Why this choice:** Simplest path to a working publish. The token is scoped to publish-only on `@tde.io` and rotatable. We can migrate to OIDC later without affecting the workflow structure.

### Decision 5: Use `pnpm publish` (not `npm publish`)

**Choice:** Run `pnpm publish --access public --no-git-checks` because pnpm is already the project's package manager and `pnpm publish` handles the workspace-style setup correctly.

`--access public` is required for scoped packages (npm defaults scoped packages to private). We also set `publishConfig.access: "public"` in `package.json` so even a bare `pnpm publish` would do the right thing — belt-and-suspenders.

`--no-git-checks` is required because the workflow runs in detached-HEAD state on the tag, which pnpm would otherwise reject.

### Decision 6: README badge tracks `build.yml`, not `test.yml`

**Choice:** The "is main healthy?" signal in the README points at the build workflow. Build runs first and is what gates everything else; if build is red, test never runs.

A reader who wants the full picture can click through to the Actions tab. Adding multiple badges is noisy.

## Risks / Trade-offs

- **[Risk] Race / mismatch between `build.yml` artifact and `test.yml` consumer** when two pushes land back-to-back → Mitigation: `test.yml` keys on the triggering `workflow_run.id` and downloads from that specific run, never "latest." A second push starts its own build+test pair.

- **[Risk] Publish workflow uses a stale `dist/` artifact** if someone re-triggers `publish.yml` for an old tag → Mitigation: `publish.yml` always builds fresh for the tagged commit (does not download the original push-to-main artifact). The "fresh artifact" is the one from the tag-push-triggered `build.yml` run. Tag→artifact→publish is one chain, all for the same SHA.

- **[Risk] `NPM_TOKEN` leaks** → Mitigation: token is repo-secret (encrypted), scoped to publish-only on `@tde.io`, rotatable. Workflow never echoes it. Plan to migrate to OIDC trusted publishing as a follow-up.

- **[Risk] Version drift between git tag and `package.json`** (someone tags `v1.2.0` but `package.json` still says `1.1.0`) → Mitigation: `publish.yml` includes a guard step that asserts `package.json` version equals the tag name (minus the leading `v`). Mismatch fails the workflow before `pnpm publish` runs.

- **[Risk] Scoped package name conflict on npm** — `@tde.io` scope might not exist yet → Mitigation: documented as a prerequisite in `tasks.md`. The scope must be created on npm and an automation token issued before the first publish attempt.

- **[Trade-off] Three workflows is more YAML than one** — accepted in exchange for: (a) re-running individual stages, (b) clear separation of concerns, (c) explicit artifact reuse, (d) future expansion (e.g., adding a `release-notes.yml`) without touching unrelated workflows.

- **[Trade-off] `workflow_run` chaining adds ~10-30s latency** vs. a single workflow with `needs:` → accepted; not on a critical path.

## Migration Plan

1. Add the `NPM_TOKEN` secret to the repository (manual prerequisite — cannot be automated).
2. Verify `@tde.io` scope exists on npm and the token has publish rights on it.
3. Land this change: rename package, delete `ci.yml`, add three new workflows, update README badge.
4. On merge to `main`: `build.yml` and `test.yml` should run successfully (no publish — no tag).
5. To publish v1.0.0: push tag `v1.0.0` pointing at the merged commit. `build.yml` (tag run) → `test.yml` (tag run) → `publish.yml` → npm.

**Rollback:** Revert the change; the original `ci.yml` setup is preserved in git history.

## Open Questions

- Do we want to publish under a `latest` dist-tag only, or also tag pre-1.0 releases as `next`? — Default for v1: only `latest`. Defer dist-tag strategy until we have an actual pre-release need.
- Should `publish.yml` also create a GitHub Release with auto-generated notes? — Nice-to-have; out of scope for v1.
