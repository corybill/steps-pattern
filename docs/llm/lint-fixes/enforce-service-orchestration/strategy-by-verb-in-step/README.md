# Strategy by verb in a Step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
    <slug>strategy-by-verb-in-step</slug>
    <preference>alternative</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    A Service try body branches on request.method or intent to run
    different business actions, which trips enforce-service-orchestration.
  </problem>

  <when>
    The Service method stays one sequence (parse → save → respond). Only
    the leaf action changes: DELETE vs POST upload vs get-upload-url.
    The variants share the same I/O on state and are interchangeable
    Strategy.execute implementations.
  </when>

  <decision>
    Keep a flat Service accept list. One Step reads getUrlMethod() /
    getIntent(), looks up a Strategy, and calls execute(state). The
    factory maps verb to intent when the verb is the discriminator
    (DELETE → delete).
  </decision>

  <thought>
    Strategies are leaf business actions, not accept-chain orchestrators.
    Use this when PATCH/DELETE/POST are variants of the same resource
    write, not different pipelines (auth vs CORS seed).

    If the verb skips an entire accept chain, use dispatch-verb-at-ingress
    instead. Do not put state.accept inside a Strategy.

    When the discriminator is a body intent (not HTTP verb) and the
    variants are different accept chains (account link vs ledger write,
    or Actions Hub dismiss vs execute), use intent-to-module-method:
    Dispatch Step → static methods on one Module. Canonical: payments
    action → DispatchBillingPaymentsAction → BillingPaymentsModule.
    Do not put those accept chains in Strategy.execute.
  </thought>

  <do>
    1. Keep the Service as accept(SaveThing) (plus any shared steps).
    2. In the Step, const method = state.getUrlMethod() || "POST";
       const intent = method === "DELETE" ? "delete" : state.getIntent().
    3. Strategy factory get(intent) returns the leaf class or default.
    4. await strategy.execute(state). Strategies use repos/proxies only.
    5. Cover each intent/verb on the ingress or Step Maddox suite.
  </do>

  <do-not>
    Do not put if (method === "DELETE") accept(Delete) in the Service.
    Do not implement accept chains inside Strategy.execute.
    Do not create helpers/ or utils/ to hide the factory.
    Do not use a Strategy factory for OPTIONS-vs-auth middleware —
    those are two pipelines (dispatch-verb-at-ingress).
  </do-not>

  <live-canonical>
    ui/app/server/steps/save-account-document.js
    ui/app/server/strategies/save-account-document/index.js
  </live-canonical>

  <files>
    <file path="before-service.js" role="before">
      Service if (method === DELETE) accept(Delete) else accept(Upload).
    </file>
    <file path="after-step.js" role="after">
      Step maps verb/intent to Strategy.execute.
    </file>
    <file path="after-factory.js" role="after">
      Intent → Strategy map with default.
    </file>
  </files>

  <example>
    <thought>
      Policy save is one Service method. DELETE and get-upload-url are
      interchangeable writes, not a skipped auth chain. The Step is the
      dispatcher; the Service stays flat.
    </thought>
    <before path="before-service.js" />
    <after path="after-step.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-service.js](before-service.js) | Service verb `if` that trips the rule |
| [after-step.js](after-step.js) | Step maps verb/intent to Strategy |
| [after-factory.js](after-factory.js) | Intent → Strategy factory |

Live canonical: `save-account-document.js` + `strategies/save-account-document/`.
