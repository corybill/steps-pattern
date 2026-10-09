# `enforce-no-route-options-preflight`

Remix routes must not handle OPTIONS; middleware owns CORS preflight.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred | [remove-options-branch](remove-options-branch/) | Default fix for this rule |

Rule guide: [`../../rules/enforce-no-route-options-preflight.md`](../../rules/enforce-no-route-options-preflight.md)
