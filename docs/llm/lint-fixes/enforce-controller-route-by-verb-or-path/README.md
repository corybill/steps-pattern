# `enforce-controller-route-by-verb-or-path`

Route/Controller maps only by HTTP verb or pathname — not body intent or querystring.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred | [intent-to-dispatch-step](intent-to-dispatch-step/) | Body `intent` (or query) currently picks a Service method at ingress |

Also see: [`../enforce-service-orchestration/intent-to-module-method/`](../enforce-service-orchestration/intent-to-module-method/) and [`../../framework/routing-dispatch-choice.md`](../../framework/routing-dispatch-choice.md).

Rule guide: [`../../rules/enforce-controller-route-by-verb-or-path.md`](../../rules/enforce-controller-route-by-verb-or-path.md)
