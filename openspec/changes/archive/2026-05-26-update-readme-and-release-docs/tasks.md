## 1. Package metadata

- [x] 1.1 Update `package.json` `license` field from `"MIT"` to `"Apache-2.0"`.
- [x] 1.2 Verify `package.json` parses (`node -e "require('./package.json')"`) and no other field references MIT.

## 2. README — License

- [x] 2.1 Replace the License badge in the badge row with the Apache 2.0 shield: `[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)`.
- [x] 2.2 Rewrite the `## License` section to `[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) © Claudio Nunez Jr` (no `LICENSE` file link).
- [x] 2.3 Confirm no remaining reference to a local `LICENSE` file anywhere in `README.md`.

## 3. README — Release section

- [x] 3.1 Rewrite step 1 of "To release a new version" to show the bump command (`npm version patch --no-git-tag-version`, with a comment noting `minor` / `major` alternatives) alongside the existing merge-to-`main` instruction.
- [x] 3.2 Delete the `**Required secret:** NPM_TOKEN ...` paragraph.
- [x] 3.3 Append a single closing sentence stating that the Publish workflow authenticates via GitHub OIDC and publishes with npm provenance — no `NPM_TOKEN` secret is required.
- [x] 3.4 Confirm the section still reads cleanly end-to-end after the deletions/additions (no orphan headings, no dangling references).

## 4. README — Code fence language hints

- [x] 4.1 Replace every ` ```ts ` opening fence in `README.md` with ` ```typescript `.
- [x] 4.2 Replace every ` ```sh ` opening fence in `README.md` with ` ```bash `.
- [x] 4.3 Grep `README.md` for residual `^```(ts|sh)$` lines to confirm none remain.

## 5. Verification

- [x] 5.1 Render `README.md` locally (GitHub preview or any markdown previewer) and confirm: license badge displays "Apache 2.0", license link resolves to `https://www.apache.org/licenses/LICENSE-2.0`, release section reads correctly, code blocks parse without warnings.
- [x] 5.2 Verify `package.json` `license` is `Apache-2.0` and matches the README claim.
- [x] 5.3 Confirm `.github/workflows/publish.yml` is unchanged (this change does NOT touch CI; the workflow already implements OIDC + provenance).

## 6. Spec sync

- [x] 6.1 No action — the spec deltas under `openspec/changes/update-readme-and-release-docs/specs/` will be merged into `openspec/specs/` automatically by `/opsx:archive` after the README changes ship. Do not manually edit `openspec/specs/readme/spec.md` or `openspec/specs/npm-publishing/spec.md` during apply.
