# Monorepo Workspace Spec

## Requirements

### Requirement: Repository is a pnpm workspace

The repository SHALL be a pnpm workspace declared by a `pnpm-workspace.yaml` file at the repository root. The workspace MUST declare package globs that cover `packages/*` and `apps/*`. The workspace MUST retain the existing `allowBuilds` configuration that disables `esbuild` install scripts.

#### Scenario: pnpm-workspace.yaml exists at the repository root

- **WHEN** a developer inspects the repository root
- **THEN** a file named `pnpm-workspace.yaml` exists at the root
- **AND** the file is valid YAML

#### Scenario: Workspace globs cover packages and apps

- **WHEN** a developer reads `pnpm-workspace.yaml`
- **THEN** the `packages` key contains both `packages/*` and `apps/*` entries

#### Scenario: allowBuilds.esbuild remains disabled

- **WHEN** a developer reads `pnpm-workspace.yaml`
- **THEN** `allowBuilds.esbuild` equals `false`

#### Scenario: pnpm recognizes both directories as workspaces

- **WHEN** a developer runs `pnpm -r list --depth -1`
- **THEN** every directory inside `packages/` containing a `package.json` is listed as a workspace project
- **AND** every directory inside `apps/` containing a `package.json` is listed as a workspace project

### Requirement: Single root lockfile

The workspace SHALL maintain exactly one lockfile: `pnpm-lock.yaml` at the repository root. Package-level lockfiles (`packages/*/pnpm-lock.yaml`, `apps/*/pnpm-lock.yaml`) SHALL NOT exist.

#### Scenario: Root lockfile is present

- **WHEN** a developer inspects the repository
- **THEN** the file `pnpm-lock.yaml` exists at the repository root

#### Scenario: No package-level lockfiles

- **WHEN** a developer searches the repository for `pnpm-lock.yaml` files
- **THEN** only the root `pnpm-lock.yaml` is found
- **AND** no `pnpm-lock.yaml` exists inside any subdirectory of `packages/` or `apps/`

### Requirement: Root package.json is a private workspace root

The repository SHALL contain a `package.json` at the root that is marked private and that does NOT declare publishable fields. The root manifest MUST contain `"private": true` and MUST NOT contain `main`, `module`, `types`, `exports`, or `files` fields. The root manifest MUST retain the `packageManager` and `engines` fields, with `packageManager` matching `pnpm@11.3.0` (or the version pinned for the project) and `engines.node` matching the project's required Node version.

#### Scenario: Root manifest is marked private

- **WHEN** a developer reads the root `package.json`
- **THEN** the `private` field equals `true`

#### Scenario: Root manifest lacks publishable fields

- **WHEN** a developer reads the root `package.json`
- **THEN** the manifest contains no `main`, `module`, `types`, `exports`, or `files` field

#### Scenario: Root manifest declares package manager and Node engine

- **WHEN** a developer reads the root `package.json`
- **THEN** the `packageManager` field begins with `pnpm@`
- **AND** the `engines.node` field is present

#### Scenario: Attempting to publish the root manifest fails or is a no-op

- **WHEN** a developer runs `pnpm publish` from the repository root
- **THEN** pnpm refuses to publish because the manifest is marked private

### Requirement: Root scripts delegate to library and docs via pnpm filter

The root `package.json` SHALL declare pass-through scripts that delegate workspace-wide build/test/typecheck operations to the library package using `pnpm --filter @tde.io/plexis`, and docs operations to the docs package using `pnpm --filter @tde.io/docs`. At minimum, the root MUST declare `build`, `test`, `typecheck`, `docs`, and `docs:build` scripts.

#### Scenario: Root build script delegates to library

- **WHEN** a developer reads the root `package.json` `scripts.build`
- **THEN** the command invokes `pnpm --filter @tde.io/plexis run build` (or an equivalent filter form)

#### Scenario: Root test script delegates to library

- **WHEN** a developer reads the root `package.json` `scripts.test`
- **THEN** the command invokes `pnpm --filter @tde.io/plexis run test`

