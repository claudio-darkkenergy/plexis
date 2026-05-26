## ADDED Requirements

### Requirement: README License section links to a hosted OSI license URL
The README SHALL include a `## License` section that names the project's license and links to the canonical hosted text of that license at an OSI-recognized URL. The README MUST NOT link to a local `LICENSE` file. The license stated in the README MUST match the SPDX identifier in `package.json` (`Apache-2.0`).

#### Scenario: License section is present and linked
- **WHEN** a developer reads the README on GitHub or npmjs.com
- **THEN** the `## License` section names the license (Apache-2.0) and the link target is `https://www.apache.org/licenses/LICENSE-2.0`
- **AND** no link points at a local `LICENSE` file path

#### Scenario: License badge matches the section
- **WHEN** a developer inspects the README badge row
- **THEN** the license badge text reads `License: Apache 2.0` and its href is `https://www.apache.org/licenses/LICENSE-2.0`

#### Scenario: Package metadata agrees with the README
- **WHEN** a developer inspects `package.json`
- **THEN** the `license` field equals `Apache-2.0`

### Requirement: README release instructions describe the actual publish flow
The README SHALL include a "To release a new version" section whose steps reflect the actual workflow: step 1 SHALL describe bumping `package.json` `version` and merging to `main`, and SHALL include the concrete command(s) a maintainer runs to do so (e.g., `npm version <patch|minor|major> --no-git-tag-version` or equivalent). The section MUST NOT claim that a `NPM_TOKEN` secret is required, because authentication is performed via OIDC and npm provenance.

#### Scenario: Step 1 names the version-bump command
- **WHEN** a maintainer reads step 1 of the release section
- **THEN** the step shows a command for bumping `package.json` `version` (e.g., `npm version patch --no-git-tag-version`) alongside the existing instruction to merge to `main`

#### Scenario: No NPM_TOKEN paragraph
- **WHEN** a maintainer reads the release section
- **THEN** no text claims that `NPM_TOKEN` is a required repository secret
- **AND** no text instructs adding an npm token to Actions secrets

#### Scenario: OIDC/provenance is noted
- **WHEN** a maintainer reads the release section
- **THEN** the section states that the publish workflow authenticates via OIDC and publishes with npm provenance (no manual token required)

### Requirement: Fenced code blocks use long-form language hints
All fenced code blocks in `README.md` SHALL use the long-form Prism-supported language identifiers (e.g., `typescript`, `bash`) rather than the short aliases (`ts`, `sh`). This MUST be applied so npm's Prism-based syntax highlighter renders readable colors on `npmjs.com`.

#### Scenario: TypeScript blocks use `typescript`
- **WHEN** a developer reads `README.md`
- **THEN** every TypeScript code fence uses ` ```typescript ` (not ` ```ts `)

#### Scenario: Shell blocks use `bash`
- **WHEN** a developer reads `README.md`
- **THEN** every shell code fence uses ` ```bash ` (not ` ```sh `)
