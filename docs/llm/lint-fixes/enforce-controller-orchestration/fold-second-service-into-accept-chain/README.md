# Fold a second Service into the accept chain

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>fold-second-service-into-accept-chain</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    The loader/action awaits two Service methods (e.g. assertAdmin then
    getValuations). Routes may call exactly one Service method.
  </problem>

  <when>
    The extra call is a gate or setup Step that already exists
    (AssertAdmin, SetFormData, …) wrapped in a one-method Service.
    Accept that Step at the front of the remaining Service method.

    dispatch-verb-at-ingress is for PATCH vs DELETE choosing different
    methods, not for two sequential methods on one request.
  </when>

  <decision>
    Keep one Service method on the route. Accept the extra Step in
    that method's chain. Rethrow Response in the Service catch if the
    folded Step can throw redirect / 403 Response.
  </decision>

  <thought>
    A verb map cannot express “always assert, then load.” Calling
    AdminService from AdminValuationsService is a second orchestrator.
    The Step is the unit of reuse; the route stays one call.
  </thought>

  <do>
    1. Import the extra Step (e.g. AssertAdmin) into the Service the
       route already calls.
    2. await state.accept(AssertAdmin) first (or in acceptAll).
    3. Delete the second Service call from the route.
    4. If the folded Step threw a distinct wrap message, update the
       route spec to the remaining Service wrap — do not keep the
       second Service just for the string.
  </do>

  <do-not>
    Do not call Service B from Service A to “hide” the second call.
    Do not eslint-disable the extra-service message.
    Do not leave assert/setup ifs in the route.
  </do-not>

  <live-canonical>
    ui/app/routes/admin.valuations.jsx
    ui/app/server/services/admin-valuations-service.js
    ui/app/server/steps/assert-admin.js
  </live-canonical>

  <files>
    <file path="before-loader.js" role="before">
      Loader that calls AdminService.assertAdmin then getValuations.
    </file>
    <file path="after-loader.js" role="after">
      One Service call.
    </file>
    <file path="after-service.js" role="after">
      getValuations accepts AssertAdmin first.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-loader.js](before-loader.js) | Two Service calls |
| [after-loader.js](after-loader.js) | One Service |
| [after-service.js](after-service.js) | Folded `accept(AssertAdmin)` |

Live canonical: `admin.valuations.jsx` + `AdminValuationsService.getValuations`.
