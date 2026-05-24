## Why

The Plexis repo has no automated verification — pushes to `main` can land breaking changes to the build, type system, or test suite without anyone noticing until the next developer pulls. As the composable API moves from spec to implementation, we need a continuous safety net that catches regressions on every push so contributors can trust `main` is always green.

## What Changes

- Add a GitHub Actions workflow that runs on every push to `main`.
- The workflow installs dependencies via pnpm, runs the typecheck (`tsc --noEmit`), builds the library (ESM + CJS + types), and runs the test suite (`vitest run`).
- Pin Node.js to a single supported version (the project's `engines.node` minimum, `>=19`) initially; matrix expansion can come later.
- Cache pnpm's store between runs to keep CI fast.
- Display a passing/failing status badge in `README.md` so the health of `main` is visible at a glance.

## Capabilities

### New Capabilities
- `ci-workflows`: Automated continuous integration via GitHub Actions covering typecheck, build, and test verification on every push to `main`.

### Modified Capabilities
<!-- None — no existing specs are affected. -->

## Impact

- **New files**: `.github/workflows/ci.yml`.
- **Modified files**: `README.md` (add status badge).
- **No code changes**: `src/`, `tests/`, build config, and runtime behavior are untouched.
- **No new runtime dependencies**: GitHub-hosted runners and existing devDependencies (pnpm, rolldown, vitest, tsc) cover everything.
- **Repository settings**: optional follow-up to mark the CI check as required for protected branches — out of scope for this change.
