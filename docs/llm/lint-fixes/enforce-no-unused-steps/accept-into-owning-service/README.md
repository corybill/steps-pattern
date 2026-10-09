# Accept unused Step into the owning Service

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-unused-steps</rule-id>
    <slug>accept-into-owning-service</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Step class exists under steps/ but no Service or Module mentions
    its name, so enforce-no-unused-steps reports an orphan.
  </problem>

  <when>
    The Step is finished work for an existing Service method (after
    persist, after parse, or as the next accept in a flat chain).
    Deleting it would drop a real side effect.
  </when>

  <decision>
    Import the Step in the owning Service or Module and
    state.accept(Step) in the flat try chain. Do not call Step.next
    from another Step. Do not mention the class only in a comment.
  </decision>

  <thought>
    The rule is a token scan: the class name must appear in a
    non-spec file that is not the Step itself. Accept is the
    architectural use. A dummy import with no accept is a silence.

    Remove the file only when there is no intended caller.
  </thought>

  <do>
    1. Find the Service/Module that already runs the persist or
       dispatch this Step should follow.
    2. Import the Step. Add await state.accept(StepClass) in the
       existing try, after the write it depends on.
    3. Keep the Service flat — no if around the accept unless a
       sibling recipe for enforce-service-orchestration applies.
    4. Cover the new outbound on the route/controller spec
       (happy + doesErrorWithPromise for fail-closed).
  </do>

  <do-not>
    Do not eslint-disable the orphan.
    Do not add the class name in a comment or unused import.
    Do not call Step.next from another Step or from the route.
    Do not write a spec/services suite; cover via the ingress.
  </do-not>

  <live-canonical>
    ui/app/server/services/billing-service.js
  </live-canonical>

  <files>
    <file path="before-step.js" role="before">
      Orphan Step that is never accepted.
    </file>
    <file path="after-service.js" role="after">
      Service accepts the Step after persist.
    </file>
  </files>

  <example>
    <thought>
      UI EnqueueGenericActionsRefresh was the ledger-write twin of
      the sync enqueue Step. The owning method is
      saveBillingTransaction. Accept after Capture, before Index.
    </thought>
    <before path="before-step.js" />
    <after path="after-service.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-step.js](before-step.js) | Orphan Step that trips the rule |
| [after-service.js](after-service.js) | Service accept after persist |

Live canonical: `billing-service.js` `saveBillingTransaction`.
