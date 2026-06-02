# Docs Integrations Guides Spec

## Requirements

### Requirement: Integration guides live under `guides/integrations/`

The docs site SHALL contain an `integrations/` subdirectory under `apps/docs/src/content/docs/guides/` holding exactly two MDX guides: `react.mdx` and `vue.mdx`, relocated from `guides/advanced/`. Each file MUST have Starlight frontmatter with a non-empty `title` and `description`.

#### Scenario: Both integration guide files exist in the new location

- **WHEN** a developer lists `apps/docs/src/content/docs/guides/integrations/`
- **THEN** the directory contains `react.mdx` and `vue.mdx`
- **AND** each file begins with frontmatter declaring a non-empty `title` and `description`

#### Scenario: React and Vue no longer live under advanced

- **WHEN** a developer lists `apps/docs/src/content/docs/guides/advanced/`
- **THEN** it does not contain `react.mdx` or `vue.mdx`

### Requirement: Integrations are scoped to named third-party targets

The Integrations bucket SHALL contain only guides bound to a named third-party target — a framework or provider. A guide whose subject is a runtime *property* (such as statelessness or "serverless") rather than a named target SHALL NOT live in Integrations.

#### Scenario: Each integration guide names a target

- **WHEN** a developer reads any guide under `guides/integrations/`
- **THEN** the guide is scoped to a named framework or provider (e.g., React, Vue)

### Requirement: React guide binds a domain via `useSyncExternalStore`

`react.mdx` SHALL show a minimal React binding that connects a Plexis domain to component state using `useSyncExternalStore`, driven by `domain.subscribe` and `domain.snapshot`. The guide SHALL focus on the subscribe/snapshot seam rather than React internals.

#### Scenario: Binding uses subscribe and snapshot

- **WHEN** a reader inspects the React hook in `react.mdx`
- **THEN** it passes `domain.subscribe` as the subscribe argument and `domain.snapshot` (or a wrapper returning the current snapshot) as the getSnapshot argument to `useSyncExternalStore`
- **AND** the component re-renders when the domain transitions

### Requirement: Vue guide binds a domain via a ref and subscribe

`vue.mdx` SHALL show a minimal Vue binding that connects a Plexis domain to a reactive `ref` updated inside a `domain.subscribe` callback, with the unsubscribe function cleaned up on unmount. The guide SHALL focus on the subscribe/snapshot seam rather than Vue internals.

#### Scenario: Binding uses a ref updated by subscribe

- **WHEN** a reader inspects the Vue composable in `vue.mdx`
- **THEN** it initializes a `ref` from `domain.snapshot()` and updates that `ref` inside the `domain.subscribe` callback
- **AND** it calls the returned unsubscribe function on component unmount

### Requirement: Integrations sidebar group is ordered after Advanced

The Starlight sidebar in `apps/docs/astro.config.mjs` SHALL include an `Integrations` group whose array position is after the `Advanced` group and before the `Reference` group. The group MUST link to both integration slugs: `guides/integrations/react` and `guides/integrations/vue`.

#### Scenario: Integrations group is positioned after Advanced and before Reference

- **WHEN** a developer reads the `sidebar` array in `apps/docs/astro.config.mjs`
- **THEN** an item with `label: 'Integrations'` appears at an index greater than the `Advanced` group and less than the `Reference` group

#### Scenario: Integrations group links React and Vue

- **WHEN** a visitor views any docs page
- **THEN** the sidebar `Integrations` section displays links to the React and Vue guides

### Requirement: Integration guides use only long-form code fence languages

Every fenced code block across the integration guides SHALL use a long-form language identifier — only `typescript` or `bash` — consistent with the rest of the docs site.

#### Scenario: No short-alias or other-language fences

- **WHEN** a developer reads any integration MDX file
- **THEN** every opening code fence is either ` ```typescript ` or ` ```bash `
- **AND** no fence uses `ts`, `sh`, `jsx`, `tsx`, `vue`, or any other identifier
