# `enforce-architectural-layer-access`

Proxy, repository, module, and strategy calls must come from a Step (or another allowed layer). Ingress / host / valuation files are not allowed layers.

Read the matching recipe before editing. Do not eslint-disable.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (ingress / host / valuation) | [extract-outbound-into-step](extract-outbound-into-step/) | A Cron, HTTP host, or valuation helper calls a Proxy or repository `*Model`. Move the outbound into a Step. Ingress calls a Controller / Service; a valuation helper stays pure and the owning Step loads rows. |

Rule guide: [`../../rules/enforce-architectural-layer-access.md`](../../rules/enforce-architectural-layer-access.md)
