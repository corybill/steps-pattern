# in-process-in-step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-outbound-class-method-call</rule-id>
    <slug>in-process-in-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>A Step imported a free function from a proxy file, so the lint asks for Class.method.</problem>
  <when>The function does not leave the process and is not an uncontrollable dynamic (not DateProxy). Typical leftovers: Errr flag reads, retry caps, DelaySeconds math.</when>
  <decision>Keep the Command on the Step. Read Errr flags with err.get. Do not add Proxy.is* / getMax* / compute* wrappers so Maddox will mock them.</decision>
  <pattern>Command</pattern>
  <thought>class-method-call is correct for outbound. Using it here explodes the Maddox surface and parks policy on an Adapter.</thought>
  <do>
1. Stop importing the named function from the proxy.
2. If the proxy already stamps the Errr, read it in the Step (`err.get("isSearchWriteThrottled")`).
3. Keep caps and delay math as file-private functions on that Step.
4. Leave wire-error classification private inside the proxy that wraps the HTTP response.
5. Do not extract a queue-retry / utils helper bag.
  </do>
  <do-not>
That silence is [hoist-in-process-onto-proxy](../hoist-in-process-onto-proxy/) (never).
```SearchProxy.isSearchWriteThrottled(err);
ModelProxy.computeDelayedRequeueSeconds(args);```
  </do-not>
  <live-canonical>sync/src/steps/bulk-upsert-open-search-docs.js</live-canonical>
  <files>
    <file path="do-not.js" role="before">Wrong Class.method hoist.</file>
    <file path="after-step.js" role="after">Errr flag + private delay math on the Step.</file>
  </files>
</lint-fix-recipe>
```
