# `enforce-error-log-at-ingress`

LoggerProxy.error and console.error belong only on the route/controller (ingress) catch.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred | [wrap-and-rethrow](wrap-and-rethrow/) | Default fix for this rule |

Rule guide: [`../../rules/enforce-error-log-at-ingress.md`](../../rules/enforce-error-log-at-ingress.md)
