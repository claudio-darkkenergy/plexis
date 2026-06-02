## MODIFIED Requirements

### Requirement: Root scripts delegate to library via pnpm filter

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
