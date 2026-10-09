# Maddox — module specs

## Describe structure

Module Maddox specs use **two-level** `describe`:

- **Outer** `describe` — Grouping only; **no** `beforeEach` / `afterEach` / `it` directly inside (`enforce-maddox-module-describe-structure`).
- **Inner** `describe` — Owns `beforeEach` + tests; every inner suite must have a `beforeEach` (`enforce-maddox-module-describe-structure`).

See `.cursor/rules/maddox-module-scenario-tests.mdc` in app for full narrative.

## Module coverage (static methods)

`enforce-maddox-module-coverage` requires, for each **public static** method on exported **module** classes (files under `/modules/` only — never `/services/`), a `.withEntryPoint(ModuleClass, "methodName")` appearing in the **combined** spec text for that module. A Service is never a Maddox entry point; the route or controller above it is.

Production module methods still obey `enforce-service-orchestration`: flat `try` of `accept` / `acceptAll` only. Flow-phase methods take `state`; iterated APIs may take an options object. Do not `await OtherModule.foo(state)` in the module try body.

### Spec file resolution (important)

For module base name `foo` under `spec/modules/`:

1. If **`foo.spec.js`** or **`foo.spec.ts`** exists, **only** those files are used — **split** files like `foo.getBar.spec.js` are **ignored** by the linter in that case.
2. If **neither** exists, **all** `foo.*.spec.{js,ts}` siblings are discovered, sorted, and **concatenated** for coverage and mock checks.

**Do not** mix “main” `foo.spec.js” and split siblings expecting both to apply — pick **one** strategy per module.

## Mocks vs imports

If the module imports **proxies**, **repositories**, or **other modules**, the combined spec text must show **`mockThisFunction`** for those layers with **default import** style for the third argument where the rule resolves import paths (see rule implementation and app specs).

## Do not

- Add `eslint-disable` for module coverage when a method lacks tests — add or extend a Maddox suite with the correct `.withEntryPoint`.
- Split methods across files but also keep a stub `module.spec.js` — the stub wins and **hides** split files from the rule.
