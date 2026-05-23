---
name: solid-principles
version: 1.0.0
description: Enforce all five SOLID principles on every piece of new and refactored code in this project.
triggers: Any time Claude writes a new component, refactors existing code, designs a service abstraction, or reviews a pull request in this repo.
config: .claude/skills/skill-config.md
---

## ⚠️ Read Config First

Before applying any rule in this skill, read `.claude/skills/skill-config.md`.
All folder paths, tooling references, framework conventions, and code examples must use the values defined there. Never assume conventions from a previous project.

---

## Project Conventions

See `.claude/skills/skill-config.md` for the full list of:

- Stack versions and tool names
- Folder conventions (components, services, utilities, etc.)
- Component unit definition and reactive primitives
- Class utility in use (no new utilities may be introduced)
- External data boundaries and DIP interface locations

---

## S — Single Responsibility Principle

**Rule:** Every component, service function, and module has exactly one reason to change.

### What this means in your project

_(Read skill-config.md → Component Model for layer names, responsibilities, and the component pattern in use.)_

- Each layer defined in skill-config.md → Component Model has exactly one responsibility — do not mix concerns across layers.
- A page or app-layer component composes — it does not call external services directly.
- A service function performs one operation — validation, data access, and response formatting are separate responsibilities.
- A utility module isolates one domain concern — do not mix unrelated helpers in the same file.

```ts
// ❌ WRONG — fetches, transforms, and renders in one unit
function UserCard(userId: string) {
    const user = fetchUser(userId); // data concern
    const label = user.isActive ? 'Active' : 'Inactive'; // transform concern
    // render concern
}

// ✅ CORRECT — one concern per unit
// data concern
async function fetchUser(id: string): Promise<User> {
    /_ ... _/;
}

// transform concern
function formatUserStatus(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
}

// render concern — receives already-resolved data
function UserCard(user: User) {
    /_ render only _/;
}
```

### Red flags — SRP violations

- A component file is longer than ~150 lines with multiple concerns (god component).
- A component imports from an external service SDK directly (see skill-config.md → Notes → External data boundaries).
- A function is named `handleXAndY` (two verbs = two responsibilities).
- An API handler validates input, reads external data, transforms the result, _and_ formats the response — each is a separate responsibility.
- A single utility file contains two unrelated domain helpers.

---

## O — Open/Closed Principle

**Rule:** Components and utilities are open for extension through composition, not modification.

### What this means in your project

_(Read skill-config.md → Folder Conventions for the modifiers/HOF extension pattern.)_

- Extension happens through composition (HOFs, wrappers, or slots — see skill-config.md → Component Model) without touching the source of the unit being extended.
- New behavior is added by creating new files or wrapping existing units — not by editing them.
- Extending reactive or event-driven behavior happens at the consumer level, not by modifying the source module.
- Adding a new route to the router means adding an entry to the route config — existing route branches are not rewritten.

```ts
// ❌ WRONG — reopen file to extend
interface ButtonProps {
    isDanger?: boolean;
    isPrimary?: boolean;
    isNewVariant?: boolean;
}
function Button({ isDanger, isPrimary, isNewVariant }: ButtonProps) {
    // isNewVariant forces this file open every time a new variant is needed
}

// ✅ CORRECT — new file, original untouched
interface WithNewVariantProps {
    isNewVariant?: boolean;
}

function withNewVariant<T extends { className?: string }>(
    props: T & WithNewVariantProps
): Omit<T & WithNewVariantProps, 'isNewVariant'> {
    const { isNewVariant, className, ...rest } = props;
    return {
        ...rest,
        className: applyClass(className, { 'is-new-variant': isNewVariant })
    };
}
// Wrap any component at the call site — the original Button is never touched
```

### Red flags — OCP violations

- Editing a component's template to add a flag for every caller's new requirement.
- A `switch` or `if-else` chain on a `type` or `variant` prop that grows with every new feature.
- Modifying a core dispatch table or switch block when adding a new type — prefer extending the map over editing the switch.

---

## L — Liskov Substitution Principle

**Rule:** Any component or interface implementation can be swapped for another with the same prop contract without callers breaking.

### What this means in your project

_(Read skill-config.md → Notes → Component model for the component type hierarchy.)_

- A polymorphic component that accepts a render-as or slot prop (see skill-config.md → Component Model for the pattern in use)
- When a test uses a fixture component in place of a production component, both must satisfy the same props contract — the fixture must not depend on props not declared in the shared interface.

