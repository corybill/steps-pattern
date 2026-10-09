# route-calls-controller

```xml
<meta>
  <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
</meta>
```

Remix `loader` / `action` is a **Router**: optional HTTP verb/path guard, then `return *Controller.*(args)`.

Move `new *State`, the Service call, return-from-state, and try/catch + Errr + `LoggerProxy` into `app/server/controllers/*`.

Do not map body `intent` on the Router or Controller — Dispatch Step → Module and/or Strategy.

Canonical: `actions.jsx` / `api.actions.fill.jsx` → `ActionsHubController`.
