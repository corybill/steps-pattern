# use-vitest-expect

```xml
<meta>
  <rule-id>steps-pattern/enforce-no-maddox-compare-outside-scenario</rule-id>
</meta>
```

Replace `Maddox.compare.*` with Vitest `expect` / Testing Library matchers. Remove the `Maddox` import when the file has no Scenario.
