# `enforce-controller-orchestration`

A route loader/action try body contains an `if`, a second Service call, or other non-orchestration. Controllers must call a Service method with the same name.

**Choose the recipe with the discriminator, not convenience.** Route/Controller maps are only for **HTTP verb** or **pathname**. Body `intent`, querystring, or other payload keys belong in a Dispatch Step → Module / Strategy — see [`../../framework/routing-dispatch-choice.md`](../../framework/routing-dispatch-choice.md).

Read the matching recipe before editing. Do not eslint-disable.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (UI thin Router) | [route-calls-controller](route-calls-controller/) | Remix `loader`/`action` should only verb/path-guard then `return *Controller.*(args)`. State + Service + catch live on the Controller. Canonical: `actions.jsx`, `api.actions.fill.jsx`. |
| preferred (verb split) | [dispatch-verb-at-ingress](dispatch-verb-at-ingress/) | PATCH vs DELETE (or OPTIONS vs default) should run **different Service methods**. Use a verb → method-name map and one `Service[method](state)` call. **Not** for body `intent` or querystring. |
| preferred (same bounce on many routes) | [extract-registration-wizard-service](extract-registration-wizard-service/) | The same stage/path bounce lives on several routes, or the stay path also builds loader data. Put the `if` / URL checks in a Step and call one Service from each loader. |
| preferred (layout / tab path bounce) | [redirect-layout-index-in-step](redirect-layout-index-in-step/) | Bare account path, `/members`, `/history`, or invalid season should `throw redirect` and a Service already loads the page. Accept a Redirect* Step; catch rethrows `Response`. Canonical: `accounts.$accountId.jsx`. |
| preferred (assembled DTO) | [format-response-in-step](format-response-in-step/) | After the Service, the loader still maps, coalesces, or `context.get`s a payload that is more than one getter. Canonical Format* Step inside the Service; Controller/route returns `state.getResponse()`. Prefer a model / one partial (`{ seasons }`) when that is the data. |
| preferred (second Service call) | [fold-second-service-into-accept-chain](fold-second-service-into-accept-chain/) | The route awaits a gate/setup Service then the real method (`assertAdmin` + `getValuations`). Accept the extra Step on the remaining method. Canonical: `admin.valuations.jsx`. |
| preferred (splat 404) | [return-static-not-found](return-static-not-found/) | Every branch returns the same static 404. Drop `new URL` / `if`. Do not invent a NotFoundService. Canonical: `$.jsx`. |
| alternative (redirect only) | [map-key-to-throw-redirect](map-key-to-throw-redirect/) | The branch is only `throw redirect(path)` from a known key (registration stage, etc.) and there is **no** Service pipeline. Map key → `() => { throw redirect(path) }` and `return map[key]?.() ?? {}`. |

Sibling recipes for the Service-side `if`: [`../enforce-service-orchestration/`](../enforce-service-orchestration/). Body/query intent ladders: [`../enforce-service-orchestration/intent-to-module-method/`](../enforce-service-orchestration/intent-to-module-method/).

**Not this rule:** A thin route/controller whose Maddox `it` still has ≥7 unique mocks (or ≥8 `shouldBeCalledWith`) is [`enforce-maddox-scenario-mock-surface`](../enforce-maddox-scenario-mock-surface/). Do not apply these recipes to shrink a spec’s mock list.

Rule guide: [`../../rules/enforce-controller-orchestration.md`](../../rules/enforce-controller-orchestration.md)
