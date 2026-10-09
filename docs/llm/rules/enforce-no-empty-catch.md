# enforce-no-empty-catch

## Rule id

`steps-pattern/enforce-no-empty-catch`

## Intent (from ESLint rule)

A catch body must not be empty; swallows hide failures.

## When this rule applies

CatchClause in steps/, strategies/, proxies/.

## What triggers

Catch body empty, comments-only, or only EmptyStatements.

## What this rule does not enforce

Any real statement (including LoggerProxy.warn for intentional swallow).

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
catch (err) { Errr.newError("Match failed").appendTo(err).throw(); }
```

## Do not

```js
catch (err) {}
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-empty-catch/`
