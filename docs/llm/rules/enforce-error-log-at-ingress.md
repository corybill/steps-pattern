# enforce-error-log-at-ingress

## Rule id

`steps-pattern/enforce-error-log-at-ingress`

## Intent (from ESLint rule)

LoggerProxy.error and console.error belong only on the route/controller (ingress) catch.

## When this rule applies

Files under steps/, strategies/, modules/, services/, proxies/, repositories/, state/.

## What triggers

CallExpression LoggerProxy.error or console.error.

## What this rule does not enforce

routes/, controllers/, lambda.js, entry.server.jsx, logger-proxy.js. LoggerProxy.warn is allowed.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
Errr.newError("CallSync failed").appendTo(err).throw();
```

## Do not

```js
LoggerProxy.error("sync failed", {}, err);
```

## Related docs

- `docs/llm/lint-fixes/enforce-error-log-at-ingress/`
