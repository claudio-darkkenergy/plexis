---
name: tdd-workflow
version: 1.0.0
description: Enforce Test-Driven Development using the Red → Green → Refactor cycle for this project.
triggers: Any time Claude writes new logic, adds a feature, fixes a bug, or refactors code in any workspace that has tests.
config: .claude/skills/skill-config.md
---

## ⚠️ Read Config First

Before applying any rule in this skill, read `.claude/skills/skill-config.md`.
All folder paths, tooling references, framework conventions, and code examples must use the values defined there. Never assume conventions from a previous project.

---

## Project Conventions

See `.claude/skills/skill-config.md` for the full list of:

- Test runner, assertion library, and spy/stub library in use
- Spec file location and naming convention
- Test environment (real browser, jsdom, or Node)
- How to run all tests, watch mode, and debug mode
- Mock/spy API (do not use a different mock API than the one specified)
- Import style for assertions and mocks
- Bootstrap helper and support component locations

---

## The Core Loop

### 🔴 Red — write ONE failing test

Write one test for behavior that does not exist yet. If it passes immediately, the test is wrong. Never write more than one failing test at a time.

Add the remaining cases to a `// @TODO` list at the top of the spec file:

```ts
// <test-folder>/unit/<module>.spec.ts
//
// @TODO <method>() — <next expected behavior>
// @TODO <method>() — <another case>
```

Pick the next item from this list only after the current test is green and refactored.

### 🟢 Green — minimum code to pass

Write the least code that makes the failing test pass. No extra logic, no future-proofing, no cleanup. The goal is green, not beautiful.

### 🔵 Refactor — clean code _and_ test, stay green

Clean up the implementation and the test file before picking the next test case. Both the code and the test are production artifacts.

---

## The Bootstrapping Problem

How to write a test when the function / component does not exist yet:

1. Write the test as if the API already exists.
2. Let TypeScript errors guide what needs to be created.
3. Create empty stubs that throw `new Error('not implemented')` to make the file compile.
4. The test now runs and is red — proceed to Green.

```ts
// Step 1 — test written first (function does not exist yet)
// Import path from skill-config.md → Folder Conventions → source under test
import { <functionName> } from '<source-folder>/<module>';
import { expect } from '<assertion-library>';  // from skill-config.md

describe('<functionName>', () => {
    it('should <expected behavior> when <condition>', () => {
        const result = <functionName>(<input>);
        expect(result.<property>).to.equal(<expected>);
    });
});

// Step 2 — create the stub so the file compiles and the test is runnable
// <source-folder>/<module>.ts
export function <functionName>(<param>: <Type>): <ReturnType> {
    throw new Error('not implemented');
}
```

Run the test command from skill-config.md — test fails (red). Now implement.

---

## The SOLID Connection

If a test is hard to write, diagnose which SOLID principle is violated before writing any implementation code.

| Test difficulty                                                  | Likely violation                                               | Fix first                                                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Hard to mock a dependency (external SDK, service client)         | DIP — depend on the service abstraction interface, not the SDK | Add interface in the service-interface folder (see skill-config.md → Notes → External data boundaries); inject it |
| Must set up too many unrelated things before getting to the unit | SRP — component/function doing too much                        | Split: extract the data/logic concern into a separate module                                                      |
| Adding a new test breaks existing passing tests                  | OCP — too tightly coupled                                      | Extend via composition (modifier HOFs); don't modify the original                                                 |
| Can't swap a fixture component for an equivalent                 | LSP — replacement adds hidden requirements                     | Make all extra props optional; align contracts                                                                    |
| Interface forces test to wire up props the unit never reads      | ISP — interface too wide                                       | Narrow the interface to what the component actually uses                                                          |

Fix the SOLID violation first — see `.claude/skills/solid-principles/SKILL.md`.

---

## Test Runner Configuration

_(Actual file path and tool names from skill-config.md → Test Conventions → Test runner config.)_

```
// <test-config-file>
// Transformer: <transformer-plugin> (from skill-config.md)
// tsconfig: <test-tsconfig>
// coverage: true
// files: '<test-folder>/**/*.spec.ts'
// environment: <test-environment>  (from skill-config.md)
```

**Rules derived from skill-config.md:**