```ts
// ❌ WRONG — replacement secretly requires ariaLabel (required, not optional)
interface SpanProps {
    children: unknown;
}
function Span({ children }: SpanProps) {
    /* renders span */
}

interface SpanWithLabelProps {
    ariaLabel: string;
    children: unknown;
} // required — breaks substitution
function SpanWithRequiredLabel({ ariaLabel, children }: SpanWithLabelProps) {
    /* renders span */
}
// Swapping Span → SpanWithRequiredLabel silently breaks callers that never passed ariaLabel

// ✅ CORRECT — extras are optional, base contract is honored
interface SpanWithOptionalLabelProps {
    ariaLabel?: string;
    children: unknown;
}
function SpanWithOptionalLabel({
    ariaLabel,
    children
}: SpanWithOptionalLabelProps) {
    /* renders span */
}
// Safe to swap for Span — callers that omit ariaLabel still get valid output
```

### Red flags — LSP violations

- A polymorphic slot replacement requires new required props that the generic caller doesn't provide.
- `instanceof` checks in shared logic to branch on a specific component type.
- A component that throws when it receives optional props from the base contract.
- Test fixture components that secretly depend on props not declared in the shared interface.

---

## I — Interface Segregation Principle

**Rule:** Prop interfaces contain only what the component under definition consumes; no consumer is forced to pass props it ignores.

### What this means in your project

_(Read skill-config.md → Folder Conventions for where types live.)_

- Extend the base component props type only with props the specific element actually uses.
- Cross-cutting concerns (icons, tooltips, etc.) are composed in via the extension pattern defined in skill-config.md → Component Model — not inherited wholesale into every element that happens to support them.
- API handler helper functions should receive only the specific data they read — not the full request object.

```ts
// ❌ WRONG — forcing a wide interface onto a narrow consumer
// <component-folder>/status.ts
interface StatusProps extends WithIconProps, WithTooltipProps {
    // ❌ tooltip never used here
    isSuccess?: boolean;
    isDanger?: boolean;
}
// Callers must now satisfy tooltip props even though Status has no tooltip.

// ✅ CORRECT — extend only the interfaces the component actually uses
// <component-folder>/status.ts
import type { BaseComponentProps } from '<framework-package>';
import type { WithIconProps } from '<modifiers-folder>/with-icon';

export interface StatusProps extends BaseComponentProps, WithIconProps {
    isSuccess?: boolean;
    isDanger?: boolean;
    // WithTooltipProps NOT included — not exercised by this component
}
```

### Red flags — ISP violations

- An interface with 8+ props where any single consumer uses fewer than half.
- A component that spreads `...props` into a child but the interface has fields the child ignores, silently passing noise downstream.
- A service helper function whose parameter interface includes fields only some callers populate.
- An index signature (`[key: string]: unknown`) that forces unknown key acceptance on all consumers when explicit props would suffice.

---

## D — Dependency Inversion Principle

**Rule:** Business logic depends on abstractions (interfaces), not on concrete external service clients.

### What this means in your project

_(Read skill-config.md → Notes → External data boundaries for the prescribed interface locations.)_

External services are identified in skill-config.md (Stack section). Concrete service client construction must not happen inside components, pages, or API handler bodies.

#### Repository / service abstraction pattern

**Step 1 — Define the interface** in the service utilities folder (see skill-config.md → Folder Conventions):

```ts
// <service-interface-folder>/<service-name>.ts  — abstraction
export interface DataEntry {
    timestamp: string;
    data: unknown;
}

export interface DataStore {
    append(key: string, entry: DataEntry): Promise<void>;
    read(key: string): Promise<string>;
}
```

**Step 2 — Implement against the interface** (imports the SDK here, nowhere else):

```ts
// <service-interface-folder>/<concrete-service-name>.ts  — concrete
import type { DataStore, DataEntry } from './<service-name>';
import { ExternalServiceClient } from '<external-service-sdk>';

export class ConcreteDataStore implements DataStore {
    constructor(private readonly client: ExternalServiceClient /* config */) {}

    async append(key: string, entry: DataEntry): Promise<void> {
        // ... uses this.client
    }

    async read(key: string): Promise<string> {
        // ... uses this.client
    }
}
```

**Step 3 — API handler receives the abstraction** (never imports the SDK directly):

