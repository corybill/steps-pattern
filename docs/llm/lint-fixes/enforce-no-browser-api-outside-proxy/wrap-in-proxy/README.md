# wrap-in-proxy

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-browser-api-outside-proxy</rule-id>
    <slug>wrap-in-proxy</slug>
    <preference>preferred</preference>
    <recorded>2026-09-11</recorded>
  </meta>
  <problem>Step calls chrome.* / browser.* directly.</problem>
  <when>This rule fires.</when>
  <decision>Call a Proxy method (ChromeStorageProxy) instead.</decision>
  <do>
```await ChromeStorageProxy.get(["authToken"]);```
  </do>
  <do-not>
```await chrome.storage.local.get(["authToken"]);```
  </do-not>
</lint-fix-recipe>
```
