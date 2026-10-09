# append-to-catch-binding

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-errr-append-to</rule-id>
    <slug>append-to-catch-binding</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Errr wrap omits appendTo(err).</problem>
  <when>This rule fires.</when>
  <decision>Chain .appendTo(the catch binding) before throw/get.</decision>
  <do>
```Errr.newError("Save failed").appendTo(err).throw();```
  </do>
  <do-not>
```Errr.newError("Save failed").throw();```
  </do-not>
</lint-fix-recipe>
```
