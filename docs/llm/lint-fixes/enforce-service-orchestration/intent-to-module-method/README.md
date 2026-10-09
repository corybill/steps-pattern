# Intent → Module method (same module)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-service-orchestration</rule-id>
    <slug>intent-to-module-method</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Service try body uses an intent if-ladder (dismiss / undo / execute /
    validate / fill / …) that awaits sibling Services or different accept
    chains. That IfStatement trips enforce-service-orchestration.
  </problem>

  <when>
    The discriminator is a form body intent (or similar state key), not an
    HTTP verb at the route. Each branch is a different accept chain (or a
    call into another Service that is itself an accept chain). The variants
    belong to one domain surface (Actions Hub Queue, Billing payments,
    Admin Actions). You want the split next to the domain, not a
    growing verb map on the route.
  </when>

  <decision>
    Keep the Service as a flat accept list: SetFormData (if needed) then
    one Dispatch Step. Put every branch as a static async method on a
    single Module (same file / module directory). The Dispatch Step maps
    intent → Module.method and awaits that method. Each Module method is
    try/catch + accept / acceptAll only — same shape as a Service method.
  </decision>

  <thought>
    This is the Strategy pattern without a strategies/ folder: the
    "strategies" are Module methods that orchestrate Steps. Strategies
    under strategies/ stay for leaf repo/proxy writes
    (strategy-by-verb-in-step). Module methods stay for full accept
    chains.

    Prefer this over dispatch-verb-at-ingress when the discriminator is
    a body/query intent (or similar state key) and the route should stay
    one Service.handleInteraction(state) call. Prefer dispatch-verb-at-ingress
    only when the split is HTTP verb (or pathname) at middleware/route ingress.

    Do not await GenericActionsService (or any Service) from the Module —
    either move those accept chains into the Module methods, or have the
    Module methods call the same Steps those Services already run.
  </thought>

  <do>
    1. Add modules/&lt;domain&gt;/&lt;domain&gt;.js with one static async method
       per intent (dismiss, undo, execute, validateBulk, fill, legacy, …).
       Each method: try { accept… } catch { Errr }.
    2. Add steps/dispatch-&lt;domain&gt;-action.js that reads intent (and any
       id-shape guards), picks the Module method, awaits it.
    3. Service.handleInteraction becomes:
       accept(SetFormData); accept(Dispatch…Action);
    4. Cover each intent on the Module Maddox suite (or the Dispatch Step
       suite that mocks Module methods only if the Step is the SUT —
       prefer Module entry points).
    5. Delete the Service if-ladder and any setDone / intent returns there.
  </do>

  <do-not>
    Do not keep if (intent === …) in the Service.
    Do not put accept chains inside Strategy.execute for this smell —
    use Module methods.
    Do not map intent (or querystring) on the route and call five Service
    methods — Controllers/Routes only map by HTTP verb or pathname
    (routing-dispatch-choice.md).
    Do not create helpers/ or utils/ for the intent map — keep the map
    in the Dispatch Step (or a const next to the Module).
    Do not call Module methods from other Module methods in a way that
    reintroduces orchestration debt without a clear composer (see
    BillingPaymentsModule.linkPayment eslint note).
  </do-not>

  <live-canonical>
    ui/app/server/steps/dispatch-actions-hub-interaction.js
    ui/app/server/steps/dispatch-admin-actions-interaction.js
    ui/app/server/modules/generic-actions/generic-actions.js
    (also: dispatch-billing-payments-action.js + billing-payments module)
  </live-canonical>

  <target-smell>
    (resolved) actions-hub-service / admin-actions-service handleInteraction
    intent ladders — now SetFormData → Dispatch* → GenericActionsModule.
  </target-smell>

  <files>
    <file path="before-service.js" role="before">
      Service intent if-ladder awaiting sibling Services.
    </file>
    <file path="after-service.js" role="after">
      Flat Service: SetFormData then Dispatch Step.
    </file>
    <file path="after-dispatch-step.js" role="after">
      Step maps intent → Module.method.
    </file>
    <file path="after-module.js" role="after">
      One Module; each method is a flat accept chain.
    </file>
  </files>

  <example>
    <thought>
      Actions Hub Queue posts share one action handler. Intent chooses
      dismiss vs execute vs fill — each is its own accept pipeline.
      Billing payments already does this: Dispatch Step →
      saveAccount / saveTransaction on one Module. Port that shape to
      Actions Hub instead of growing ifs on the Service.
    </thought>
    <before path="before-service.js" />
    <after path="after-service.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-service.js](before-service.js) | Service intent ladder that trips the rule |
| [after-service.js](after-service.js) | Flat Service accept list |
| [after-dispatch-step.js](after-dispatch-step.js) | Intent → Module.method |
| [after-module.js](after-module.js) | Module methods as accept-chain "strategies" |

Live canonical: `DispatchBillingPaymentsAction` + `BillingPaymentsModule`. Apply next to `ActionsHubService.handleInteraction` / `AdminActionsService.handleInteraction`.
