# Extract the loop body into a multi-step Module

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-max-file-lines</rule-id>
    <slug>extract-loop-into-module</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Step file exceeds 250 lines because next loops a per-item body
    (fetch, compare, enrich for each account / year / page). Same-file
    _processItem keeps the file fat and trips
    enforce-no-step-loop-internal-function.
  </problem>

  <when>
    There is a collection. The looped code is two or more concerns per
    item. apply-engine-valuations and apply-catalog-adjustments are
    this shape.
  </when>

  <decision>
    Module method = one item. That method acceptAll two or more Steps.
    The original Step stays a thin batch: collect items, then
    Promise.all` + `Module.method. Serial for-await only when items share
    in-place mutation, require write order, or have a documented rate-limit.
  </decision>

  <pattern>Iterator (batch Step loops). Composite (Module method = one item, 2+ Commands). Not a same-file helper.</pattern>

  <thought>
    Sequential sibling Steps on the Service are the wrong extract —
    they would still need a loop, and the loop would call a same-file
    helper or one fat leftover Step. The Module is the item grain
    (Iterator + Composite). A one-step Module will warn on
    enforce-module-min-steps.
  </thought>

  <do>
    1. Name the per-item grains (load values, compare market, enrich).
    2. One Step per grain. Module method acceptAll those Steps.
    3. Batch next: Promise.all(items.map(item =&gt; Module.method(item))).
    4. Delete _processItem / _fetch* / _enrich* from the batch file.
    5. Caller Maddox mocks the Module method. Module suite owns leaf mocks.
  </do>

  <do-not>
    Do not eslint-disable the file.
    Do not keep _processAccount in the batch Step.
    Do not put the collection loop inside the Module.
    Do not extract a Module that only accept(OneFatStep).
  </do-not>

  <live-canonical>
    Fail seed: ui/app/server/steps/domains/apply-engine-valuations.js
    Pass shape: sync/src/steps/parse-billing-html-pages.js
    + sync/src/modules/billing-html.js
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      next maps to _processAccount.
    </file>
    <file path="after-batch.js" role="after">
      Thin batch loops `Module.method`.
    </file>
    <file path="after-module.js" role="after">
      Module acceptAll of 2+ Steps.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | `map` → `_processAccount` |
| [after-batch.js](after-batch.js) | Thin batch `Module.method` |
| [after-module.js](after-module.js) | Multi-step Module |

No collection? Use [split-into-sequential-steps](../split-into-sequential-steps/). Same loop helper also fails `enforce-no-step-loop-internal-function` ([loop-accept-module](../../enforce-no-step-loop-internal-function/loop-accept-module/)).