- Use only the transformer specified in skill-config.md → Test Conventions. Do not substitute a different transformer.
- TypeScript is transpiled with the tsconfig specified in skill-config.md. Keep it in sync with the main tsconfig for options that affect test correctness.
- Coverage is collected over the source folder specified in skill-config.md.
- To run a single spec file, pass it directly to the test runner CLI (consult the runner's docs for the exact flag).

---

## Testing Patterns

### 1. Pure TypeScript functions (utilities, pure transforms)

```ts
// ❌ WRONG — testing implementation detail
it('should call internalHelper', () => {
    // accessing non-exported internals — tests the HOW, not the WHAT
});

// ✅ CORRECT — test the function directly
import { expect } from '<assertion-library>';  // skill-config.md
import { <functionName> } from '<source-folder>/<module>';

describe('<functionName>', () => {
    it('should <expected behavior>', () => {
        const result = <functionName>(<input>);
        expect(result).to.equal(<expected>);
    });

    it('should <other behavior> when <condition>', () => {
        const result = <functionName>(<other-input>);
        expect(result).to.equal(<other-expected>);
    });
});
```

### 2. Component rendering — DOM assertions via the test environment

Use the bootstrap helper from skill-config.md to mount any component into the test environment. The helper (see skill-config.md → Test Conventions → Bootstrap helper) calls the app init function and resolves with the mounted root element.

```ts
// ✅ Mount and assert on real DOM output
import { expect } from '<assertion-library>';
import { <BootstrapHelper> } from '<test-support>/run-setup';
import { <FixtureComponent> } from '<test-support>/components/<fixture>';

describe('<ComponentName>', () => {
    let $root: HTMLElement;
    let $target: HTMLElement | null;

    before(async () => {
        $root = await <BootstrapHelper>({
            containerProps: {
                componentProps: { /* props */ },
                TestComponent: <FixtureComponent>
            }
        });
        $target = $root.querySelector('<selector>');
    });

    it('should render a <element> element', () => {
        expect($target).to.be.instanceof(HTML<ElementType>Element);
    });

    it('should set <attribute> from props', () => {
        expect($target?.<attribute>).to.equal('<expected>');
    });
});
```

Support / fixture components go in the support components folder (skill-config.md → Test Conventions → Support components). Do not inline complex component definitions inside spec files.

### 3. State / reactive logic testing

Test state changes by invoking the state update mechanism and asserting on the resulting value or DOM output. Consult skill-config.md → Component Model for the reactive primitive pattern in use and whether state assertions are synchronous or require awaiting.

_(Follow the pattern established in existing spec files — see skill-config.md → Test Conventions → Spec location.)_

```ts
// ✅ Test state by asserting on output after update
// Replace <StateUnit> with the reactive primitive from
// skill-config.md → Component Model

describe('<StateUnit>', () => {
    it('should return the initial value', () => {
        const state = new <StateUnit>('<initial>');
        expect(state.get()).to.equal('<initial>');
    });

    it('should return the updated value after set()', () => {
        const state = new <StateUnit>('<initial>');
        state.set('<updated>');
        expect(state.get()).to.equal('<updated>');
    });

    it('should not mutate the original value when updated', () => {
        const state = new <StateUnit>('<initial>');
        const original = state.get();
        state.set('<updated>');
        expect(original).to.equal('<initial>');
        expect(state.get()).to.equal('<updated>');
    });
});
```

### 4. API handlers — mock the injected service interface

_(See skill-config.md → Notes → External data boundaries for the prescribed injection pattern.)_

The DIP-compliant handler accepts a service interface as a defaulted parameter. Pass a spy/stub; never touch the real external service.

```ts
// ❌ WRONG — mocking the SDK internally
import { ExternalServiceClient } from '<external-sdk>';
<mockLib>.stub(ExternalServiceClient.prototype, 'send'); // ❌ couples test to SDK internals

// ✅ CORRECT — inject a fake store, no real service connection
import { expect } from '<assertion-library>';
import <mockLib> from '<spy-stub-library>';  // skill-config.md
import type { <ServiceInterface> } from '<service-interface-folder>/<service-name>';
import <handlerFunction> from '<api-handler-file>';

describe('<handlerFunction>', () => {
    let store: <ServiceInterface>;
    let fakeWrite: ReturnType<typeof <mockLib>.fake>;

    beforeEach(() => {
        fakeWrite = <mockLib>.fake.resolves(undefined);
        store = { write: fakeWrite, read: <mockLib>.fake.resolves('') };
    });

    it('should call store.write with the parsed body', async () => {
        const req = { body: JSON.stringify({ event: 'click' }) } as any;
        const res = { status: <mockLib>.stub().returnsThis(), json: <mockLib>.stub() } as any;

        await <handlerFunction>(req, res, store);

        expect(fakeWrite.calledOnce).to.be.true;
    });

    it('should return 500 when store.write throws', async () => {
        store.write = <mockLib>.fake.rejects(new Error('service unavailable'));
        const req = { body: JSON.stringify({ event: 'click' }) } as any;
        const res = { status: <mockLib>.stub().returnsThis(), json: <mockLib>.stub() } as any;

        await <handlerFunction>(req, res, store);

        expect(res.status.calledWith(500)).to.be.true;
    });
});
```

### 5. Service interface implementations — use in-memory fakes

Test the concrete implementation class in isolation using an in-memory fake that implements the same interface — never use a real external service connection.

```ts
// ✅ In-memory fake implements the interface
import { expect } from '<assertion-library>';
import type { <ServiceInterface>, <DataEntry> } from '<service-interface-folder>/<service-name>';

class InMemory<ServiceName> implements <ServiceInterface> {
    private readonly store = new Map<string, string>();
    async append(key: string, entry: <DataEntry>): Promise<void> {
        const existing = this.store.get(key) ?? '';
        this.store.set(key, existing ? `${existing}\n${JSON.stringify(entry)}` : JSON.stringify(entry));
    }
    async read(key: string): Promise<string> { return this.store.get(key) ?? ''; }
}

describe('InMemory<ServiceName>', () => {
    it('returns empty string for unknown key', async () => {
        const store = new InMemory<ServiceName>();
        expect(await store.read('missing')).to.equal('');
    });

    it('appends entries as newline-delimited JSON', async () => {
        const store = new InMemory<ServiceName>();
        await store.append('key-1', { timestamp: '2026-01-01', data: { e: 1 } });
        await store.append('key-1', { timestamp: '2026-01-01', data: { e: 2 } });
        const lines = (await store.read('key-1')).split('\n');
        expect(lines).to.have.length(2);
    });
});
```

### 6. Router / navigation — use support fixture components

Use the existing router support component and bootstrap helper (see skill-config.md → Test Conventions) to test navigation behavior through real DOM interaction.

```ts
// ✅ Test routing via real DOM — follow the test support pattern already in the project
import { expect } from '<assertion-library>';
import { <RouterFixture> } from '<test-support>/components/router';
import { <BootstrapHelper> } from '<test-support>/run-setup';

describe('router', () => {
    it('should render the default route on load', async () => {
        const $root = await <BootstrapHelper>({
            containerProps: {
                componentProps: { value: { defaultRoute: '/', defaultText: 'Home' /* ... */ } },
                TestComponent: <RouterFixture>
            }
        });
        expect($root.querySelector('div')?.textContent?.trim()).to.equal('Home');
    });
});
```

---

## What NOT to Test

- **Implementation details** — internal variables, private methods, intermediate state.
- **Third-party library internals** — SDK query builders, framework routing mechanics.
- **CSS class strings** — never assert that the class utility produced a specific string; assert on rendered DOM behavior instead.
- **TypeScript types** — they do not exist at runtime. Type correctness is validated by the type-check command.
- **Framework-internal behavior** — if the framework is the product (as in this repo), test via the public API surface, not internal helpers.

---

## Test Naming Convention

_(Verify against existing test files in the project. Use the project's established convention if one exists.)_

```
describe('<module name>')
  it('should <do something> when <condition>')   // preferred
  it('<verb> <condition>')                        // acceptable short form
```

---

## Coverage

Coverage is configured in the test runner config (skill-config.md → Test Conventions → Test runner config).
Coverage enforces a floor, not a target — 100% does not mean correct behavior.
Never write tests solely to hit a number; write tests to specify behavior.

---

## Gotchas

**Test environment is not always jsdom** (see skill-config.md → Test Conventions → Test environment). Verify which globals and APIs are available — they depend on the configured environment.

**Async DOM assertions.** The app init / mounted lifecycle is asynchronous. Always `await` the bootstrap helper inside `before` or `beforeEach`; then run synchronous DOM assertions in `it` blocks.

**`before` vs `beforeEach`.** Use `before` (runs once per `describe`) when the DOM setup is expensive and tests only read the DOM. Use `beforeEach` when tests mutate state that affects later tests.

**Spy cleanup.** If using stubs or spies (from skill-config.md → Test Conventions → Spy/stub library), restore them in `afterEach`:

```ts
afterEach(() => <mockLib>.restore());
```

**Do not put spy factory calls inside `it`.** Create spies in `beforeEach` so each test starts with a fresh call count.

**Reactive side-effects across tests.** Reactive state created at module level persists across tests in the same `describe`. Call the reset method (if available) in `afterEach` when testing update behavior.

**Module mocking.** Check skill-config.md → Test Conventions → Mock/spy API to confirm whether a module-level mocking system (e.g. jest.mock, vi.mock) is available. If not, achieve isolation by:

1. Designing to the DIP (inject dependencies as function parameters).
2. Passing spy/fake functions directly into the unit under test.
3. Creating minimal in-memory implementations of service interfaces.

---

## Self-Check Checklist

Claude must complete this before finishing any task that involves writing or modifying test files:

- [ ] Did I write the test **before** the implementation?
- [ ] Is there exactly **one failing test** at a time?
- [ ] Does the Green phase contain only the **minimum code** needed to pass?
- [ ] Did I refactor both the code **and** the test after going green?
- [ ] Are all external dependencies (databases, APIs, SDKs) mocked at the **interface boundary**, not the SDK?
- [ ] Does the test name describe **behavior**, not implementation?
- [ ] Have I added the **next test case** to the `@TODO` list at the top of the spec file?
- [ ] Did I place reusable fixture components in the support components folder (skill-config.md) rather than inline in the spec?