```ts
// <api-handler-file>  — HTTP boundary only; delegates to injected store
import type { DataStore } from '<service-interface-folder>/<service-name>';
import { ConcreteDataStore } from '<service-interface-folder>/<concrete-service-name>';

function buildStore(): DataStore {
    return new ConcreteDataStore(/* build from env */);
}

export default async function POST(
    req: <RequestType>,
    res: <ResponseType>,
    store: DataStore = buildStore()  // injectable for testing
): Promise<void> {
    // ...orchestrate using store, never touching the SDK
}
```

### Red flags — DIP violations

- Direct external SDK import inside a component, page, or app-layer file — it should only appear in the concrete implementation file.
- An API handler that constructs its own service client inline rather than receiving an interface.
- A test that must connect to a real external service to run.
- Hard-coded service URLs inside business logic rather than configuration.

---

## Component variant rules

```ts
// ✅ Use the class utility from skill-config.md → Stack → Class utility
// Apply it using the component pattern from skill-config.md → Component Model

interface TagProps {
    className?: string;
    isDanger?: boolean;
    isInfo?: boolean;
    isSuccess?: boolean;
}

function Tag({ className, isDanger, isInfo, isSuccess }: TagProps) {
    const classes = applyClass('tag', className, {
        'is-danger': isDanger,
        'is-info': isInfo,
        'is-success': isSuccess
    });
    // render using pattern from skill-config.md → Component Model
}
// Never mix variant/class logic with data-fetching or event-handling in the same function
```

---

## TypeScript rules

- `strict: true` — enforced by the shared tsconfig (see skill-config.md → Folder Conventions). Never relax it per-file.
- No `any` — use `unknown` with type guards or proper generics.
- Use `Readonly<T>` for config objects and pure-data props that must not be mutated.
- Use `satisfies` to validate config objects against their type without widening.
- No `as unknown as T` casts — these hide substitutability failures.

```ts
// ❌ WRONG — loses the type contract
const routeConfig = {
    '/': HomeComponent,
    '/about': AboutComponent
} as unknown as Record<string, <ComponentType>>;

// ✅ CORRECT — satisfies preserves narrowing, no silent cast
const routeConfig = {
    '/': HomeComponent,
    '/about': AboutComponent
} satisfies Record<string, <ComponentType>>;
```

---

## Enforcement checklist

Claude must run this on every code write or refactor:

- [ ] **SRP** — Does this unit have exactly one reason to change?
- [ ] **OCP** — Can new behavior be added without editing this file?
- [ ] **LSP** — Are all implementations of this component/interface contract truly substitutable?
- [ ] **ISP** — Does every consumer use all props/fields in this interface?
- [ ] **DIP** — Does every business-logic unit depend on abstractions, not on external service SDKs directly?

---

## Code smell detection table

| Smell                                                                        | SOLID Violation | Corrective Action                                                            |
| ---------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| Component > ~150 lines with multiple concerns                                | SRP             | Split: render-only component + separate data/logic modules                   |
| Long `if-else`/`switch` on a `type` or `variant` prop that grows per feature | OCP             | Convert to a map of components; extend by adding map entries                 |
| `instanceof` check on a component type in shared logic                       | LSP             | Use duck-typing against the return type contract instead                     |
| Component with 8+ props                                                      | ISP             | Split into focused sub-interfaces; use modifier HOFs for cross-cutting props |
| Direct external SDK import inside a component or app-layer file              | DIP             | Move SDK usage behind a service interface (see skill-config.md → Notes)      |
| Function named `handleXAndY` (two verbs)                                     | SRP             | Extract two separate functions, one per verb                                 |
| Interface fields unused by the declaring component                           | ISP             | Remove or split the interface                                                |
| Test that requires a real external service connection                        | DIP             | Mock at the service interface boundary; never mock the SDK directly          |

---

## Refactoring protocol

1. **Identify** — state which principle(s) are violated and point to the exact file + line.
2. **Propose** — describe the target structure (new files, new interfaces) before writing any code.
3. **Confirm** — flag to the user if the refactor changes a public export.
4. **Execute** — the smallest structural change that resolves the violation.
5. **Verify** — re-run the 5-point enforcement checklist on the refactored output.

---

When a test is hard to write, this almost always signals a SOLID violation —
see `.claude/skills/tdd-workflow/SKILL.md` for the diagnostic connection.
