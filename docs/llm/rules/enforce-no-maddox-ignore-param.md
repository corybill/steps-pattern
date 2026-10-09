# enforce-no-maddox-ignore-param

## Rule id

`steps-pattern/enforce-no-maddox-ignore-param`

## Intent (from ESLint rule)

Forbid `IgnoreParam` / `IgnoreParams` (including `Maddox.constants.IgnoreParam`) in Maddox scenario tests. Every mocked call must assert the **actual** arguments via `.shouldBeCalledWith` and a full `context.*Params` array.

## When this rule applies

Enabled on spec globs in `maddoxSpecs()` (`spec/**/*.spec.js` / `.jsx` / `.ts` unless a package turns the suite off).

## Correct fix (checklist)

1. Remove any `IgnoreParam`, `IgnoreParams`, or `Maddox.constants.IgnoreParam` usage.
2. Put the real argument list on `context.<name>Params` as an **array** inside the matching middle setup helper.
3. Use `.shouldBeCalledWith("Name", "method", context.<name>Params)`.
4. If a `State` object or other large value is constructed inside the entry point and feels “unlistable,” assert the fields the collaborator actually receives — or split the Step so the outbound args are a small explicit payload.

## What good looks like

```javascript
context.setupMyRepoGet = () => {
  context.myRepoGetParams = [context.userId];
  context.myRepoGetResponse = context.userRow;
  context.myRepoGetError = new Error(`MyRepo.get: ${context.userId}`);
};

// in the Scenario chain:
.shouldBeCalledWith("MyRepo", "get", context.myRepoGetParams)
```

## Do not

- Do not `eslint-disable` this rule to leave holes in the contract.
- Do not replace `IgnoreParam` with `shouldBeCalledWithSubset` (`enforce-no-maddox-should-be-called-with-subset`).
- Do not use `.shouldBeCalled("Name", "method")` with no argument assertion as a workaround.

## Related docs

- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
- `.cursor/rules/steps-pattern/maddox-scenario-tests.mdc`
- `docs/llm/framework/maddox-scenarios.md`
