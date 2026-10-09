# enforce-maddox-loader-action-separation

## Rule id

`steps-pattern/enforce-maddox-loader-action-separation`

## Intent (from ESLint rule)

Keep Remix loader specs and action specs isolated.

- **Loader** describes may only load data and assert the first paint. No `userEvent` / `fireEvent`.
- **Action** describes must not run the real loader (Remix mounts / remounts the route) and must actually fire the action (`userEvent` / `fireEvent` or `.triggerAction(...)`).

The loader-mock signal is scanned on the **enclosing action `describe`**, not only the `it` body. Generate assigns `stubModule.loader` inside `setupInputParams`; a `setupLoaderMock*` helper is still valid.

## When this rule applies

Enabled on Remix route specs via `maddoxSpecs({ remix: true })` (`*.spec.jsx`).

## Correct fix (checklist)

1. In an action suite, copy the route module and replace `loader` in `setupInputParams` (or a `setupLoaderMock*` helper).
2. Drive the POST with `.triggerAction(descriptor, params)` (generated / API) or a UI event (HITL remainder).
3. Do not click or type inside a `calling the loader` describe — move that `it` to an action describe.

## Don't

```javascript
context.setupInputParams = () => {
  context.stubModule = Route; // real loader runs on mount / remount
};

it("should action on the happy path.", function () {
  context.setupInputParams();
  return new Promise(async (resolve, reject) => {
    await new RemixScenario(this)
      .triggerAction(context.triggerActionDescriptor, context.triggerActionParams)
      .test(async (err, response) => { resolve(); });
  });
});
```

## Do

```javascript
context.setupInputParams = () => {
  context.stubModule = { ...Route };
  context.stubModule.loader = async () => ({ ok: true });
  context.triggerActionDescriptor = { mockName: "FixtureRoute", path: "/widget", module: context.stubModule };
  context.triggerActionParams = { method: "POST", body: {}, encType: "application/json", url: "/widget" };
};

it("should action on the happy path.", function () {
  context.setupInputParams();
  return new Promise(async (resolve, reject) => {
    await new RemixScenario(this)
      .triggerAction(context.triggerActionDescriptor, context.triggerActionParams)
      .test(async (err, response) => { resolve(); });
  });
});
```

## Do not

- Do not treat `context.setupInputParams()` as sufficient by name — the action describe must assign `stubModule.loader`.
- Do not run the real loader from an action suite to “reuse” loader mocks.
- Do not put `userEvent` / `fireEvent` in a loader describe.

## Related docs

- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
- `.cursor/rules/steps-pattern/maddox-route-scenario-tests.mdc`
- `docs/llm/framework/maddox-before-each.md`
