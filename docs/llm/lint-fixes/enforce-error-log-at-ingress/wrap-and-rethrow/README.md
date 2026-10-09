# wrap-and-rethrow

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-error-log-at-ingress</rule-id>
    <slug>wrap-and-rethrow</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>A lower-layer catch logs with LoggerProxy.error.</problem>
  <when>This rule fires.</when>
  <decision>Wrap with Errr and rethrow so ingress logs once. Use LoggerProxy.warn only for intentional swallows.</decision>
  <do>
```Errr.newError("CallSync failed").appendTo(err).throw();```
  </do>
  <do-not>
```LoggerProxy.error("sync failed", {}, err);```
  </do-not>
</lint-fix-recipe>
```
