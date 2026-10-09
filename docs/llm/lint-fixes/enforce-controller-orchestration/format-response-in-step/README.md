# Format response in a Step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>format-response-in-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    After the Service returns, the loader still declares locals
    (context.get, coalesced getters, maps) and builds a DTO. Route
    VariableDeclarations that are not `new XxxState` are illegal.
  </problem>

  <when>
    The try body (or the return) maps, coalesces, or reads router
    context to assemble a loader/action payload. A single getter
    (`return { seasons: state.getStandingsSeasons() }`) can stay in
    the route. Use this when the shape is more than one getter
    (model + extras, or a hub payload). Do not Format a view bag of
    search params and identity the parent layout already has.
  </when>

  <decision>
    A Format* Step reads state, setResponses the DTO. The Service
    accepts that Step last. The route returns state.getResponse().
  </decision>

  <thought>
    Collapsing the locals into one `return { … }` silences the
    VariableDeclaration hit — ReturnStatement is always allowed — but
    leaves mapping and context.get in the route. The rule's intent is
    create state, one Service, return from state.

    userModel is already on State from appUserModelContext. Do not
    re-read context in the route or the Step.
  </thought>

  <do>
    1. Add Format* (e.g. FormatActionsHubResponse) that setResponses
       the assembled object. Prefer a model `.toJSON()` or one
       getter. Private `_toDto` maps are fine.
    2. Accept that Step at the end of the one Service method.
    3. Loader: const state = new XxxState(args);
       await XxxService.method(state); return state.getResponse();
    4. Drop route-level mappers and context.get after the Service.
  </do>

  <do-not>
    Do not squash the DTO into a single return { … } in the route
    to dodge the VariableDeclaration lint.
    Do not context.get(appUserModelContext) — use state.getUserModel().
    Do not Format a view bag of search params or parent-layout identity
    when one getter / model.toJSON() is the data (standings `{ seasons }`).
    Do not put the assemble in the Service (enforce-service-orchestration).
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/routes/actions.jsx
    ui/app/server/steps/format-actions-hub-response.js
    ui/app/server/services/actions-hub-service.js
  </live-canonical>

  <files>
    <file path="before-loader.js" role="before">
      Loader that parses new URL / searchParams and assembles a DTO after the Service.
    </file>
    <file path="after-loader.js" role="after">
      Create state, one Service, return state.getResponse().
    </file>
    <file path="after-step.js" role="after">
      Format* Step that setResponses the DTO from state getters.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-loader.js](before-loader.js) | Assembled DTO in the route try |
| [after-loader.js](after-loader.js) | `return state.getResponse()` |
| [after-step.js](after-step.js) | Format* `setResponse` |

Live canonical: `actions.jsx` + `format-actions-hub-response.js`. A single getter (`standings` `{ seasons }`) does not need this recipe.
