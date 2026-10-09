# enforce-no-route-auth-check

## Rule id

`steps-pattern/enforce-no-route-auth-check`

## Intent (from ESLint rule)

Remix `loader` / `action` must not gate on auth (`getAuth` / `userId` → 401 Unauthorized). `rootAuthMiddleware` already runs `RequireAuthenticated`.

## When this rule applies

Route files (`app/routes/**`, `**/routes/**`) on exported `loader` / `action`.

## What triggers

An `if` whose test mentions `getAuth` / `auth` / `userId` and whose consequent returns or throws a 401 / `"Unauthorized"` response.

## What this rule does not enforce

- `getAuth()` used only in `Errr.debug({ userId })` or response shaping
- Service / Step 401 short-circuits

## Correct fix (checklist)

1. Delete the auth branch from the route.
2. Rely on `rootAuthMiddleware` / `RequireAuthenticated`.
3. Trust `state.getAuth().userId` when present for debug / payload only.

## What good looks like

```js
export async function action(args) {
  try {
    const state = new WidgetState(args);
    await WidgetService.run(state);
    return Response.json(state.getResponse());
  } catch (err) {
    const errr = Errr.newError("Action failed").appendTo(err).get();
    LoggerProxy.error("Action failed", {}, errr);
    throw errr;
  }
}
```

## Do not

```js
export async function action(args) {
  const state = new WidgetState(args);
  const auth = state.getAuth();
  if (!auth?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // …
}
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-route-auth-check/`
