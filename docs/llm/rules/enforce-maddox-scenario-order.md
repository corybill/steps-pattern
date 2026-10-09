# enforce-maddox-scenario-order

## Rule id

`steps-pattern/enforce-maddox-scenario-order`

## Intent (from ESLint rule)

Enforce the order and spacing of Maddox scenario declarations.

**Chain group order:** `mockThisFunction` / `withMocks` → entry (`withEntryPoint`, `withInputParams`, `addStub`, `withInitialEntries`, `withStubAppContext`, `withUser`, `withParams`) → expectations (`shouldBeCalled*`, `doesReturn*`, `doesError*`) → execution (`render`, `triggerRender`, `triggerAction`, `triggerLoader`, `next`) → terminal (`test`, `catch`, `run`).

**Spacing:** blank line between groups; blank line between consecutive `shouldBeCalledWith` calls and consecutive `next` calls; blank line when transitioning from a `does*` expectation to a `should*` expectation.

**Route/controller specs only** (`spec/app/routes/`, `spec/api/routes/`, `spec/api/controllers/`, `spec/controllers/`): `.withInputParams(context.inputParams)` — no literals or other names. Build the value in `setupInputParams`.

See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-maddox-scenario-order` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Infer the **architectural** intent (orchestration vs business logic, test contract, layer access, etc.).
3. Refactor code or tests to satisfy the rule without weakening guarantees.

## What good looks like

Use small, realistic snippets from the same layer (service, module, step, spec) as the violation. The app repo’s `spec/` and `src/` trees contain canonical patterns.

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
