# Redirect layout index in a Step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>redirect-layout-index-in-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A layout or index loader ifs on pathname (bare account path, /members,
    /history) and return/throw redirect, sometimes after the Service.
    Route IfStatement inside try is illegal.
  </problem>

  <when>
    The loader also fetches data (or will on the stay path). Path checks,
    empty groups, member-default, and invalid-season redirects belong in
    a Step accepted by the existing Service method. Clone
    RedirectPeriodsIndexToUserGroup.

    map-key-to-throw-redirect is enough only when the loader does no
    Service work. extract-registration-wizard-service is the same idea
    for the registration funnel.
  </when>

  <decision>
    One Redirect* Step throws redirect when the path (or param) matches.
    Accept it in the one Service method (first when no data is needed,
    after load when the target needs member/history). The route is
    create state, one Service, return from state. Catch rethrows Response.
  </decision>

  <thought>
    Leaving the if outside try silences the branch lint and still hides
    the bounce in the route. routes.mdc: redirects and “is this the
    index path?” belong in steps.

    A throw-function map cannot see getUserMember() or history seasons.
    Inventing a second Service per leaf is overkill — accept the Step
    on the layout/tab method that already runs.
  </thought>

  <do>
    1. Add Redirect* (e.g. RedirectAccountLayoutIndex) that normalizes
       trailing slashes, compares pathname or params, and throw redirect.
    2. Accept it on the existing Service method. Rethrow Response in
       the Service catch (if (err instanceof Response) throw err).
    3. Route catch must `return err` when `err instanceof Response`
       (RemixScenario can assert 302; periods layout is the sibling).
    4. Route try: const state = new XxxState(args);
       await XxxService.method(state); return state.getResponse()
       (or one getter). No new URL, no if.
  </do>

  <do-not>
    Do not keep if (pathname === …) return redirect inside the route try.
    Do not leave the bounce outside try as a “lint dodge.”
    Do not invent a Service whose only job is throw redirect when a
    layout Service already exists.
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/routes/accounts.$accountId.jsx
    ui/app/server/steps/domains/redirect-account-layout-index.js
    ui/app/server/steps/domains/redirect-account-member-index.js
    ui/app/server/services/account-service.js
  </live-canonical>

  <files>
    <file path="before-loader.js" role="before">
      Layout loader that ifs pathname and return redirect after the Service.
    </file>
    <file path="after-loader.js" role="after">
      Create state, one Service, return from state.
    </file>
    <file path="after-step.js" role="after">
      Redirect* Step that throw redirect on the index path.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-loader.js](before-loader.js) | Path if + redirect in the route try |
| [after-loader.js](after-loader.js) | Thin loader |
| [after-step.js](after-step.js) | Redirect* `throw redirect` |

Live canonical: `accounts.$accountId.jsx` + `redirect-account-layout-index.js`. Periods sibling: `redirect-periods-index-to-user-group.js`.
