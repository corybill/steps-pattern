# enforce-no-service-from-step

## Rule id

`steps-pattern/enforce-no-service-from-step`

## Intent (from ESLint rule)

A Step must not import a Service. Services orchestrate Steps, never the reverse.

## When this rule applies

Files under steps/.

## What triggers

ImportDeclaration, require, or dynamic import() of /services/ or *-service.js.

## What this rule does not enforce

Service files importing Steps.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
await state.accept(AttachFillSseWriter);
```

## Do not

```js
const { default: GenericActionsService } = await import("../services/generic-actions-service.js");
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-service-from-step/`
