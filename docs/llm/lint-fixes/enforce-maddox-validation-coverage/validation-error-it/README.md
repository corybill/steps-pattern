# validation-error-it

```xml
<meta>
  <rule-id>steps-pattern/enforce-maddox-validation-coverage</rule-id>
</meta>
```

Add one Maddox `it` that passes invalid ingress and asserts `Maddox.compare.containsError(err, "Validation Error")`. Sibling specs (`.spec.js` + `.ai-driven.spec.js`) are scanned together.