#### Scenario: Root typecheck script delegates to library

- **WHEN** a developer reads the root `package.json` `scripts.typecheck`
- **THEN** the command invokes `pnpm --filter @tde.io/plexis run typecheck`

#### Scenario: Root docs script starts the docs dev server

- **WHEN** a developer reads the root `package.json` `scripts.docs`
- **THEN** the command invokes `pnpm --filter @tde.io/docs run dev`

#### Scenario: Root docs:build script builds the docs site

- **WHEN** a developer reads the root `package.json` `scripts.docs:build`
- **THEN** the command invokes `pnpm --filter @tde.io/docs run build`

#### Scenario: Running pnpm build at the root produces the library dist

- **WHEN** a developer runs `pnpm build` from the repository root after `pnpm install`
- **THEN** the command completes with exit code 0
- **AND** the directory `packages/plexis/dist/` exists and contains `esm/`, `cjs/`, and `types/` subdirectories

#### Scenario: Running pnpm docs at the root starts the dev server

- **WHEN** a developer runs `pnpm docs` from the repository root
- **THEN** the Astro development server for `apps/docs/` starts

### Requirement: Library package lives at `packages/plexis/`

The publishable library SHALL live in `packages/plexis/`. That directory MUST contain a `package.json` whose `name` field equals `@tde.io/plexis`. The directory MUST contain the library's source (`src/`), tests (`tests/`), examples (`examples/`), and all build/test configuration files needed to build, test, and publish the library.

#### Scenario: Library package directory exists

- **WHEN** a developer inspects `packages/`
- **THEN** the directory `packages/plexis/` exists

#### Scenario: Library package manifest has the canonical scoped name

- **WHEN** a developer reads `packages/plexis/package.json`
- **THEN** the `name` field equals `@tde.io/plexis`

#### Scenario: Library source tree lives inside the package

- **WHEN** a developer inspects `packages/plexis/`
- **THEN** the subdirectories `src/`, `tests/`, and `examples/` exist
- **AND** no top-level `src/`, `tests/`, or `examples/` directories exist at the repository root

#### Scenario: Library build configs live inside the package

- **WHEN** a developer inspects `packages/plexis/`
- **THEN** the files `tsconfig.json`, `tsconfig.types.json`, `rolldown.config.ts`, and `vitest.config.ts` exist inside the package directory
- **AND** none of those files exist at the repository root

### Requirement: Library package contains its own README

The library package SHALL contain a `README.md` at `packages/plexis/README.md`. This README is what `pnpm publish` includes in the published tarball.

#### Scenario: Package-level README exists

- **WHEN** a developer inspects `packages/plexis/`
- **THEN** a file `packages/plexis/README.md` exists

#### Scenario: Published tarball includes the package README

- **WHEN** a developer runs `pnpm pack --dry-run` inside `packages/plexis/`
- **THEN** the file listing includes `README.md` resolved from `packages/plexis/README.md`

### Requirement: Apps directory reserved for non-published applications

The repository SHALL contain an `apps/` directory at the root. Any package added under `apps/` MUST be marked private (`"private": true` in its `package.json`) and MUST NOT be a publish target.

#### Scenario: apps/ exists and is tracked

- **WHEN** a developer clones the repository
- **THEN** the `apps/` directory exists in the working tree

#### Scenario: Any app under apps/ is private

- **WHEN** a developer reads any `package.json` inside `apps/`
- **THEN** that manifest contains `"private": true`

### Requirement: Single shared node_modules via pnpm

The workspace SHALL share dependencies through pnpm's content-addressed store. The `packageManager` field in the root `package.json` SHALL pin pnpm to a specific version.

#### Scenario: packageManager pins pnpm

- **WHEN** a developer reads the root `package.json`
- **THEN** the `packageManager` field starts with `pnpm@` followed by a version

#### Scenario: .gitignore excludes nested node_modules

- **WHEN** a developer reads `.gitignore`
- **THEN** a rule excludes `node_modules` at any depth (e.g., `node_modules` or `**/node_modules`)
