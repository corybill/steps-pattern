# accept-step-instead

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-service-from-step</rule-id>
    <slug>accept-step-instead</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Step imports a Service.</problem>
  <when>This rule fires.</when>
  <decision>Move orchestration to the Service; Step accepts siblings or writes state only.</decision>
  <do>
```await state.accept(AttachFillSseWriter);```
  </do>
  <do-not>
```const { default: GenericActionsService } = await import("../services/generic-actions-service.js");```
  </do-not>
</lint-fix-recipe>
```
