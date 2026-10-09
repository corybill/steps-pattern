# static-message-attrs

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-logger-static-message</rule-id>
    <slug>static-message-attrs</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>LoggerProxy message is a template or variable.</problem>
  <when>This rule fires.</when>
  <decision>Use a static string Literal; put variables in attributes.</decision>
  <do>
```LoggerProxy.error("Loader failed", { accountId, err });```
  </do>
  <do-not>
```LoggerProxy.error(`Loader failed for ${accountId}: ${err}`);```
  </do-not>
</lint-fix-recipe>
```
