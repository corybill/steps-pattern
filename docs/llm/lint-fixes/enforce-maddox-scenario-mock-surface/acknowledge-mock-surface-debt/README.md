# Acknowledge mock-surface debt

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-maddox-scenario-mock-surface</rule-id>
    <slug>acknowledge-mock-surface-debt</slug>
    <preference>temporary</preference>
    <recorded>2026-09-03</recorded>
    <renamed>2026-09-04</renamed>
  </meta>

  <problem>
    One Maddox Scenario is over 6 unique mockThisFunction targets or 7
    shouldBeCalledWith assertions, and this pass cannot extract a module.
  </problem>

  <when>
    The entry-point controller / service / module / route / step is a
    known wide composer (Partner.syncAccount is the live case) and a
    further module split is out of scope for the current change.
  </when>

  <decision>
    Add the open @technical-debt marker the rule already looks for on
    the *entry-point source file* (not the spec). The lint unblocks.
    Leave the checkbox open until split-by-iterator or
    collapse-caller-mock-surface lands.
  </decision>

  <thought>
    The rule was written so acknowledging the smell is enough to silence.
    That is a pause button, not the architecture. Prefer split-by-iterator
    when a collection exists; otherwise collapse-caller-mock-surface
    (split by steps / share a step group).

    Use this recipe only when extracting now would blow the change
    (cross-workspace move, no module spec yet, mid-generate). Record
    why in the dossier line if the default wording is not enough.

    Do not put this marker on a route to silence a fat-controller lint.
    Logic in the loader is enforce-controller-orchestration.
  </thought>

  <do>
    1. Open the production file resolved from withEntryPoint (or the
       sibling path the rule guessed from the spec).
    2. Under @technical-debt add exactly:
       - [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.
    3. Do not close the checkbox to "fix" the lint — any line containing
       the marker substring silences, but a closed box lies about intent.
    4. Schedule the extract (same PR if cheap; otherwise leave the
       open debt and stop).
  </do>

  <do-not>
    Do not eslint-disable the rule.
    Do not put the marker only on the spec — the rule reads the
    entry-point source.
    Do not treat this as the preferred fix when a Module extract is
    the same size as adding the debt line.
    Do not shrink counts with shouldBeCalledWithSubset or IgnoreParam.
    Do not use this line to silence enforce-controller-orchestration.
  </do-not>

  <live-canonical>
    sync/src/modules/partner.js
    (open [Maddox] Scenario mock surface line on Partner)
  </live-canonical>

  <files>
    <file path="debt-line.js" role="after">
      The exact @technical-debt line the rule matches.
    </file>
  </files>
</lint-fix-recipe>
```

Sibling: [debt-line.js](debt-line.js). Preferred: [split-by-iterator](../split-by-iterator/) when a collection exists; otherwise [collapse-caller-mock-surface](../collapse-caller-mock-surface/).
