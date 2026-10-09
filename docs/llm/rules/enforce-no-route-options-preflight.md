# enforce-no-route-options-preflight

## Rule id

`steps-pattern/enforce-no-route-options-preflight`

## Intent (from ESLint rule)

Remix `loader` / `action` must not answer `OPTIONS`. `/api/*` CORS preflight is owned by `rootAuthMiddleware` → `HandleOptionsRequests`.

## When this rule applies

Route files (`app/routes/**`, `**/routes/**`) on exported `loader` / `action`.

## What triggers

An `if` whose test compares `*.method` to `"OPTIONS"` (or `'OPTIONS'`), including `===` / `==` / `!==` / `!=` and simple `||` / `&&` combinations.

## What this rule does not enforce

- `Access-Control-Allow-Methods` header strings that mention `OPTIONS`
- Middleware / Steps that intentionally handle preflight

## Correct fix (checklist)

1. Delete the OPTIONS branch from the route.
2. Rely on `rootAuthMiddleware` for `/api/*` preflight.
3. Keep response CORS headers on the real POST/GET path if needed.

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
  if (args.request.method === "OPTIONS") {
    return Response.json({}, { status: 200, headers: corsHeaders });
  }
  // …
}
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-route-options-preflight/`
