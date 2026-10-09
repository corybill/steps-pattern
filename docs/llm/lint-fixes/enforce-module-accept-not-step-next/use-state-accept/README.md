# use-state-accept

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-module-accept-not-step-next</rule-id>
    <slug>use-state-accept</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Module calls Step.next(state).</problem>
  <when>This rule fires.</when>
  <decision>Replace with state.accept(Step).</decision>
  <do>
```await state.accept(AuthorizePartnerWriteWorkload);```
  </do>
  <do-not>
```await AuthorizePartnerWriteWorkload.next(state);```
  </do-not>
</lint-fix-recipe>
```
