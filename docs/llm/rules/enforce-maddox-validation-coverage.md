# enforce-maddox-validation-coverage

## Rule id

`steps-pattern/enforce-maddox-validation-coverage`

## Intent (from ESLint rule)

Every Module and Controller Maddox Scenario suite must include **at least one** test that exercises ingress validation failure (`Validation Error`).

## When this rule applies

Production Module files under `**/modules/**` and Controller files under `**/controllers/**` that:

1. Export at least one static async method with ingress params (so `enforce-ingress-contract-validation` applies), and
2. Have a sibling Maddox Scenario suite (primary `.spec.js` and/or split siblings such as `.ai-driven.spec.js`).

## What triggers

Combined sibling spec text has no `Validation Error` assertion (typically `Maddox.compare.containsError(err, "Validation Error")`).

## What this rule does not enforce

- Creating a Maddox suite when none exists (`enforce-maddox-module-coverage` / `enforce-maddox-controller-coverage`)
- Zero-arg-only Controllers/Modules (no ingress to validate)
- How many methods have validation its — one suite-level Validation Error it is enough

## Correct fix (checklist)

1. Add an `it` that passes an invalid ingress (empty `{}`, `null` State bag, wrong type, missing required field).
2. Assert `Maddox.compare.containsError(err, "Validation Error")` (plus the wrap message when useful).
3. Prefer placing the it in the AI-driven remainder when the generated suite must stay compiler-shaped — sibling specs are scanned together.

## What good looks like

```js
it("should fail validation when ingress is empty.", function () {
  context.setupInputParams = () => {
    context.inputParams = [{}];
  };
  context.setupValues();
  context.setupInputParams();

  return new Promise((resolve, reject) => {
    new Scenario(this)
      .withEntryPoint(WidgetModule, "run")
      .withInputParams(context.inputParams)

      .test((err) => {
        try {
          Maddox.compare.containsError(err, "Validation Error");
          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .catch((err) => {
        reject(err.stack);
      });
  });
});
```

## Related docs

- `docs/llm/rules/enforce-ingress-contract-validation.md`
- `.cursor/rules/maddox-scenario-tests.mdc`
- `.cursor/rules/maddox-module-scenario-tests.mdc`
