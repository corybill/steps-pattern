# Split by iterator

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-maddox-scenario-mock-surface</rule-id>
    <slug>split-by-iterator</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    One Maddox Scenario is over 6 unique mockThisFunction targets or 7
    shouldBeCalledWith assertions because the caller walks a collection and
    mocks every per-item outbound.
  </problem>

  <when>
    The production path already has (or should have) a collection: accounts,
    weeks, pages, years, member ids. Each item runs the same sequence.
    Reduce complexity first; then use this extract instead of splitting the
    step list on a single item.
  </when>

  <decision>
    Module method = one item. The Step owns the loop and calls the Module
    (Module.method). Independent items use Promise.all.
    The caller spec mocks the Module method. The module spec owns the
    per-item proxies/repos and stays at ≤6 unique mocks.
  </decision>

  <thought>
    This is the preferred mock-surface extract when a collection exists.
    One grain on the Module collapses N×M leaf mocks on the caller to 1
    (the module method). Parallel Promise.all is a bonus, not the reason
    — the reason is the mock boundary.

    Split-by-steps (collapse-caller-mock-surface) is the fallback when
    there is no collection, or when the goal is to share a step group
    across Services/Modules.

    If the batch Step still awaits a Proxy inside the loop,
    enforce-step-iterator-simplicity also fires. Use that rule's
    extract-loop-outbound-into-module for the mix; keep this recipe's
    grain (Module = one item, Step = loop).
  </thought>

  <do>
    1. Identify the item grain (one account, one week, one HTML page).
    2. Put that item's accept / acceptAll chain on a Module static method.
       New module state (or a typed slice). No loop inside the Module.
    3. Batch Step: collect items, then loop.
       Independent items: await Promise.all(items.map((item) =&gt;
       Module.method(item))).
       Ordered / rate-limited work may stay a serial for-await.
    4. Caller Maddox spec: mockThisFunction the Module method. Delete the
       per-item proxy/repo mocks from that spec.
    5. Module Maddox suite owns the leaf mocks for *one* item. Keep that
       method ≤6 unique mocks; split sibling methods if you cannot.
    6. Do not mock Steps. Do not mock the Service at the route/controller.
  </do>

  <do-not>
    Do not eslint-disable this rule.
    Do not put the collection loop inside the Module so the Step "looks"
    thin while the module spec still walks N items.
    Do not Promise.all a fat Proxy+parse body — that is still a wide
    surface and trips iterator-simplicity.
    Do not shrink counts with shouldBeCalledWithSubset or IgnoreParam.
    Do not create helpers/ or utils/ for the loop.
    Do not apply enforce-controller-orchestration recipes.
  </do-not>

  <live-canonical>
    sync/src/steps/sync-accounts.js
    sync/src/modules/partner.js
    (SyncAccounts loops Partner.syncAccount — one account per call)
    sync/src/steps/parse-billing-html-pages.js
    (Module.method per year / page; BillingHtmlModule owns the item)
  </live-canonical>
</lint-fix-recipe>
```

Sibling when there is no collection: [collapse-caller-mock-surface](../collapse-caller-mock-surface/) (split by steps). Iterator-simplicity mix: [extract-loop-outbound-into-module](../../enforce-step-iterator-simplicity/extract-loop-outbound-into-module/).
