# Gang of Four — how we decide structure

A collection of helpers is an absolute antipattern. **This is not a filename rule.** A grab-bag of leftover functions — whether named `helpers`, `utils`, `sale-math`, or `common` — is what you write when you have not named the pattern. **Name the pattern first.** Then put the code in the layer that already owns that pattern, or reuse an existing Command (Step), Strategy, or Module method.

A helper collection is an anti-pattern for people who do not know these patterns. The leftover is unnamed Strategy + unnamed Command.

| Variation you have | Pattern | Home in this codebase |
| :--- | :--- | :--- |
| Interchangeable algorithms (match, score, verb write) | **Strategy** | `strategies/` |
| One unit of work; write only to state | **Command** | Step `next(state)` |
| Fixed sequence of units | **Template Method** | Service / Module flat accept chain. The skeleton lists phases; it does **not** mean they run serially. Independent phases → `acceptAll` (`Promise.all`). Sequential `accept` only when a later phase reads an earlier write. |
| Ingress that only orchestrates | **Facade** | Service |
| Same sequence per item in a collection | **Iterator** + **Composite** | Batch Step `Promise.all`s `Module.method`; Module method = one item. Serial `for-await` only for shared mutation / rate-limit. |
| External API / auth shape | **Adapter** | Proxy |
| Pick which Strategy or Module method | **Factory Method** | Dispatch Step or `strategies/index` |

**Do:** two callers need the same Command → they `accept` the same Step. Two algorithms for the same job → a Strategy family.

**Do not:** extract a toolbox of functions so two files can import them. That skips this table. Renaming the toolbox does not fix it.

When a lint `Fixes:` index offers several recipes, pick the one that matches a row above — not the cheapest rename.

How to fix a helper collection: [`../lint-fixes/enforce-no-forbidden-words/`](../lint-fixes/enforce-no-forbidden-words/).
