# preconditions-debug-test

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-if-throw-use-precondition</rule-id>
    <slug>preconditions-debug-test</slug>
    <preference>preferred</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>`if (!x) throw new Error` / `Errr.newError` for a required pipeline value.</problem>
  <when>Step / Strategy / Service / Module mid-flow required-value assert (not Controller ingress Zod).</when>
  <decision>Replace with `Preconditions.errr().shouldBeDefined|shouldBeTruthy(…).debug({…}).test()`.</decision>
  <pattern>Guard Clause via Preconditions (not a new type).</pattern>
  <thought>Zod/`Validator.validate` stays at Controller / Parse* / Catalog. Preconditions owns trusted invariants. Do not move the check earlier unless `no-frivolous-defensive-if` says so.</thought>
  <do>
1. `import Preconditions from "preconditions"` and `const preconditions = Preconditions.errr()` at module scope.
2. Delete the `if (!x) { throw … }` block.
3. Call `preconditions.shouldBeDefined(x, "named message").debug({ x, …ids }).test()` (or `shouldBeTruthy` after a load).
  </do>
  <do-not>
- Do not `Validator.validate` / Zod for this mid-flow check.
- Do not `eslint-disable` the rule.
- Do not convert HTTP `Response` / `redirect` / catch classification ifs.
- Do not invent `no-frivolous-defensive-if` moves in the same pass unless that rule is shipping.
  </do-not>
  <live-canonical>document-processor/src/steps/load-account-document.js</live-canonical>
  <files></files>
</lint-fix-recipe>
```
