# flat-module-call

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
    <slug>flat-module-call</slug>
    <preference>preferred</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>Service/Module try body fans out Module calls with Promise.all, or gates them with if/loops.</problem>
  <when>Composer needs sibling Module phases; no branching between them.</when>
  <decision>Keep a flat sequential await Module.method(state) chain. Put conditionals or Promise.all into a Step.</decision>
  <do>
```await BillingPaymentsModule.linkPrimary(state);
await BillingPaymentsModule.autoLinkMatching(state);```
  </do>
  <do-not>
```await Promise.all([
  BillingPaymentsModule.linkPrimary(state),
  BillingPaymentsModule.autoLinkMatching(state),
]);```
  </do-not>
</lint-fix-recipe>
```
