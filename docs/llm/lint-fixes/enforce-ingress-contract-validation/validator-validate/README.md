# validator-validate

```xml
<meta>
  <rule-id>steps-pattern/enforce-ingress-contract-validation</rule-id>
</meta>
```

Call `Validator.validate(schema, payload, debug)` (identity) or `Validator.validateParsed(schema, payload, debug)` (DTO clone) on its own line inside the Controller or Module `try` before `new *State` / Service / `state.accept` orchestration. Prefer `validate` — it returns the same input reference. Pass the raw ingress value — never `payload ?? {}` / `payload || {}`.
