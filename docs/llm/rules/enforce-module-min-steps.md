# enforce-module-min-steps

## Rule id

`steps-pattern/enforce-module-min-steps`

## Intent (from ESLint rule)

A Module method should accept **more than one** Step. A single `state.accept` is usually a ceremony wrapper. This rule **warns** so extracting a Module to satisfy `enforce-no-step-loop-internal-function` does not hide a one-step method.

## When this rule applies

Enabled on Module globs via `stepsLayers()`. Severity is **warn**. Counts `state.accept` (1) and `state.acceptAll([A, B])` (N) in the method try body.

## Correct fix (checklist)

1. If the method is a real sequence, add the sibling Steps to the flat accept chain.
2. If there is only one concern, do not use a Module — keep the work in the Step (or inline into `next`).
3. Do not `eslint-disable` the warning to hide a ceremony extract.

## What good looks like

**Don't** — one accept:

```js
static async triggerPartnerSync(state) {
  try {
    await state.accept(TriggerAccountSync);
  } catch (err) {
    Errr.newError("PartnerModule.triggerPartnerSync failed").appendTo(err).throw();
  }
}
```

**Do** — two or more:

```js
static async jitTriggerPartnerSync(state) {
  try {
    await state.accept(TriggerJitPartnerSync);
    await state.accept(CallTriggerPartnerSyncIfNeeded);
  } catch (err) {
    Errr.newError("PartnerModule.jitTriggerPartnerSync failed").appendTo(err).throw();
  }
}
```

Recipes: [`lint-fixes/enforce-module-min-steps/`](../lint-fixes/enforce-module-min-steps/).

## Do not

- Do not treat this warning as a hard fail. Existing one-step methods (e.g. `UserModule.fetchPartnerUser`) are the census, not an emergency.
- Do not split a cohesive Step into two no-op Steps just to clear the warning.

## Related docs

`.cursor/rules/steps-pattern/backend-modules.mdc`. Pair with `enforce-no-step-loop-internal-function`.
