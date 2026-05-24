## 1. Draft README content

- [x] 1.1 Write the header section: project name, badge bar (build, npm version, license), and one-line description stating Plexis is a zero-dependency TypeScript library for domain state machines and finite workflow pipelines
- [x] 1.2 Write the Installation section with `npm install plexis`, `pnpm add plexis`, and `yarn add plexis` code blocks
- [x] 1.3 Write the Quick Start section with a single end-to-end composable-API example (`definePipeline` + `defineDomain` + `domain.follow(...)`) drawn from the spec

## 2. Core concepts and links

- [x] 2.1 Write the Core Concepts section explaining the Domain vs. Pipeline two-layer model in plain language (3–5 sentences, no code required)
- [x] 2.2 Add a "Zero dependencies" callout and a link to `.specs/plexis-composable-spec.md` for full API reference

## 3. Verification

- [x] 3.1 Confirm the quick-start TypeScript example is consistent with the current `src/types.ts` signatures (manually trace the types — no build system required yet)
- [x] 3.2 Read the finished README as a first-time visitor and verify the < 2-minute orientation path flows naturally
