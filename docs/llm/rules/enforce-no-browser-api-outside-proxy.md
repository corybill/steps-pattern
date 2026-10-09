# enforce-no-browser-api-outside-proxy

## Rule id

`steps-pattern/enforce-no-browser-api-outside-proxy`

## Intent (from ESLint rule)

Browser APIs must go through a Proxy.

## When this rule applies

steps/, strategies/, modules/, services/, controllers/.

## What triggers

chrome.storage|tabs|scripting|runtime or browser.* MemberExpression.

## What this rule does not enforce

proxies/, background, content/ host files.

## Correct fix (checklist)

1. Prefer the Do shape below.
2. Do not use `eslint-disable`.

## What good looks like

```js
await ChromeStorageProxy.get(["authToken"]);
```

## Do not

```js
await chrome.storage.local.get(["authToken"]);
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-browser-api-outside-proxy/`
