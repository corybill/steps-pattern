# `enforce-no-step-loop-internal-function`

A Step loop calls a same-file function (`ThisClass._processAccount`, `items.map(ThisClass._foo)`). That is the class-module grain hiding in a private method.

That private method is an unnamed helper. Prefer Gang of Four ([`gang-of-four.md`](../../framework/gang-of-four.md)): per-item sequence → **Iterator** + **Composite** (`loop-accept-module`); one in-memory transform → inline into the Command (`next`).

Read the matching recipe before editing.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (per-item sequence) | [loop-accept-module](loop-accept-module/) | The helper fetches, compares, or runs two or more concerns per item. Module method = one item; the Step loops `Module.method`. |
| preferred (property of one object) | [use-domain-model-getter](use-domain-model-getter/) | The helper only reads/derives a field of one domain object (`_getAccountType`, `matchName`, `isPaidStatus`). Put it on the model; the loop reads the getter. |
| preferred (prefix / algorithm ladder) | [strategy-by-prefix](strategy-by-prefix/) | The helper is an if-ladder of interchangeable predicates (`sale:` / `hold:` / …) or two named algorithms for one job. Put each branch in `strategies/`. |
| alternative (single in-memory concern) | [inline-into-next](inline-into-next/) | The helper is one transform (collect ids, format a key) that is not a model field. Put the loop body in `next`. Do not invent a Module. |

Rule guide: [`../../rules/enforce-no-step-loop-internal-function.md`](../../rules/enforce-no-step-loop-internal-function.md)

A one-step Module extracted only to silence this rule will **warn** on `enforce-module-min-steps`.
