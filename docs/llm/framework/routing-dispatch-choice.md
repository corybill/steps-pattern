# Routing / dispatch choice (Router · Controller · Step · Module · Strategy)

How to pick **where** a branch lives when something must choose among pipelines or leaf actions. Read this before applying `dispatch-verb-at-ingress`, `intent-to-module-method`, or `strategy-by-verb-in-step`.

## Decision table

| Discriminator | Where the map / branch lives | Pattern |
| :--- | :--- | :--- |
| **HTTP verb** (`GET` / `POST` / `PATCH` / `DELETE` / `OPTIONS`) | Route (Router) or Controller | **Map at ingress** → one Controller/Service method per verb ([dispatch-verb-at-ingress](../lint-fixes/enforce-controller-orchestration/dispatch-verb-at-ingress/)); UI prefers thin Router → Controller ([route-calls-controller](../lint-fixes/enforce-controller-orchestration/route-calls-controller/)) |
| **Pathname** (layout index vs `/members`, account shell vs tab) | Route/Controller may use a thin verb/path map **or** accept a Redirect* Step; path bounce logic belongs in a Step when a Service already loads data | [redirect-layout-index-in-step](../lint-fixes/enforce-controller-orchestration/redirect-layout-index-in-step/) |
| **Body field** (`intent`, tool, command name, …) | **Never** the Route/Controller map | Dispatch Step → **Module methods** ([intent-to-module-method](../lint-fixes/enforce-service-orchestration/intent-to-module-method/)) when each branch is an accept chain; or Step → **Strategy.execute** ([strategy-by-verb-in-step](../lint-fixes/enforce-service-orchestration/strategy-by-verb-in-step/)) when each branch is a leaf write |
| **Querystring** (`?tab=`, `?mode=`, search filters that change the pipeline) | **Never** the Route/Controller map | Same as body: Dispatch Step → Module, or Strategy for leaf variants |

## NEVER (Router / Controller)

- [ ] **NEVER** peek `request.json()` / `formData` / `intent` on the route to pick a Service method (even outside `try`).
- [ ] **NEVER** map querystring keys to Service methods at ingress.
- [ ] **NEVER** grow a route-level `METHOD_BY_INTENT` / `handlerByBody` table — that is domain dispatch, not HTTP ingress.

## ALWAYS

- [ ] **ALWAYS** use Route/Controller maps only for **verb** and (when needed) **pathname** ingress.
- [ ] **ALWAYS** put body/query/intent routing in a **Step** (Dispatch → Module methods for full accept chains, or Strategy factory for interchangeable leaf writes).
- [ ] **ALWAYS** keep the UI Route as: optional verb/path guard → **one Controller call**. Controller: create state → **one Service call** → return from state.

## Quick examples

**UI thin Router → Controller (preferred)**

```js
export async function action(args) {
  return ActionsHubController.handleInteraction(args);
}
```

**Verb at ingress (OK)**

```js
const methodByVerb = { PATCH: "rename", DELETE: "delete" };
await AgentChatsService[methodByVerb[request.method] ?? "process"](state);
```

**Body intent at ingress (WRONG)**

```js
const methodByIntent = { "dismiss-action": "dismiss", "execute-generic-action": "execute" };
await ActionsHubService[methodByIntent[intent]](state);
```

**Body intent in a Step (OK)**

```js
// Service
await state.accept(SetFormData);
await state.accept(DispatchActionsHubInteraction);

// DispatchActionsHubInteraction → GenericActionsModule.dismiss / .execute / …
// (or Strategy.execute for interchangeable leaf writes)
```

## Related lint

- Controllers/routes: `enforce-controller-orchestration` + `enforce-controller-route-by-verb-or-path`. Thin Router recipe: `route-calls-controller`.
- Service if-ladders: `enforce-service-orchestration` recipes above.
- Product Cursor rule: `.cursor/rules/steps-pattern/routes.mdc`.
