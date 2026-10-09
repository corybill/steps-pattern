# map-interaction-result-step

```xml
<meta>
  <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
</meta>
```

Do not call `state.setInteractionResult` in a Service or Module try body. Accept a `Map*Result` Step that owns the payload mapping.
