# enforce-logger-static-message

## Rule id

`steps-pattern/enforce-logger-static-message`

## Intent (from ESLint rule)

LoggerProxy first argument must be a static string; runtime values go in the attributes object.

## When this rule applies

Any call to LoggerProxy.debug/info/warn/error outside logger-proxy.js.

## What triggers

First argument is not a string Literal (template, identifier, call, etc.).

## What this rule does not enforce

LoggerProxy internals; non-LoggerProxy loggers.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
LoggerProxy.error("Loader failed", { accountId, err });
```

## Do not

```js
LoggerProxy.error(`Loader failed for ${accountId}: ${err}`);
```

## Related docs

- `docs/llm/lint-fixes/enforce-logger-static-message/`
