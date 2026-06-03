## RENAMED Requirements

- FROM: `### Requirement: \`followFrom\` throws \`STATE_MISMATCH\``
- TO: `### Requirement: \`followFrom\` throws \`PHASE_MISMATCH\``

## MODIFIED Requirements

### Requirement: Documented error codes

`PlexisError.code` SHALL be one of the documented codes: `UNKNOWN_EVENT`, `PHASE_MISMATCH`, `UNKNOWN_INITIAL_PHASE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_PHASE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`, `BUILDER_CLOSED`, `DUPLICATE_REGISTRATION`, `MISSING_TARGET`, `INVALID_TARGET`. The library SHALL NOT throw `PlexisError` with an undocumented `code`. The phase-related codes are renamed from `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, and `UNKNOWN_TARGET_STATE`.

#### Scenario: Only documented codes are thrown

- **WHEN** any `PlexisError` is thrown by the library
- **THEN** its `code` SHALL be one of the documented codes and SHALL NOT be `STATE_MISMATCH`, `UNKNOWN_INITIAL_STATE`, or `UNKNOWN_TARGET_STATE`

### Requirement: Strict mode controls `UNKNOWN_EVENT` behavior

When a Domain is constructed with `strict: true`, calling `follow(unknownEvent)` SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`. When `strict: false`, the same call SHALL return a result with `status: 'ignored'` and SHALL NOT throw.

#### Scenario: Strict mode throws on unknown event

- **WHEN** `domain.follow('unknown')` is called on a Domain with `strict: true` whose current phase declares no `on` handler for `'unknown'`
- **THEN** the call SHALL throw `PlexisError` with `code === 'UNKNOWN_EVENT'`, `domainId` matching the Domain id, and the offending phase recorded

#### Scenario: Non-strict mode ignores unknown event

- **WHEN** the same call is made on an otherwise identical Domain with `strict: false`
- **THEN** the call SHALL return `status: 'ignored'` and the Domain SHALL NOT throw

### Requirement: Construction-time validation always throws

Structural errors detected at construction (`UNKNOWN_INITIAL_PHASE`, `UNKNOWN_INITIAL_NODE`, `UNKNOWN_TARGET_PHASE`, `UNKNOWN_TARGET_NODE`, `UNKNOWN_NODE`) SHALL throw `PlexisError` regardless of `strict` mode. These are not runtime decisions and cannot be silently ignored.

#### Scenario: Unknown target phase throws at construction even in non-strict mode

- **WHEN** a Domain is constructed with `strict: false` and an `on` handler whose `target: 'missing'` does not reference an existing phase
- **THEN** construction SHALL throw `PlexisError` with `code === 'UNKNOWN_TARGET_PHASE'`

### Requirement: `followFrom` throws `PHASE_MISMATCH`

`domain.followFrom(expectedPhase, event, payload?)` SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'` when the Domain's current phase does not equal `expectedPhase`. The error SHALL carry `domainId`, the expected phase, and the actual phase.

#### Scenario: followFrom on the wrong phase throws PHASE_MISMATCH

- **WHEN** the Domain's current phase is `'pending'` and `followFrom('processing', 'complete')` is called
- **THEN** the call SHALL throw `PlexisError` with `code === 'PHASE_MISMATCH'`, the `domainId` set, and both the expected and actual phase values recoverable from the error
