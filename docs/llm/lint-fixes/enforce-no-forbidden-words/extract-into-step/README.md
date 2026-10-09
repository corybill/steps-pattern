# Extract helper/util logic into a Step

**Helpers are an anti-pattern for people who do not know design patterns.** A `helper` / `util` file is unnamed Command (and often unnamed Strategy). Name the Gang of Four pattern first ([`gang-of-four.md`](../../../framework/gang-of-four.md)). Domain compute / map / select is almost always **Command** → a Step `next(state)` accepted on the owning Template Method (Service/Module). Interchangeable algorithms are **Strategy**, not a second helper.

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-forbidden-words</rule-id>
    <slug>extract-into-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    Domain compute, map, or select lives under a helper / util / lib
    path (or would, if you extracted a shared toolbox). The path token
    is forbidden. Renaming the folder does not give the logic an owner.
    A helper is the leftover when no Gang of Four pattern was named.
  </problem>

  <when>
    The leftover builds a board, maps rows, selects a group, or
    otherwise transforms domain data that a flow already carries on
    state. Callers already have a Service or Module that can accept
    a Step.
  </when>

  <decision>
    Name the pattern (Command). Move the work into a Step class with
    static async next(state). Read from state getters, write with
    setters, wrap with try/catch + Errr. Accept the Step from the
    owning Service or Module (Template Method). Delete the helper/util
    file.
  </decision>

  <pattern>Command (Step). Template Method (Service/Module accept). Strategy if the leftover is interchangeable algorithms — then strategies/, not a second helper.</pattern>

  <thought>
    A helper file is what you write instead of Command or Strategy.
    Sync selections left src/lib and became two Steps:
    BuildMemberSelections (build the board onto state) and
    MapMemberSelections (index it for transaction matching).
    Partner.generateNewMemberSelections accepts Build after
    GetPublicSaledPicks; getTransactions accepts Map first.
    That is the pattern: one concern per Step, orchestration stays
    on the Module.

    Format* DTO assembly in the UI is the same decision under
    enforce-controller-orchestration (format-response-in-step).
  </thought>

  <do>
    1. Create steps/&lt;verb-noun&gt;.js. Class name matches the file.
       next(state) reads getters, writes setters, never returns a value.
    2. Import and state.accept(TheStep) in the owning Module/Service
       method, in the existing flat try chain.
    3. Delete the helper/util/lib file. Update every import.
    4. Cover new outbounds on the ingress / module spec
       (happy + doesErrorWithPromise). Do not add spec/services/.
  </do>

  <do-not>
    Do not rename helpers/ to lib/ or utils/ to shared/.
    Do not keep a "shared functions" file because you skipped naming
    Command or Strategy.
    Do not export a function that returns the computed value for
    callers to stash — write to state inside the Step.
    Do not call Step.next from another Step.
    Do not eslint-disable the path rule.
  </do-not>

  <live-canonical>
    sync/src/steps/build-member-selections.js
    sync/src/steps/map-member-selections.js
    sync/src/modules/partner.js
    (generateNewMemberSelections / getTransactions)
  </live-canonical>

  <files>
    <file path="before-lib.js" role="before">
      lib/selections.js toolbox that returns values.
    </file>
    <file path="after-step.js" role="after">
      Step writes the board onto state.
    </file>
    <file path="after-module.js" role="after">
      Module accepts the Step in the flat chain.
    </file>
  </files>

  <example>
    <thought>
      BuildMemberSelections used to be a lib helper that returned
      an array. The Module already had account/memberss/drafts/saled
      picks on state. The Step reads those getters and
      setMemberSelections. MapMemberSelections is the index twin
      accepted at the start of getTransactions.
    </thought>
    <before path="before-lib.js" />
    <after path="after-step.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-lib.js](before-lib.js) | `lib/` toolbox that returns values |
| [after-step.js](after-step.js) | Step writes onto state |
| [after-module.js](after-module.js) | Module accept chain |

Live canonical: `BuildMemberSelections` / `MapMemberSelections` on `Partner`.
