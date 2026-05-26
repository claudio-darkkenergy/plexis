## Context

The README is the package's first-impression surface on both GitHub and npmjs.com. Three independent issues degrade it today:

1. **License section points at a non-existent file.** The badge and the `## License` section link to `LICENSE`, but no `LICENSE` file exists at the repo root. `package.json` declares `"license": "MIT"`.
2. **Release docs are inaccurate.** Step 1 of "To release a new version" only says to bump `package.json` and merge to `main` — it does not show the command to do the bump. The section then declares `NPM_TOKEN` a required secret, but the actual `publish.yml` workflow already uses GitHub OIDC (`permissions: id-token: write`) and `pnpm publish --provenance` with no NPM token configured.
3. **Code blocks are unreadable on npmjs.com.** The README uses short language hints (` ```ts `, ` ```sh `). npm's README renderer uses Prism.js with a fixed theme, and short hints fall back to lower-contrast styling than long-form identifiers (`typescript`, `bash`).

The repo cannot change npm's CSS. The only repo-side lever is the language hint passed to the fence.

Stakeholders: maintainer (release process accuracy), downstream consumers (license clarity, readable docs on npm).

## Goals / Non-Goals

**Goals:**
- Make the License section accurate and self-contained (no missing `LICENSE` file, no broken link).
- Make the release section runnable: step 1 has the actual command, and no false `NPM_TOKEN` requirement.
- Improve npm-side rendering of code samples without depending on npm to change anything.
- Keep specs (`readme`, `npm-publishing`) consistent with the new reality.

**Non-Goals:**
- Customizing or themeing npm's code-block CSS. **This is not possible from the repo** — npm renders READMEs server-side with its own theme.
- Adding a local `LICENSE` file. The user explicitly prefers a hosted URL.
- Changing the publish workflow (`publish.yml`). It already uses OIDC + provenance; only the spec and README need to catch up.
- Refactoring or restructuring other README sections.

## Decisions

### Decision 1 — License: Apache-2.0 with hosted URL

Switch from MIT to **Apache-2.0**, link to `https://www.apache.org/licenses/LICENSE-2.0`, and update the SPDX identifier in `package.json`.

**Rationale:** The user asked for the "most open-source-aligning" license linkable from a hosted URL. Among OSI-approved permissive licenses, Apache-2.0 is the only widely-adopted one with an **explicit patent grant**, which protects both contributors and downstream commercial users. It is the canonical choice for serious permissive libraries (e.g., Kubernetes, TypeScript, Rust toolchain). MIT was the prior license but lacks the patent clause.

**Alternatives considered:**
- *MIT (status quo):* simpler, but no patent grant. The user explicitly asked to change away from the current setup.
- *0BSD:* most permissive, but extreme — drops attribution entirely. Uncommon for libraries with a single primary author who may want some attribution preserved.
- *BSD-3-Clause:* permissive + non-endorsement, but adds little over MIT for a JS library and is uncommon in the npm ecosystem.

### Decision 2 — License section format

Use a one-line section:

```markdown
## License

[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) © Claudio Nunez Jr
```

And update the badge in the header row to:

```markdown
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)
```

**Rationale:** No local file dependency; both the badge and the section point at the same canonical hosted text. Shields.io supports an `Apache_2.0` badge variant out of the box.

### Decision 3 — Release section rewrite

Replace the current three-step list + "Required secret" paragraph with:

```markdown
**To release a new version:**

1. Bump `package.json` version and merge to `main`:
   ```bash
   npm version patch --no-git-tag-version   # or minor / major
   git commit -am "release: vX.Y.Z" && git push
   ```
2. Push a tag matching the version: `git tag v1.2.3 && git push origin v1.2.3`.
3. The Publish workflow verifies that the tag name matches `package.json` version, then publishes `@tde.io/plexis@1.2.3` to npm.

The Publish workflow authenticates to npm via GitHub OIDC and publishes with npm provenance — no `NPM_TOKEN` secret is required.
```

