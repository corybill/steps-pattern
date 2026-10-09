# enforce-no-step-loop-internal-function

## Rule id

`steps-pattern/enforce-no-step-loop-internal-function`

## Intent (from ESLint rule)

A Step must not loop a same-file function or private method (`ThisClass._processAccount`, a local `function`, `items.map(ThisClass._foo)`). Loop `*Module.method`, or inline the work into `next`. See `.cursor/rules/steps-pattern/backend-modules.mdc`.

## When this rule applies

Configured on Step globs via `stepsLayers()`. **Currently `"off"` in the shared preset** (neither warn nor error) so product CI stays green while leftover same-file loop helpers are treated as accepted. Flip `steps-pattern/enforce-no-step-loop-internal-function` to `"error"` in `eslint-config/steps-layers.js` when running a periodic best-practice audit. Worlds still force the rule on for Step globs so `map-private-helper` stays a golden. Any `for` / `while` / `map` / `forEach` / … in a Step file whose body calls a same-file function fails when enabled. `state.accept`, `state.acceptAll`, and `*Module.method` are allowed.

## Correct fix (checklist)

1. Read the ESLint message and the reported loop.
2. Open **Fixes:** and pick **loop-accept-module** (per-item sequence), **use-domain-model-getter** (property of one domain object), **strategy-by-prefix** (prefix/algorithm ladder), or **inline-into-next** (single in-memory concern that is not a model field).
3. Do not keep the same body as `ThisClass._helper` in the same file.

## What good looks like

**Don't** — `next` maps to a same-file helper:

```js
await Promise.all(accounts.map((account) =>
  ApplyEngineValuations._processAccount({ state, account })
));
```

**Do** — loop a Module (per-item sequence):

```js
await Promise.all(accounts.map((account) =>
  EngineValuationsModule.processAccount({ account })
));
```

**Do** — read a domain-model getter when the helper was a property of one object:

```js
const recurringCount = accounts.filter((l) => AccountSettings.from(l.settings).isRecurring).length;
```

**Do** — dispatch a Strategy when the helper was a prefix/algorithm ladder:

```js
keys.every((key) => strategyForSourceKey(key)?.isStale(key, facts) ?? false);
```

**Do** — inline when the body is one in-memory concern that is not a model field:

```js
for (const row of rows) {
  ids.add(String(row.playerId));
}
```

Recipes: [`lint-fixes/enforce-no-step-loop-internal-function/`](../lint-fixes/enforce-no-step-loop-internal-function/).

## Do not

- Do not `eslint-disable` the loop.
- Do not move the loop into another same-file helper (`_processAll` that still calls `_processAccount`).
- Do not extract a one-step Module just to silence this rule — `enforce-module-min-steps` will warn.

## Related docs

`.cursor/rules/steps-pattern/backend-steps.mdc`, `backend-modules.mdc`. Sibling: `enforce-step-iterator-simplicity` (proxy / 2+ awaits in the loop body).
