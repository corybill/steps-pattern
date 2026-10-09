# `enforce-no-forbidden-words`

A collection of helpers is an absolute antipattern. This is not a filename rule. A grab-bag of leftover functions — whether named `helpers`, `utils`, `sale-math`, or `common` — is what you write when you have not named the pattern.

**Helpers are not a design.** Name the Gang of Four pattern first ([`gang-of-four.md`](../../framework/gang-of-four.md)): Command → Step; Strategy → `strategies/`; Template Method → accept chain; Iterator + Composite → Module per item. Then put the work in that pattern’s home — or reuse an existing Command (Step), Strategy, or Module method.

Read the matching recipe before editing. Do not silence with `eslint-disable`. Do not rename the toolbox.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (domain compute / map / select) | [extract-into-step](extract-into-step/) | The leftover builds, maps, or selects domain data. Become a Step. Accept it from the owning Service/Module. |
| alternative (labels / ordinals only) | [constants-or-common-not-util](constants-or-common-not-util/) | The leftover is a named string map or ordinal with no flow ownership. Move to `common/` or `constants/` with a domain filename. |
| alternative (same tiny fn on server + client) | [duplicate-across-boundary](duplicate-across-boundary/) | A Step and a React hook both need the same few lines. Duplicate. Keep them in sync in the dossier. |

Rule guide: [`../../rules/enforce-no-forbidden-words.md`](../../rules/enforce-no-forbidden-words.md)
