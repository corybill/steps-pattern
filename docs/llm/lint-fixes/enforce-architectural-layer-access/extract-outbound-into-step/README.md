# Extract outbound into a Step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-architectural-layer-access</rule-id>
    <slug>extract-outbound-into-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-05</recorded>
  </meta>
  <problem>
    An ingress, host, or valuation file calls a Proxy or a repository imported
    as *Model. Those calls are legal only from a Step (or Proxy / Repository /
    Module / Strategy / spec).
  </problem>
  <when>
    cron.js / lambda host / server.js / a valuation helper under
    app/server/valuation/ makes the outbound. A Service or existing Step
    already owns the flow.
  </when>
  <decision>
    Move the Proxy / repository call into a Step. Cron / HTTP host becomes
    Controller → Service → accept(Step). A valuation helper becomes a pure
    function; the owning Step loads rows and passes them in.
  </decision>
  <thought>
    Cron.enqueueDailySync called SqsValuationsProxy twice. The publisher
    stayed thin: Cron builds State, LambdaWorkerService.enqueueDailySync
    accepts EnqueueDailyValuationsSync, and that Step sends the two messages.

    engine-vs-market.js called Catalog / ReferenceQuote repositories. compareToMarket
    is now sync and row-in / row-out. ApplyEngineValuations loads the rows.

    seed-aging-curves.js called PositionAgingCurve.upsertMany. The file now
    only builds seed rows; SeedAgingCurves upserts.

    server.js called AgentSessionProxy ten times. AgentSessionController
    verbs (assert / disconnect / interrupt / queue / attach / ask) each
    accept one Step that calls the proxy.
  </thought>
  <do>
    1. Create or reuse steps/&lt;verb-noun&gt;.js. next(state) calls the
       Proxy or repository, writes only to state, wraps with try/catch + Errr.
    2. Ingress: Controller method with the same name as the Service method;
       Service accept()s the Step. Valuation helper: drop the import, take
       preloaded rows, keep the owning Step as the outbound caller.
    3. Cover new outbounds on the Cron / Controller / Route spec
       (happy + doesErrorWithPromise). Do not add spec/services/.
  </do>
  <do-not>
    Do not eslint-disable the layer-access rule.
    Do not rename cron.js or valuation/ into steps/ just to silence the path
    check — the call still has to live in a Step.
    Do not have a Step call another Step. Orchestration stays on the Service.
  </do-not>
  <live-canonical>
    lambda-worker/src/cron.js
    lambda-worker/src/steps/enqueue-daily-valuations-sync.js
    ui/app/server/valuation/engine-vs-market.js
    ui/app/server/steps/domains/apply-engine-valuations.js
    agent-runtime/src/server.js
    agent-runtime/src/controllers/agent-session-controller.js
  </live-canonical>
  <files>
    <file path="before-ingress.js" role="before">
      Cron ingress calling SqsValuationsProxy.
    </file>
    <file path="after-step.js" role="after">
      Step sends the daily enqueue messages.
    </file>
    <file path="after-ingress.js" role="after">
      Cron calls the Service.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-ingress.js](before-ingress.js) | Cron calling the proxy |
| [after-step.js](after-step.js) | Step owns SqsValuationsProxy.sendMessage |
| [after-ingress.js](after-ingress.js) | Cron → Service |

Live canonical: `Cron.enqueueDailySync` / `EnqueueDailyValuationsSync` / `AgentSessionController`.
