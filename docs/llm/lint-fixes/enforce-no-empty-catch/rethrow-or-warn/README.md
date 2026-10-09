# rethrow-or-warn

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-empty-catch</rule-id>
    <slug>rethrow-or-warn</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Empty or comment-only catch.</problem>
  <when>This rule fires.</when>
  <decision>Rethrow via Errr, or LoggerProxy.warn when continuing intentionally.</decision>
  <do>
```catch (err) { Errr.newError("Match failed").appendTo(err).throw(); }```
  </do>
  <do-not>
```catch (err) {}```
  </do-not>
</lint-fix-recipe>
```
