## Why

The README has three small but user-visible accuracy and presentation problems: the license badge links to a `LICENSE` file that does not exist in the repo, the release instructions miss the actual publish command in step 1 and incorrectly require an `NPM_TOKEN` secret (the publish workflow already authenticates via OIDC + npm provenance), and the fenced-code language hints (`ts`, `sh`) render with very low-contrast colors on npmjs.com. These are blockers for new adopters reading the README on npm or following the release process.

## What Changes

- **BREAKING (legal):** Replace MIT with Apache-2.0 across `README.md` and `package.json` `license` field. Link to the hosted text at `https://www.apache.org/licenses/LICENSE-2.0` instead of a local `LICENSE` file. Update the README license badge to match.
- Update the README "To release a new version" steps:
  - Step 1 currently says only "Update `version` in `package.json` and merge to `main`." Append the concrete `pnpm publish` precondition / `npm version` workflow guidance so the user has the actual command to bump and tag in one place.
  - Step 2 expanded to cover both CLI (`git tag v1.2.3 && git push origin v1.2.3`) and GitHub UI (**Releases → Draft a new release**) as equivalent ways to push the release tag.
  - Remove the **Required secret: `NPM_TOKEN`** paragraph. The publish workflow already uses OIDC (`id-token: write` + `pnpm publish --provenance`); no manual npm secret is needed.
- Change fenced-code language hints in `README.md` from `ts` → `typescript` and `sh` → `bash` so npm's Prism-based highlighter produces readable colors. Document in `design.md` that npm's theme itself is not repo-controllable.
- Update the `npm-publishing` capability spec to reflect OIDC-based authentication (replacing the existing `NPM_TOKEN` requirement) and the language-hint correction.
- Add a new requirement to the `readme` capability for an OSI-aligned license section that links to a hosted license URL rather than a local file.

## Capabilities

### New Capabilities
<!-- None — this change only modifies existing capabilities. -->

### Modified Capabilities
- `readme`: add a "License section links to a hosted OSI license URL" requirement; tighten the existing release-documentation expectations to match the new step 1 + remove NPM_TOKEN mention; require fenced-code language hints to use long-form identifiers (`typescript`, `bash`).
- `npm-publishing`: replace the `NPM_TOKEN` authentication requirement with an OIDC + npm provenance requirement that matches the actual workflow (`id-token: write`, `pnpm publish --provenance`).

## Impact

- `README.md` — license badge, license section, release steps, fenced-code language hints.
- `package.json` — `license` field changes from `MIT` to `Apache-2.0`.
- `openspec/specs/readme/spec.md` — new requirement + tightened release-doc requirements.
- `openspec/specs/npm-publishing/spec.md` — replace the `NPM_TOKEN` requirement with an OIDC requirement.
- No code under `src/` changes. No CI workflow changes (the publish workflow already implements OIDC; the spec just needs to catch up).
