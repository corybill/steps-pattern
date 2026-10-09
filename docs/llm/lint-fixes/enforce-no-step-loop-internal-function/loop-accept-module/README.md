# Loop Module.method instead of a same-file helper

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-step-loop-internal-function</rule-id>
    <slug>loop-accept-module</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Step maps or for-loops a same-file _processItem. The per-item body is
    a sequence (fetch then enrich). enforce-no-step-loop-internal-function
    forbids looping that helper.
  </problem>

  <when>
    The helper does two or more concerns per account, year, page, or id.
    Independent items should Promise.all the Module call.
  </when>

  <decision>
    Put one item on a Module method with a flat accept chain of 2+ Steps.
    The batch Step loops *Module.method only.
  </decision>

  <pattern>Iterator + Composite. The same-file _processItem is an unnamed helper — not a pattern.</pattern>

  <thought>
    iterator-simplicity does not see _processAccount because the map
    callback has zero awaits. This rule is the detector. A Module with
    one accept will warn on enforce-module-min-steps — split the helper
    into real sibling Commands, do not wrap the helper as one Step.
  </thought>

  <do>
    1. Name the per-item grains (load, compare, enrich).
    2. One Step per grain. Module method acceptAll those Steps.
    3. Batch next: collect items, then Promise.all(items.map(item =&gt;
       Module.method(item))).
    4. Delete the same-file _processItem.
  </do>

  <do-not>
    Do not eslint-disable the map.
    Do not items.map(ThisClass._processItem).
    Do not extract EngineValuationsModule.processAccount that only
    accept(ApplyEngineValuationsHelper) — that is still one Step.
    Do not for-await `Module.method` over independent items.
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
      next loops `Module.method`.
    </file>
    <file path="after-module.js" role="after">
      Module accepts two or more Steps.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | `map` → `_processAccount` |
| [after-batch.js](after-batch.js) | `Promise.all` + `Module.method` |
| [after-module.js](after-module.js) | Module `acceptAll` of 2+ Steps |

Also listed from `enforce-step-max-file-lines` / `extract-loop-into-module` — same grain, different trigger (file length vs loop helper).
