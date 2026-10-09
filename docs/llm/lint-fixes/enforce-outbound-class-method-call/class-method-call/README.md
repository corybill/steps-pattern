# class-method-call

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-outbound-class-method-call</rule-id>
    <slug>class-method-call</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Free function imported from a proxy/repo/module and called as an Identifier.</problem>
  <when>The imported function is outbound I/O (or DateProxy). Do not use this recipe for Errr flag reads, retry caps, or delay math.</when>
  <decision>Import the class and call Class.method.</decision>
  <do>
```await ClientEventsProxy.reportClientEvent(...);```
  </do>
  <do-not>
```await reportClientEvent(...);```

Never hoist in-process policy onto the Proxy to satisfy this lint. That is [hoist-in-process-onto-proxy](../hoist-in-process-onto-proxy/) (never). Use [in-process-in-step](../in-process-in-step/) instead.
  </do-not>
</lint-fix-recipe>
```
