# Docs Site Spec

## Requirements

### Requirement: Docs site package exists at apps/docs/

The repository SHALL contain a documentation site package at `apps/docs/`. This directory MUST contain a `package.json` with `"name": "@tde.io/docs"`, `"private": true`, and scripts for `dev` (local development) and `build` (static output). The package MUST use Astro with the Starlight integration as its framework.

#### Scenario: apps/docs package.json exists and is private

- **WHEN** a developer inspects `apps/docs/`
- **THEN** a `package.json` exists with `"name": "@tde.io/docs"` and `"private": true`

#### Scenario: Starlight is declared as a dependency

- **WHEN** a developer reads `apps/docs/package.json`
- **THEN** `@astrojs/starlight` appears in `dependencies` or `devDependencies`

#### Scenario: Dev script starts the Astro dev server

- **WHEN** a developer runs `pnpm dev` inside `apps/docs/`
- **THEN** the Astro development server starts and serves the docs site locally

#### Scenario: Build script produces static output

- **WHEN** a developer runs `pnpm build` inside `apps/docs/`
- **THEN** the command exits 0 and a `dist/` directory is produced containing static HTML, CSS, and JS files

### Requirement: Starlight site has a complete content structure

The docs site SHALL contain MDX content files covering at minimum: a landing/quick-start page, a Domain guide, a Pipeline guide, an API reference page, and a Contributor guide. Content MUST be authored in MDX under `src/content/docs/` following Starlight's content collections convention.

#### Scenario: Landing page exists

- **WHEN** a visitor navigates to the docs site root
- **THEN** a page renders with the Plexis one-line description and a Quick Start section

#### Scenario: Domain guide exists

- **WHEN** a visitor navigates to the Domain guide
- **THEN** a page renders explaining the Domain concept, state, edges, and lifecycle hooks with code examples

#### Scenario: Pipeline guide exists

- **WHEN** a visitor navigates to the Pipeline guide
- **THEN** a page renders explaining the Pipeline concept, nodes, forks, and terminal nodes with code examples

#### Scenario: API reference page exists

- **WHEN** a visitor navigates to the API reference
- **THEN** a page renders listing all public exports: `defineDomain`, `definePipeline`, `state`, `edge`, `node`, `fork`, `terminal`, `createTracer`, and `PlexisError` with their signatures and descriptions

#### Scenario: Contributor guide exists

- **WHEN** a visitor navigates to the Contributor guide
- **THEN** a page renders covering how to set up the monorepo locally, run tests, build the library, and update the docs

### Requirement: Starlight sidebar navigation is configured

The Starlight site SHALL declare an explicit sidebar configuration in `astro.config.mjs` that groups pages into logical sections: Guides, Reference, and Contributing.

#### Scenario: Sidebar renders guide pages

- **WHEN** a visitor views any page on the docs site
- **THEN** the sidebar displays links to the Domain guide, Pipeline guide, and other guide-section pages

#### Scenario: Sidebar renders reference and contributing links

- **WHEN** a visitor views any page on the docs site
- **THEN** the sidebar displays links to the API reference page and the Contributor guide

### Requirement: Site metadata and branding are configured

The Starlight site SHALL declare a `title` of `"Plexis"` and a `description` matching the library's one-line description. The site SHALL apply the Gruvbox color theme via the `starlight-theme-gruvbox` plugin and SHALL retain Starlight's built-in light/dark color scheme toggle.

#### Scenario: Site title appears in browser tab

- **WHEN** a visitor opens any docs page
- **THEN** the browser tab title includes `"Plexis"`

#### Scenario: Gruvbox theme is applied

- **WHEN** a developer reads `astro.config.mjs`
- **THEN** `starlight-theme-gruvbox` is registered in the Starlight `plugins` array (`gruvbox()`)
- **AND** `starlight-theme-gruvbox` appears in `apps/docs/package.json` dependencies

#### Scenario: Dark mode is available

- **WHEN** a visitor's OS is set to dark mode or they toggle the theme
- **THEN** the site renders in the Gruvbox dark color scheme

### Requirement: Site documents the in-development version and declares the workspace dependency

The docs site SHALL document the in-development ("next") version of the library. `apps/docs/package.json` MUST declare `@tde.io/plexis` as a `workspace:*` dependency, NOT a pinned npm version. The site SHALL display a persistent banner indicating it documents the development version, with a link to the latest stable release on npm.

#### Scenario: @tde.io/plexis is a workspace dependency

- **WHEN** a developer reads `apps/docs/package.json`
- **THEN** `@tde.io/plexis` appears in `devDependencies` with the value `"workspace:*"`
- **AND** it is NOT pinned to a published npm version range

#### Scenario: Version banner is visible

- **WHEN** a visitor opens any docs page
- **THEN** a banner indicates the site documents the in-development ("next") version
- **AND** the banner links to the latest stable release on npm

#### Scenario: Docs build does not require the library to be built

- **WHEN** a developer runs `pnpm docs:build` from the repository root without having run `pnpm build` first
- **THEN** the docs build exits 0
- **AND** does not fail on a missing `@tde.io/plexis` build artifact (no docs module imports the library in this change)

### Requirement: All code examples use long-form language hints

All fenced code blocks in MDX content files SHALL use long-form language identifiers (`typescript`, `bash`) rather than short aliases (`ts`, `sh`).

#### Scenario: TypeScript code blocks use full identifier

- **WHEN** a developer reads any MDX file in `src/content/docs/`
- **THEN** all TypeScript fenced code blocks open with ` ```typescript `

#### Scenario: Shell code blocks use full identifier

- **WHEN** a developer reads any MDX file in `src/content/docs/`
- **THEN** all shell/bash fenced code blocks open with ` ```bash `

### Requirement: Vercel deploys the docs site automatically

The docs site SHALL be deployed to Vercel via the Vercel GitHub integration. Vercel MUST be configured with **Root Directory: `apps/docs`** so it resolves the Astro project correctly. Every push to `main` MUST trigger a production deployment. Every push to any other branch or PR MUST trigger a preview deployment with a unique preview URL.

#### Scenario: Push to main triggers production deployment

- **WHEN** a commit is merged to `main`
- **THEN** Vercel automatically builds and deploys the docs site to the production URL

#### Scenario: Push to a feature branch or PR triggers a preview deployment

- **WHEN** a commit is pushed to any branch other than `main` or a pull request is opened/updated
- **THEN** Vercel builds a preview deployment and posts a unique preview URL to the GitHub commit status or PR check

#### Scenario: Vercel root directory is set to apps/docs

- **WHEN** a maintainer inspects the Vercel project settings
- **THEN** the "Root Directory" setting is `apps/docs`
- **AND** Vercel resolves `package.json` and `astro.config.mjs` relative to that directory

#### Scenario: Vercel installs from the workspace root so workspace:* resolves

- **WHEN** Vercel builds the docs project with Root Directory `apps/docs`
- **THEN** it installs dependencies using the repo-root pnpm workspace (pnpm-workspace detection enabled)
- **AND** the `workspace:*` dependency on `@tde.io/plexis` resolves to the in-repo package without error
