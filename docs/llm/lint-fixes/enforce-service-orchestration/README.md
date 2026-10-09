# `enforce-service-orchestration`

A Service/Module try body contains an `if`, loop, `Promise.all` fan-out, or other non-orchestration statement. The rule allows `accept` / `acceptAll`, sequential `await Module.method(state)`, `set*`, `console` / `LoggerProxy`, variable declarations, and `return` — not conditionals or Module concurrency.

**Choose the recipe with the discriminator.** Verb/pathname splits at the Route/Controller use [dispatch-verb-at-ingress](dispatch-verb-at-ingress/) (controller twin). Body/`intent`/querystring splits use [intent-to-module-method](intent-to-module-method/) or [strategy-by-verb-in-step](strategy-by-verb-in-step/) — **not** a route-level Service map. Full table: [`../../framework/routing-dispatch-choice.md`](../../framework/routing-dispatch-choice.md).

Read the matching recipe before editing. Do not invent a third silence (`eslint-disable`, pushing the `if` into every Step as an `isDone`-shaped guard).

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (flat sibling Module phases) | [flat-module-call](flat-module-call/) | Service/Module try body only needs sequential `await Module.method(state)` (no `if` / loop / `Promise.all`). Drop the disable; keep the composer. |
| preferred (multi-phase loader, no setDone) | [module-phases-via-call-steps](module-phases-via-call-steps/) | Long Service loader uses `isDone` / `setDone` or length `if`s to skip phases. Split phases into **Module methods**; Service only `accept`s thin **Call*** Steps that wrap `Module.method(state)`. Target: `getActionsHub`. |
| preferred (form / body / query intent → different accept chains) | [intent-to-module-method](intent-to-module-method/) | Intent (or similar state key from body/query) chooses a **different accept chain**. Flat Service → Dispatch Step → static methods on **one Module**. Canonical: Billing payments; Actions Hub / Admin / Agent Chat rewrite Call*. **Do not** put this map on the route. |
| preferred (router / controller / middleware **verb** splits) | [dispatch-verb-at-ingress](dispatch-verb-at-ingress/) | HTTP **verb** (or pathname at ingress) chooses a **different accept chain**. Move the split to the route, controller, or middleware and give the Service one flat method per verb. **Not** for body `intent` or querystring. |
| alternative (one service method, leaf write) | [strategy-by-verb-in-step](strategy-by-verb-in-step/) | One Service method stays; interchangeable **leaf** business actions differ by verb or intent. One Step picks `Strategy.execute(state)` (repos/proxies only — not accept chains). |

Rule guide: [`../../rules/enforce-service-orchestration.md`](../../rules/enforce-service-orchestration.md)
