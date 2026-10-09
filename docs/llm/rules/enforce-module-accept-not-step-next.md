# enforce-module-accept-not-step-next

## Rule id

`steps-pattern/enforce-module-accept-not-step-next`

## Intent (from ESLint rule)

Modules orchestrate via state.accept / acceptAll; never Step.next(state).

## When this rule applies

Files under modules/.

## What triggers

CallExpression *.next(state).

## What this rule does not enforce

state.accept(Step) / acceptAll.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
await state.accept(AuthorizePartnerWriteWorkload);
```

## Do not

```js
await AuthorizePartnerWriteWorkload.next(state);
```

## Related docs

- `docs/llm/lint-fixes/enforce-module-accept-not-step-next/`
