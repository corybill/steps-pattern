# hoist-in-process-onto-proxy

**Never this.** Silencing the lint by wrapping in-process policy as `Proxy.method` is how Search throttle predicates landed on lockdown Global Mocks.

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-outbound-class-method-call</rule-id>
    <slug>hoist-in-process-onto-proxy</slug>
    <preference>never</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>A Step calls a named import from a proxy file (isThrottled, getMaxRetries, computeDelay). The lint asks for Class.method.</problem>
  <when>Never. This is the silence that created the mess. Use in-process-in-step instead.</when>
  <decision>Do not add SearchProxy.isSearchWriteThrottled / getMax* / getRetryAfter* or ModelProxy.computeDelayedRequeueSeconds. Do not mock those methods in Maddox.</decision>
  <thought>class-method-call is for outbound I/O. Applying it here parks Command policy on an Adapter and forces four Global Mock setups that are not I/O.</thought>
  <do>Stop. Open in-process-in-step.</do>
  <do-not>
```SearchProxy.isSearchWriteThrottled(err);
SearchProxy.getMaxSearchDelayedRetries();
SearchProxy.getSearchRetryAfterSeconds(err);
ModelProxy.computeDelayedRequeueSeconds(args);```
  </do-not>
  <live-canonical>sync/src/steps/bulk-upsert-open-search-docs.js</live-canonical>
  <files>
    <file path="do-not.js" role="before">Wrong silence: Class.method wrappers for Errr flags and delay math.</file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [do-not.js](do-not.js) | The silence this lint must not produce |
