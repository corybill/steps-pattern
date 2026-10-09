# Strategy by sourceKey / algorithm prefix

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-step-loop-internal-function</rule-id>
    <slug>strategy-by-prefix</slug>
    <preference>preferred</preference>
    <recorded>2026-09-07</recorded>
  </meta>

  <problem>
    A Step loop calls a same-file helper that is an if-ladder of
    interchangeable predicates (sale:/hold:/orphan:/fee:*) or two
    algorithms for the same job (link-by-group vs link-by-name).
  </problem>

  <when>
    Five or more prefix branches, or two named algorithms for one
    concern. Each branch only needs (key, facts) or (item, index) —
    not a Module accept chain. Waiting for a sixth prefix is too late.
  </when>

  <decision>
    Put each branch in strategies/&lt;domain&gt;/ with accepts(key) +
    isStale(key, facts) (or match / find). Index with strategyForSourceKey
    (or STRATEGIES). The Step Command keeps repo fan-in and loops the
    imported Strategy.
  </decision>

  <pattern>Strategy</pattern>

  <thought>
    loop-accept-module is ceremony when there is no outbound per item.
    inline-into-next keeps the if-ladder. A helpers/ toolbox is unnamed
    Strategy. Five prefixes is enough to name the family.
  </thought>

  <do>
    1. One file per prefix / algorithm under strategies/.
    2. Export strategyForSourceKey or STRATEGIES from index.js.
    3. Step loop: strategyForSourceKey(key)?.isStale(key, facts).
    4. Delete the same-file isSourceKeyStale / compare / normalize helper.
  </do>

  <do-not>
    Do not put Catalog Zod on a domain model.
    Do not extract a one-step Module for a predicate.
    Do not invent utils/queue-keys.js for the ladder.
  </do-not>

  <live-canonical>
    ui/app/server/steps/mark-stale-generic-actions.js
    + ui/app/server/strategies/generic-action-stale/
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      loop calls isSourceKeyStale if-ladder.
    </file>
    <file path="after.js" role="after">
      loop calls strategyForSourceKey(key).isStale.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | `keys.every(isSourceKeyStale)` |
| [after.js](after.js) | `keys.every(strategyForSourceKey(...).isStale)` |