**Rationale:** Step 1 now shows the actual command (`npm version <bump> --no-git-tag-version`) and explicitly skips tag creation so step 2 stays the single source of truth for the tag. The "Required secret" paragraph is removed and replaced with one closing sentence stating how auth actually works. This matches `.github/workflows/publish.yml` (`id-token: write` + `pnpm publish --provenance`).

**Alternatives considered:**
- *Use `pnpm version` instead of `npm version`:* equivalent behavior, but `npm version` is universally available and the README already uses `npm install` in the install block. Keeping `npm`-prefixed commands in one section is consistent.
- *Let step 1 also create the tag (`npm version patch` without `--no-git-tag-version`):* would collapse steps 1 and 2, but loses the explicit "review before tagging" gate. The user asked to *add* the publish command to step 1, not to collapse steps.

### Decision 4 — Code-block language hints

Change `ts` → `typescript` and `sh` → `bash` in all fences in `README.md`.

**Rationale:** Prism.js (which npm uses) supports both short and long aliases, but its default theme as styled on npmjs.com applies fuller token-class coverage to canonical names. Anecdotally, `typescript` highlights identifiers, types, and keywords distinctly, while `ts` sometimes falls back to plain-text rendering with low-contrast greys. This is a zero-risk, zero-cost change that is the only repo-side lever.

**Important caveat (must appear in the spec/design but not necessarily the README):** the theme itself (background, foreground, contrast ratios) is owned by npmjs.com's CSS. We cannot configure it. If the change does not visibly improve contrast after publishing, we have exhausted repo-side options and the user must either accept npm's theme or read the README on GitHub.

### Decision 5 — Spec deltas

- `readme` capability: ADDED requirements for the License section, the release-doc accuracy, and long-form language hints. Existing requirements are untouched.
- `npm-publishing` capability: REMOVED the existing `NPM_TOKEN` requirement (with `Reason` + `Migration` blocks) and ADDED an OIDC + provenance requirement that matches the actual workflow.

**Rationale:** The `npm-publishing` spec currently misrepresents reality — the workflow has been on OIDC for some time. We treat that as a spec bug, not a behavior change. Archiving this change will make the spec match the workflow.

## Risks / Trade-offs

- **[License switch is a one-way decision.]** Going from MIT to Apache-2.0 changes the obligations on downstream forks. There is no published v1.x consumer base large enough for this to break workflows today, but anyone who has already shipped against `1.0.x` continues to be governed by MIT for that artifact. → Mitigation: note the version where the switch lands in the next release notes / CHANGELOG entry if/when one is added.
- **[npm theme may still look bad.]** The language-hint fix is best-effort. npm's CSS could still render TypeScript samples with poor contrast for some readers. → Mitigation: design.md (this file) documents the limitation so future maintainers do not chase a fix that does not exist. The README's GitHub rendering remains the primary read path.
- **[OIDC trust must already be configured on npmjs.com.]** Removing the `NPM_TOKEN` documentation in favor of OIDC presupposes that the `@tde.io/plexis` package has its npm-side "Trusted Publisher" configuration set to this GitHub repo. If it has not, publishes will fail despite the spec saying OIDC is the path. → Mitigation: the migration block in the REMOVED requirement explicitly calls this out; we have empirical evidence (the workflow file uses `--provenance` and no `NPM_TOKEN`) that this is already configured.

## Migration Plan

This change is documentation-and-metadata only, no runtime behavior changes:

1. Update `package.json` `license` field: `"MIT"` → `"Apache-2.0"`.
2. Update `README.md`:
   - Header badge: MIT → Apache 2.0, link target → `https://www.apache.org/licenses/LICENSE-2.0`.
   - `## License` section body: link to the hosted Apache URL, drop the `LICENSE` file reference.
   - Release section: rewrite per Decision 3.
   - Code fences: ` ```ts ` → ` ```typescript `, ` ```sh ` → ` ```bash `.
3. No `LICENSE` file is added. No CI workflow file changes.
4. After merge, the next `v*.*.*` tag picks up the new license metadata on npm automatically (npm reads `license` from the published `package.json`).

**Rollback:** revert the single commit. There is no runtime state to undo.

## Open Questions

None — all four decisions above are answered. The user confirmed Apache-2.0 and the language-hint tweak in the proposal phase.
