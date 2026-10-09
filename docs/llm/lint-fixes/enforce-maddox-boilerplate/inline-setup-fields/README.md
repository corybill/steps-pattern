# inline-setup-fields

```xml
<meta>
  <rule-id>steps-pattern/enforce-maddox-boilerplate</rule-id>
</meta>
```

`context.setupX` bodies must not call `context.setupY()`. Copy the parent fixture field assignments into the child setup and apply deltas in place.
