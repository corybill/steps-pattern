# enforce-no-step-mock-in-maddox-test

## Rule id

`steps-pattern/enforce-no-step-mock-in-maddox-test`

## Intent (from ESLint rule)

Maddox scenario tests must not `mockThisFunction` a module imported from a `/steps/` path. Mock **proxies**, **modules**, and **repositories/entities** so the Step (and Service) under test run for real.

## When this rule applies

Enabled on spec globs in `maddoxSpecs()` unless a package explicitly turns it off (legacy exception: document-processor `lambda.spec` — do not copy that pattern).

## Correct fix (checklist)

1. Find `.mockThisFunction(...)` whose third argument (or resolved import) lives under `/steps/`.
2. Delete that mock. Trace the Step and mock the **entity / proxy / module** it calls instead.
3. Put `Params` / `Response` / `Error` on a middle setup helper named for that outbound call.

## What good looks like

```javascript
import PartnerProxy from "../../src/proxies/partner-proxy.js";
import { FetchAccount } from "../../src/steps/fetch-account.js";

new Scenario(this)
  .mockThisFunction("PartnerProxy", "fetchAccount", PartnerProxy)
  .withEntryPoint(FetchAccount, "next")
  .withInputParams(context.inputParams)
  .shouldBeCalledWith("PartnerProxy", "fetchAccount", context.partnerProxyFetchAccountParams)
```

## Do not

- Do not mock `SomeStep.next` to “simplify” a route or module spec.
- Do not `eslint-disable` this rule for new specs.
- Do not clone `document-processor` `lambda.spec` as a template.

## Related docs

- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
- `.cursor/rules/steps-pattern/maddox-scenario-tests.mdc`
