# enforce-outbound-class-method-call

## Rule id

`steps-pattern/enforce-outbound-class-method-call`

## Intent (from ESLint rule)

Outbound collaborators must be Class.method so Maddox can mockThisFunction.

## When this rule applies

steps/, strategies/, modules/.

## What triggers

CallExpression whose callee is an Identifier imported from proxies/repositories/entities/modules.

## What this rule does not enforce

Class.method MemberExpression calls.

## Correct fix (checklist)

1. If the callee **leaves the process** (or is `DateProxy`), use the Do shape below (`class-method-call`).
2. If the callee is in-process policy (Errr flag, cap, delay math), keep it on the Step (`in-process-in-step`).
3. Do not use `eslint-disable`.

## What good looks like

```js
await ClientEventsProxy.reportClientEvent(...);
```

```js
if (err.get("isSearchWriteThrottled")) { /* delay math stays on the Step */ }
```

## Do not

```js
await reportClientEvent(...);
```

**Never** silence this lint by wrapping in-process policy as `Proxy.method` (`hoist-in-process-onto-proxy`):

```js
SearchProxy.isSearchWriteThrottled(err);
ModelProxy.computeDelayedRequeueSeconds(args);
```

## Related docs

- `docs/llm/lint-fixes/enforce-outbound-class-method-call/`
