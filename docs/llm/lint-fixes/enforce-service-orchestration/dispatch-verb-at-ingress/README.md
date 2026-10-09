# Dispatch verb at ingress

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
    <slug>dispatch-verb-at-ingress</slug>
    <preference>preferred</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    A Service try body uses if (state.getX()) to skip or choose accept
    chains. enforce-service-orchestration treats that if as business logic.
  </problem>

  <when>
    The branch is an HTTP verb (OPTIONS vs everything else, PATCH vs
    DELETE) or pathname at ingress that selects a different step sequence.
    Body intent and querystring are NOT ingress keys — use
    intent-to-module-method or strategy-by-verb-in-step
    (routing-dispatch-choice.md). The skipped steps must not run at all
    (not early-return inside each Step). Typical layers: route action,
    controller, middleware.
  </when>

  <decision>
    Split the Service into one static async method per pipeline. At the
    ingress, map verb → method name and call Service[method](state).
    Unknown verbs fall through to the default method. Each Service method
    is a flat accept / acceptAll list.
  </decision>

  <thought>
    Skill 2.3 and enforce-service-orchestration both require a flat
    Service try body (no IfStatement). Moving the verb split to ingress
    keeps the Service lint-clean, and control flow stays out of Steps
    (no shouldBypass / isDone flag).

    For routes, enforce-controller-orchestration also forbids if inside
    the loader/action try. Service[computedMethod](state) is one Service
    call, so it satisfies that rule too. Do not write
    if (method === "PATCH") Service.rename(); if (method === "DELETE")
    Service.delete() inside the try.

    Use strategy-by-verb-in-step instead when the Service method stays
    one sequence and only the leaf business action changes (DELETE vs
    upload vs default).
  </thought>

  <do>
    1. Add one Service method per pipeline (e.g. options, process,
       rename, delete). Each method: try { accept… } catch { Errr }.
    2. At the route / controller / middleware, declare a verb → method
       name map. Call Service[map[request.method] ?? "process"](state).
    3. OPTIONS that must continue the chain (middleware next()) must not
       throw or return a Response just to skip remaining steps.
    4. Delete state flags that only existed to skip later accepts
       (shouldBypassAuth, setDone).
    5. Cover each verb path on the ingress Maddox suite.
  </do>

  <do-not>
    Do not eslint-disable enforce-service-orchestration on the if.
    Do not always-accept and add if (state.getShouldBypassAuth()) return
    in every Step — that is the isDone anti-pattern.
    Do not throw a Response on middleware OPTIONS if next() must still run.
    Do not copy API-route if (OPTIONS) return jsonResponse({}) into
    middleware that seeds context then continues.
    Do not name the lookup Routes unless the values are route modules.
  </do-not>

  <live-canonical>
    ui/app/server/middleware/root-auth.middleware.js
    ui/app/server/services/root-auth-middleware-service.js
  </live-canonical>

  <files>
    <file path="before-service.js" role="before">
      Service if (getShouldBypassAuth) wrapping later accepts.
    </file>
    <file path="after-ingress.js" role="after">
      Verb → Service method name lookup at middleware / route ingress.
    </file>
    <file path="after-service.js" role="after">
      Two flat Service methods: options and process.
    </file>
  </files>

  <example>
    <thought>
      OPTIONS seeds empty auth context and must call next(). GET/POST/…
      run identity + auth + registration. Those are two pipelines, not
      two flavors of one save. Ingress picks the method; the Service
      never sees the if.
    </thought>
    <before path="before-service.js" />
    <after path="after-ingress.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-service.js](before-service.js) | Service `if` that trips the rule |
| [after-ingress.js](after-ingress.js) | Verb lookup at ingress |
| [after-service.js](after-service.js) | Flat `options` / `process` methods |

Live canonical: `root-auth.middleware.js` + `RootAuthMiddlewareService`.
