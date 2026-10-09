# enforce-no-maddox-should-be-called-with-subset

## Rule id

`steps-pattern/enforce-no-maddox-should-be-called-with-subset`

## Intent (from ESLint rule)

Forbid every public `subset` API in Maddox specs:

- `.shouldBeCalledWithSubset` — mock args must be the full call shape
- `Maddox.compare.subset` / `.shouldBeSubset` — do not inspect strings or objects with raw subset

Error wrap/cause checks use **`Maddox.compare.containsError(err, expectedMessage)`**. That function searches `err.stack` (falling back to `err.message`) so Errr `.debug()` telemetry cannot change the assertion. Specs never call `subset`.

## When this rule applies

Enabled on spec globs in `maddoxSpecs()` (`spec/**/*.spec.js` / `.jsx` / `.ts` unless a package turns the suite off).

## Correct fix (checklist)

1. Replace `.shouldBeCalledWithSubset("Name", "method", context.xxxParams)` with `.shouldBeCalledWith("Name", "method", context.xxxParams)`.
2. Make `context.xxxParams` a complete **array** of the arguments the production code actually passes (deep equality).
3. If the same mock is invoked twice, chain `.shouldBeCalledWith` **twice** with two param arrays.
4. Replace `Maddox.compare.subset(err.stack, …)` / `Maddox.compare.subset(err.message, …)` with `Maddox.compare.containsError(err, …)`.
5. If the argument list is too large to specify, split the Step. Do not weaken the assertion.

## What good looks like

```javascript
.shouldBeCalledWith("MyRepo", "get", context.myRepoGetParams)
.doesReturnWithPromise("MyRepo", "get", context.myRepoGetResponse)

Maddox.compare.containsError(err, "Could not fetch sale transactions");
Maddox.compare.containsError(err, context.partnerTransactionsGetByAccountIdsError.message);
```

## Do not

- Do not keep `shouldBeCalledWithSubset` or `Maddox.compare.subset` behind `eslint-disable`.
- Do not switch to `shouldBeCalled` / `IgnoreParam` to avoid listing arguments (`enforce-no-maddox-ignore-param`).
- Do not exact-equal `err.message` when the production catch attaches `.debug()`.

## Related docs

- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
- `.cursor/rules/steps-pattern/maddox-scenario-tests.mdc`
- `docs/llm/framework/maddox-scenarios.md`
