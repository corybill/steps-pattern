# Split by steps (collapse the caller mock surface)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-maddox-scenario-mock-surface</rule-id>
    <slug>collapse-caller-mock-surface</slug>
    <preference>when-no-iterator</preference>
    <recorded>2026-09-03</recorded>
    <renamed>2026-09-04</renamed>
  </meta>

  <problem>
    One Maddox Scenario registers 7+ unique mockThisFunction targets (max 6)
    or 8+ shouldBeCalledWith assertions. The caller spec is documenting a
    wide outbound surface, not a single boundary.
  </problem>

  <when>
    There is no collection to loop (or the extract is for sharing a step
    group across Services/Modules). A Step or Service fans out across many
    interchangeable Strategy.execute calls or a long acceptAll of
    outbound-heavy steps. Prefer split-by-iterator when a collection exists.
  </when>

  <decision>
    Fold the strategy (or step) sequence into a Module, same shape as the
    Partner module in sync: static async entry points that
    create module state and accept steps. The caller (service or thin step)
    invokes one module method. The caller spec mocks that one method.
    The module spec owns the outbound mocks.
  </decision>

  <thought>
    This is divide-and-conquer: split a group of Steps into Module
    methods. It is also the share-across-callers extract — an encapsulated
    step group belongs on a Module, not copied into a second Service.

    When the path walks a collection, use split-by-iterator instead
    (Module = one item, Step = loop / Promise.all).

    Acknowledging debt (the sibling recipe) silences the lint and leaves
    the caller spec unreadable. A Module is the Steps Pattern unit for a
    reusable or grouped sequence — that is why Partner lives under
    src/modules/ and callers mock Partner.syncAccount / Partner.getAccounts
    instead of every HttpProxy + repository the leaf steps touch.

    This is not enforce-controller-orchestration. Do not format a DTO in
    a Step or dispatch a verb at ingress to shrink the mock list. A thin
    controller can still fail this rule.

    Strategies are still valid *inside* the module's steps (intent /
    format branches). They stop being the caller's mock surface.

    If the new module method still has 7+ outbounds, split it into sibling
    module methods (Partner.getSelections, Partner.getPeriods, …) and let a
    composer method call those siblings. The composer spec may still trip
    the ceiling — that is when the module itself takes the temporary debt
    marker, while every caller stays at 1 mock.
  </thought>

  <do>
    1. Create src/modules/&lt;name&gt;.js (or modules/&lt;name&gt;/&lt;name&gt;.js in UI).
       Class name PascalCase + Module (or the sync Partner convention:
       export class Partner with static async methods).
    2. Move the strategy/step sequence into one or more static async
       module methods. Each method: new module state (or reuse the
       caller's state), state.accept / acceptAll, return from state.
       No business logic in the module class.
    3. Replace the caller's acceptAll / Strategy.execute fan-out with
       one module call (Module.method or Module.method(state)).
    4. Rewrite the caller Maddox spec: one mockThisFunction for the
       module method. Delete the per-strategy / per-repo mocks from
       that spec.
    5. Add a module Maddox suite (calling &lt;method&gt;, it / generated pack)
       that mocks the real outbounds (repos, proxies). Keep each module
       *method* under 6 unique mocks. Split methods if you cannot.
    6. Do not mock the new module's Steps. Do not mock the Service at
       the route/controller.
  </do>

  <do-not>
    Do not eslint-disable this rule.
    Do not shrink the count with shouldBeCalledWithSubset or IgnoreParam
    (banned by sibling Maddox rules).
    Do not mock Step classes so the caller "looks" like 1 mock.
    Do not leave the 7 strategy mocks on the caller and also add a module
    mock — the point is to *move* the surface, not duplicate it.
    Do not create helpers/ or utils/ to hide the fan-out.
    Do not apply enforce-controller-orchestration recipes
    (format-response-in-step, dispatch-verb-at-ingress, …).
    Do not split-by-steps when a collection exists — use split-by-iterator.
  </do-not>

  <live-canonical>
    sync/src/modules/partner.js
    sync/spec/modules/partner.spec.js
  </live-canonical>

  <files>
    <file path="before-dispatcher.js" role="before">
      Service/step that execute()s seven strategies — the lint trigger.
    </file>
    <file path="before-spec.js" role="before">
      Caller Scenario with seven mockThisFunction registrations.
    </file>
    <file path="after-module.js" role="after">
      Partner-shaped module that acceptAlls the sequence.
    </file>
    <file path="after-caller.js" role="after">
      Caller that invokes one module method.
    </file>
    <file path="after-caller-spec.js" role="after">
      Caller Scenario with one module mockThisFunction.
    </file>
  </files>

  <example>
    <thought>
      Seven unique mockThisFunction pairs in one it is the ceiling + 1.
      Extracting ApplyMemberPostureModule.apply collapses the caller to
      one mock. The module spec can still mock the seven repos, or we
      split apply into sibling methods if that spec is the next lint hit.
    </thought>
    <before path="before-spec.js" />
    <after path="after-caller-spec.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-dispatcher.js](before-dispatcher.js) | Wide strategy fan-out |
| [before-spec.js](before-spec.js) | 7 `mockThisFunction` (trips the rule) |
| [after-module.js](after-module.js) | Extracted module |
| [after-caller.js](after-caller.js) | One module call |
| [after-caller-spec.js](after-caller-spec.js) | 1 `mockThisFunction` |

Live canonical: `sync` `Partner` — leaf methods stay small (`getAccounts` mocks `HttpProxy` + one repo); the fat composer `syncAccount` mocks sibling module methods and carries the temporary debt marker.
