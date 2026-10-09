# Module phases via Call Steps (no setDone)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
    <slug>module-phases-via-call-steps</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Service loader runs a long accept list with if (!state.isDone()) /
    state.setDone(false) (or if (getSaleActions().length)) to skip or
    re-enter phases. That trips enforce-service-orchestration and embeds
    the forbidden isDone control-flow anti-pattern.
  </problem>

  <when>
    One Service method (e.g. getActionsHub) must run several heavy
    phases: load accounts, build sale/hold cards, merge Queue rows,
    format response. Some phases should no-op when there is no work
    (no accounts, no sales). The phases are reusable accept chains, not
    a single leaf Strategy.execute.
  </when>

  <decision>
    Split each phase into a Module static method (flat accept / acceptAll
    only — same rules as a Service). The Service only accepts thin Call*
    Steps. Each Call Step invokes one Module method (and may guard
    whether to call). Delete ShortCircuitIfNoAccounts setDone, Service
    isDone checks, and setDone(false) resets.
  </decision>

  <thought>
    Services and Modules cannot have IfStatements in the try body.
    Steps can. So empty-account / empty-sale guards belong in the Call
    Step (or in the first Step inside the Module chain as an early
    return). Prefer the Call Step guard when you would otherwise run a
    long no-op accept list.

    This pairs with intent-to-module-method: that recipe is for intent
    branching; this one is for sequential multi-phase loaders. Same
    idea — Module methods are the strategies; Steps wrap Module calls.

    Do not "fix" isDone by moving if (!isDone) into the Service under
    a different flag. Do not leave setDone on ShortCircuit* Steps.
  </thought>

  <do>
    1. Create modules/&lt;domain&gt;/&lt;domain&gt;.js with one method per phase
       (e.g. buildSaleHoldActions, mergeQueueActions). Each method:
       try { accept… } catch { Errr }. No setDone / isDone.
    2. Add Call* Steps: next(state) { await Module.phase(state); }
       Optional guard in the Step:
       if (!(state.getAccounts()||[]).length) { /* seed empties */; return; }
       await Module.buildSaleHoldActions(state);
    3. Service method becomes a short flat list:
       accept(GetAccounts…); accept(Filter…);
       accept(CallBuildSaleHoldActions);
       accept(CallMergeQueueActions);
       accept(Format…);
    4. Delete ShortCircuitIfNoAccounts (or strip setDone and fold seeding
       into the Call Step / Module entry Steps).
    5. Length checks like if (saleActions.length) move into
       SuppressResolvedSaleActions / AttachSaleQueueActionIds
       (early return) or into CallMergeQueueActions / Module.mergeQueue.
  </do>

  <do-not>
    Do not use state.setDone / isDone to skip Service accepts.
    Do not put if (accounts.length) in the Service or Module try body.
    Do not await Module from the Service directly — wrap with a Step
    so the Service stays accept-only and Maddox can mock the Module
    at the Step boundary when testing the Service… actually Service
    specs mock repos; Module is the SUT for phase specs. Call Steps
    keep the Service lint-clean.
    Do not invent helpers/ for Call* wrappers — one Step file per call.
  </do-not>

  <live-canonical>
    ui/app/server/services/actions-hub-service.js
    (getActionsHub → CallBuildSaleHoldActions / CallMergeQueueActions →
    ActionsHubModule)
  </live-canonical>

  <target-smell>
    (resolved) actions-hub-service getActionsHub isDone / setDone / saleActions.length if
  </target-smell>

  <files>
    <file path="before-service.js" role="before">
      Service isDone / setDone phase gating.
    </file>
    <file path="after-service.js" role="after">
      Flat Service: Call* Steps only.
    </file>
    <file path="after-call-step.js" role="after">
      Call Step wraps Module method; optional empty guard.
    </file>
    <file path="after-module.js" role="after">
      Module phase: flat accept chain, no setDone.
    </file>
  </files>

  <example>
    <thought>
      getActionsHub always needs Queue merge + format even with zero
      accounts. Sale/hold build is a separate phase that should not
      run (or should no-op) when accounts are empty. Two Module methods,
      two Call Steps, no isDone flag bouncing false after the skip.
    </thought>
    <before path="before-service.js" />
    <after path="after-service.js" />
  </example>
</lint-fix-recipe>
```

## Target shape for `getActionsHub`

```text
ActionsHubService.getActionsHub
  → accept(GetAccountsByUserId)
  → accept(FilterAccountsToCurrentSeason)
  → accept(CallBuildSaleHoldActions)   // Step → ActionsHubModule.buildSaleHoldActions
  → accept(CallMergeQueueActions)         // Step → ActionsHubModule.mergeQueueActions
  → accept(FormatActionsHubResponse)

ActionsHubModule.buildSaleHoldActions   // flat accepts; Call Step skips if no accounts
ActionsHubModule.mergeQueueActions         // list/stale/suppress/attach/dedupe/append;
                                           // suppress/attach Steps early-return if no sales
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-service.js](before-service.js) | isDone / setDone Service smell |
| [after-service.js](after-service.js) | Flat Call* Service |
| [after-call-step.js](after-call-step.js) | Step wraps Module |
| [after-module.js](after-module.js) | Module phase accept chain |
