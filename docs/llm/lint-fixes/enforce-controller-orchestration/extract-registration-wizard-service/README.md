# Extract registration wizard service

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>extract-registration-wizard-service</slug>
    <preference>preferred</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    Several registration loaders branch on registrationStage (and
    sometimes pathname or stay-path payload). The rule forbids IfStatement
    and non-State VariableDeclaration inside the route try.
  </problem>

  <when>
    The same funnel bounce exists on more than one route, the stay path
    also computes loader data, or a layout must compare pathname to a
    stage route. map-key-to-throw-redirect is enough for one isolated
    key → throw redirect. Use this when that map is copied or is not
    enough.
  </when>

  <decision>
    One RegistrationWizardService. Child loaders call enforceStage.
    The layout calls enforceLayout. Processing calls loadProcessing
    then returns from state. Steps may if / throw redirect.
  </decision>

  <thought>
    A throw-function map keeps a single file lint-clean. Copying it
    across registration.extension / partner-sign-in / billing /
    processing / the layout hides the funnel in five places.

    The rule's real intent is: redirects belong in a Step; the route
    creates state, calls one Service, returns from state.
  </thought>

  <do>
    1. Add RedirectWrongRegistrationStage (child path + stage → redirect).
    2. Add RedirectToRegistrationStageRoute (layout pathname vs stage).
    3. Add BuildProcessingLoaderData when the stay path has payload.
    4. RegistrationWizardService.enforceStage / enforceLayout / loadProcessing.
    5. Each loader: const state = new RegistrationWizardState(args);
       await RegistrationWizardService.&lt;method&gt;(state); return from state.
  </do>

  <do-not>
    Do not leave if (stage === …) throw redirect in the route try.
    Do not invent a Service per child route.
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/server/services/registration-wizard-service.js
    ui/app/routes/registration.jsx
    ui/app/routes/registration.processing.jsx
  </live-canonical>
</lint-fix-recipe>
```
