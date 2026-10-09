# `enforce-maddox-scenario-mock-surface`

A Maddox `it` has **> 6** unique `mockThisFunction` targets or **> 7** `shouldBeCalledWith` assertions. The rule will also silence if the entry-point source already has the `[Maddox] Scenario mock surface` debt marker — that is a pause, not the preferred fix.

**Not this rule:** `if`, a second Service, or a DTO assembled in the loader/action is [`enforce-controller-orchestration`](../enforce-controller-orchestration/). A legal thin ingress can still fail this rule. Do not apply those recipes to shrink a spec’s mock list.

Read the matching recipe before editing. Do not invent a third silence (`eslint-disable`, `shouldBeCalledWithSubset`, `IgnoreParam`).

## Choose an extract

**First, reduce complexity.** Drop unused outbounds, stop asserting the same collaborator eight times when the Step can take one bulk call, delete dead `accept`s. Extract only after the remaining surface is still over the ceiling.

Also drop **frivolous defensive programming**. Mid-flow `if (!token)`, empty-array guards, and “maybe missing” branches that every later Step re-checks inflate both the production chain and the wrap `it`s. Ask: *should this be a precondition at the very beginning, or early in the flow?* One early fail (auth, required ids, required payload) lets later Steps assume the value and deletes mocks / wrap tests that only existed to cover the defensive branch.

A new Proxy (for example `ChromeStorageProxy` for browser storage) is a real outbound. Mocking it **adds** a unique `mockThisFunction`. That can trip this rule. Extract — do not skip the proxy or keep a global `mockStorage` to stay under the ceiling.

Then pick **one** of the two extracts. Do not invent a helper/util to hide the fan-out.

### 1. Split by iterator — preferred when it applies

There is a collection (accounts, weeks, pages, years). Put **one item** on a Module method. The Step (or a thin batch Step) loops and calls that method. Independent items should be `Promise.all` so the work parallelizes.

The caller spec mocks the Module method once. The module spec owns the per-item proxies/repos and stays at ≤6 unique mocks because it is one grain.

Canonical grain: `SyncAccounts` loops `Partner.syncAccount` (one account). Same shape: `ParseBillingHtmlPages` + `BillingHtmlModule` (`Module.method` per year/page).

If the loop still awaits a Proxy, [`enforce-step-iterator-simplicity`](../enforce-step-iterator-simplicity/) will also fire — use [extract-loop-outbound-into-module](../enforce-step-iterator-simplicity/extract-loop-outbound-into-module/) for that mix. The mock-surface win is the same: the caller no longer mocks every leaf.

→ [split-by-iterator](split-by-iterator/)

### 2. Split by steps — when there is no iterator

A single run is a long `accept` / `acceptAll` chain (or many `Strategy.execute`s) with no collection to loop. Divide and conquer: group related Steps into one or more Module methods and push those groups down. The caller spec mocks the new methods. Each method stays at ≤6 unique mocks.

This is also the preferred shape for **sharing** an encapsulated step group across Services or Modules.

→ [collapse-caller-mock-surface](collapse-caller-mock-surface/) (split by steps)

### Temporary

You cannot extract in this pass. Open the debt marker on the entry-point source.

→ [acknowledge-mock-surface-debt](acknowledge-mock-surface-debt/)

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| first | reduce complexity in place | Unused mocks, repeated `shouldBeCalledWith` that a bulk/one-call Step would collapse, dead accepts, mid-flow defensive guards that belong as an early precondition |
| preferred (has a collection) | [split-by-iterator](split-by-iterator/) | A Step/Service walks accounts / weeks / pages / years. Module = one item. Step loops (`Promise.all` when independent). |
| when no iterator (or sharing a step group) | [collapse-caller-mock-surface](collapse-caller-mock-surface/) | One run, many Steps/Strategies. Split the chain into Module methods. Also the share-across-callers extract. |
| temporary | [acknowledge-mock-surface-debt](acknowledge-mock-surface-debt/) | Extract is out of scope for this pass. |

Rule guide: [`../../rules/enforce-maddox-scenario-mock-surface.md`](../../rules/enforce-maddox-scenario-mock-surface.md)
