## MODIFIED Requirements

### Requirement: Event names use camelCase

Every event name passed to `on()`, `follow()`, and `can()`, and every event name referenced in event unions, tracer output, or surrounding prose, SHALL be written in camelCase. `ALL_CAPS` event names MUST be converted: single-word names become lowercase and underscore-separated words become camelCase.

#### Scenario: Single-word event re-cased

- **WHEN** a snippet contains `on('SUBMIT', target('processing'))`
- **THEN** it is rewritten as `on('submit', target('processing'))`

#### Scenario: Multi-word event re-cased

- **WHEN** a snippet contains `on('SET_PAYMENT', target('paying'))`
- **THEN** it is rewritten as `on('setPayment', target('paying'))`

#### Scenario: Event references stay consistent across a snippet

- **WHEN** an event name is re-cased at its `on()` declaration
- **THEN** every matching `follow()`, `can()`, event-union type, and prose mention of that event in the same snippet is re-cased identically
