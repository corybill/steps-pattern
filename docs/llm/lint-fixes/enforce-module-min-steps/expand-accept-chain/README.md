# Expand the Module accept chain

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-module-min-steps</rule-id>
    <slug>expand-accept-chain</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Module method has one state.accept. enforce-module-min-steps warns
    because a Module is a multi-step sequence.
  </problem>

  <when>
    The missing siblings already exist as Steps (or should: fetch then
    process, authorize then write). The method is the right grain.
  </when>

  <decision>
    Accept the sibling Steps in the same flat try. Do not wrap the one
    Step in acceptAll([One]).
  </decision>

  <thought>
    If there is no second Step, this warning is the signal to drop the
    Module and keep the work in the Step — not to invent a no-op sibling.
  </thought>

  <do>
    1. List the real grains for this method.
    2. await state.accept(StepA); await state.accept(StepB); (or acceptAll).
    3. Keep the try body flat.
  </do>

  <do-not>
    Do not eslint-disable the warning to hide a ceremony extract.
    Do not add a no-op Step just to make the count 2.
  </do-not>

  <live-canonical>
    ui/app/server/modules/partner/partner.js
    (jitTriggerPartnerSync accepts two Steps; triggerPartnerSync is the warn seed)
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      One accept.
    </file>
    <file path="after.js" role="after">
      Two accepts.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | One `accept` |
| [after.js](after.js) | Two `accept`s |
