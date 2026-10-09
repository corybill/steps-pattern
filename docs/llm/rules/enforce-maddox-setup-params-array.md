# enforce-maddox-setup-params-array

## Rule id

`steps-pattern/enforce-maddox-setup-params-array`

## Intent (from ESLint rule)

Enforce that all 'Params' in Maddox setup functions are Arrays.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-maddox-setup-params-array` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Infer the **architectural** intent (orchestration vs business logic, test contract, layer access, etc.).
3. Refactor code or tests to satisfy the rule without weakening guarantees.

## What good looks like

Mock-call `context.*Params` are arrays so `.shouldBeCalledWith` does not wrap in the Scenario chain:

```javascript
context.widgetRepoGetByIdParams = [context.widgetId];
```

Remix trigger options are compiler-reserved objects (`triggerLoaderParams` / `triggerActionParams`), not mock-call args:

```javascript
context.triggerLoaderParams = { url: "/registration" };
.triggerLoader(context.triggerLoaderDescriptor, context.triggerLoaderParams)
```

Dynamic mock names that collide with reserved keys (`inputParams`, `triggerLoaderParams`, …) become `stem_2Params` via `disambiguateContextKey`.

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.
- Do not assign mock-call `*Params` as objects. Do not reuse reserved Remix trigger keys as outbound param names.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
