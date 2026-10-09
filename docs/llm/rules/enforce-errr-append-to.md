# enforce-errr-append-to

## Rule id

`steps-pattern/enforce-errr-append-to`

## Intent (from ESLint rule)

When a catch binds err and uses Errr.newError, require .appendTo(err).

## When this rule applies

CatchClause with a binding in steps/strategies/proxies/repositories/services/routes.

## What triggers

Body has Errr.newError but no .appendTo(<binding>).

## What this rule does not enforce

Log-only catch with no Errr; catch without a binding.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
Errr.newError("Save failed").appendTo(err).throw();
```

## Do not

```js
Errr.newError("Save failed").throw();
```

## Related docs

- `docs/llm/lint-fixes/enforce-errr-append-to/`
