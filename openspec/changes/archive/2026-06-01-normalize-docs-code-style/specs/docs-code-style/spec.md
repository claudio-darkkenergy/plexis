## ADDED Requirements

### Requirement: No inline padding whitespace in code snippets

Authored code snippets (in docs, examples, tests, and authoring
markdown) SHALL NOT contain runs of two or more consecutive spaces
except as leading indentation. Any non-leading run of two or more
spaces MUST be collapsed to a single space.

#### Scenario: Padded call arguments collapsed

- **WHEN** a snippet contains `fork(undefined,        'saga-failed-no-stock', { label: 'no-stock' });`
- **THEN** it is rewritten as `fork(undefined, 'saga-failed-no-stock', { label: 'no-stock' });`

#### Scenario: Leading indentation preserved

- **WHEN** a snippet line begins with spaces used for nesting/indentation
- **THEN** that leading indentation is left unchanged and only interior multi-space runs are collapsed

### Requirement: Event names use camelCase

Every event name passed to `on()`, `follow()`, and `can()`, and every
event name referenced in edge unions, tracer output, or surrounding
prose, SHALL be written in camelCase. `ALL_CAPS` event names MUST be
converted: single-word names become lowercase and underscore-separated
words become camelCase.

#### Scenario: Single-word event re-cased

- **WHEN** a snippet contains `on('SUBMIT', { target: 'processing' })`
- **THEN** it is rewritten as `on('submit', { target: 'processing' })`

#### Scenario: Multi-word event re-cased

- **WHEN** a snippet contains `on('SET_PAYMENT', { target: 'paying' })`
- **THEN** it is rewritten as `on('setPayment', { target: 'paying' })`

#### Scenario: Event references stay consistent across a snippet

- **WHEN** an event name is re-cased at its `on()` declaration
- **THEN** every matching `follow()`, `can()`, edge-union type, and prose mention of that event in the same snippet is re-cased identically

### Requirement: Code snippet lines fit within 80 columns

Authored code-snippet lines SHALL fit within 80 columns. A line that
would exceed 80 columns MUST be wrapped across multiple lines using
idiomatic JavaScript/TypeScript wrapping (e.g. one call argument or
chain segment per line) wherever the syntax permits.

#### Scenario: Long call wrapped

- **WHEN** a single-line call would exceed 80 columns
- **THEN** its arguments are broken onto multiple lines so that no resulting line exceeds 80 columns

#### Scenario: Unbreakable line left intact

- **WHEN** a line exceeds 80 columns but cannot be broken without changing meaning (e.g. a long URL or unbreakable string literal)
- **THEN** the line is left as-is rather than altered incorrectly
