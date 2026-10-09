# Split into sibling Steps (parallel-first)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-max-file-lines</rule-id>
    <slug>split-into-sequential-steps</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Step file exceeds 250 lines because next owns several phases
    (load, score, enrich, persist) in one class. There is no per-item
    loop that should become a Module.
  </problem>

  <when>
    The fat body is one pipeline on a single bag of state. No
    accounts.map / years.for / pages.forEach of a same-file helper.
    calculate-engine-summaries is this shape.
  </when>

  <decision>
    Cut each phase into its own Step. The Service or Module lists those
    Commands (Template Method). acceptAll every sibling pair that has no
    data dependency. Sequential accept only when a later Step reads an
    earlier write. Delete the private methods from the original file
    (or delete the file if next becomes an empty shell).
  </decision>

  <pattern>Template Method (Service/Module accept chain — parallel-first). Command (one Step per phase). Not a helper file.</pattern>

  <thought>
    A Module is the wrong extract here — there is no item grain.
    enforce-module-min-steps would warn if you wrapped one fat Step
    as Module.run. Template Method lists the phases; it does not
    serialize them. acceptAll is Promise.all. Same-file _helpers do
    not shrink the file and skip the pattern.
  </thought>

  <do>
    1. Name the phases (load rows, score, enrich meta, write summaries).
    2. One Step file per phase. Each next writes only to state.
    3. For each sibling pair: if B does not read A's writes, put them
       in one acceptAll. If B reads A's writes, await accept(A) then
       accept(B) (or acceptAll the next independent cluster).
    4. Do not keep _score / _enrich in the original file.
    5. Cover via the route/controller/module Maddox suite. Do not mock Steps.
  </do>

  <do-not>
    Do not eslint-disable the file.
    Do not delete comments to land on 249.
    Do not invent a Module when there is no collection.
    Do not put the accept chain inside another Step.
    Do not await state.accept each phase in order just to keep the
    Service readable. That serializes work that can race.
    Do not acceptAll a later Step that reads an earlier Step's writes.
  </do-not>

  <live-canonical>
    Fail seed (deleted after extract): calculate-engine-summaries.js
    Dependent barrier (sequential accept is correct): 
    lambda-worker/src/services/lambda-worker-service.js
    recalculateEngineSummaries
    Independent siblings (acceptAll): 
    ui/app/server/services/account-service.js
    getAccounts — acceptAll([GetAccountsByUserId, GetUserSyncStats])
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      One Step next that loads, scores, and writes.
    </file>
    <file path="after-service.js" role="after">
      Service/Module acceptAll of sibling Steps.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | Fat sequential `next` |
| [after-service.js](after-service.js) | Parallel-first: `acceptAll` independent loads/writes, sequential `accept` at the join |

Looping a per-item helper instead? Use [extract-loop-into-module](../extract-loop-into-module/).
