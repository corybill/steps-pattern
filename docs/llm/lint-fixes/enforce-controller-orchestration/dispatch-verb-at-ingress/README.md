# Dispatch verb at ingress (route / controller)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>dispatch-verb-at-ingress</slug>
    <preference>preferred</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    A route action try body uses if (method === "PATCH") / if (DELETE)
    to call different Service methods. The rule forbids IfStatement
    inside the try and allows only one Service call.
  </problem>

  <when>
    A resource route (or middleware ingress) must run a different
    Service method per HTTP verb. OPTIONS that terminate the request
    may stay as a guard *outside* the try (already allowed). OPTIONS
    that continue the chain belong in the verb map.

    Pathname-only bounces (layout index vs tab) may use this map shape
    or redirect-layout-index-in-step. Body intent and querystring are
    NEVER ingress map keys — use intent-to-module-method /
    strategy-by-verb-in-step instead (see routing-dispatch-choice.md).
  </when>

  <decision>
    Map verb → Service method name. Call
    Service[map[request.method] ?? "process"](state) once. Each Service
    method is a flat accept list (see enforce-service-orchestration
    dispatch-verb-at-ingress).
  </decision>

  <thought>
    if (PATCH) rename(); if (DELETE) delete() is two Service calls and
    an if — both illegal in a route try. A computed property on one
    Service identifier is still one Service call.

    Controllers already tend to be one method per verb with a matching
    Service method name. Prefer that when the controller is the ingress.
    Use the map when a single action() or middleware function handles
    several verbs.

    Interchangeable leaf writes (DELETE vs upload) belong in a Step
    Strategy factory, not a second Service method — see
    enforce-service-orchestration/strategy-by-verb-in-step.
  </thought>

  <do>
    1. Split the Service into one method per verb pipeline.
    2. In the route/action or middleware, const serviceMethodByVerb =
       { PATCH: "rename", DELETE: "delete", OPTIONS: "options" }.
    3. await SomeService[serviceMethodByVerb[method] ?? "process"](state).
    4. Keep terminating OPTIONS (return jsonResponse({})) *outside* try.
    5. Return from state only.
  </do>

  <do-not>
    Do not put if (method === …) inside the loader/action try.
    Do not await handler(state) where handler is a loose function —
    the route rule only recognizes callee.object.name ending in Service.
    Do not call two Service methods in one action.
    Do not map body intent, form fields, or querystring to Service
    methods at the route (that is intent-to-module-method / Strategy).
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/server/middleware/root-auth.middleware.js
    ui/app/routes/api.agent.chats.$agentChatId.jsx
  </live-canonical>

  <files>
    <file path="before-action.js" role="before">
      Route action with if (PATCH) / if (DELETE) inside try.
    </file>
    <file path="after-action.js" role="after">
      Verb → method name map and one Service[method](state) call.
    </file>
  </files>

  <example>
    <thought>
      Agent chat PATCH rename vs DELETE is two Service methods. One
      computed call keeps the action lint-clean. Root auth middleware
      uses the same map for OPTIONS vs process.
    </thought>
    <before path="before-action.js" />
    <after path="after-action.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-action.js](before-action.js) | Route `if` per verb inside try |
| [after-action.js](after-action.js) | One `Service[method](state)` |

Live canonical: `root-auth.middleware.js`. Chat resource action still uses `if`s inside try — prefer the after shape when touching that file.
