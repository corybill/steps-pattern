# enforce-controller-route-by-verb-or-path

## Rule id

`steps-pattern/enforce-controller-route-by-verb-or-path`

## Intent (from ESLint rule)

Route / Controller ingress may map or branch only by **HTTP verb** or **pathname**. Body fields (`intent`, …) and querystring must not pick a Service or Controller method.

## When this rule applies

- Remix routes (`app/routes/**`)
- Controllers (`**/controllers/**`)

## What triggers

A computed call like `FooService[…](…)` / `FooController[…](…)` where the property is derived from:

- a `*ByIntent*` / body / query map object, or
- `formData.get("intent")` / similar body or search-param reads

## What this rule does not enforce

- Verb maps (`ServiceMethodByVerb[request.method]`) whose keys are HTTP verbs
- Thin Router → one Controller method (no computed Service map)
- Intent dispatch inside a **Step** (Dispatch → Module / Strategy)

## Correct fix (checklist)

1. Collapse the Route/Controller to one Service/Controller method (e.g. `handleInteraction`).
2. `accept(SetFormData)` then `accept(Dispatch*Interaction)`.
3. Map intent → Module methods (or Strategy) in the Dispatch Step.
4. Read `routing-dispatch-choice.md` before choosing a recipe.

## What good looks like

```js
export async function action(args) {
  return ActionsHubController.handleInteraction(args);
}
```

```js
const ServiceMethodByVerb = { PATCH: "rename", DELETE: "delete" };
await AgentChatHistoryService[ServiceMethodByVerb[method]](state);
```

## Do not

```js
const ServiceMethodByIntent = {
  "dismiss-action": "dismiss",
  "execute-generic-action": "execute",
};
const formData = await args.request.formData();
await ActionsHubService[ServiceMethodByIntent[formData.get("intent")]](state);
```

## Related docs

- `docs/llm/framework/routing-dispatch-choice.md`
- `docs/llm/lint-fixes/enforce-controller-route-by-verb-or-path/`
- `docs/llm/lint-fixes/enforce-service-orchestration/intent-to-module-method/`
