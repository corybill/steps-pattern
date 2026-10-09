# enforce-no-vitest-mock-in-from-promise-spec

## Rule id

`steps-pattern/enforce-no-vitest-mock-in-from-promise-spec`

## Intent (from ESLint rule)

FromPromise Maddox specs must mock and assert with `mockThisFunction` / `shouldBeCalledWith`, not Vitest `vi.fn` / `vi.spyOn` / `vi.mock` / `expect`. Specs that use `RemixScenario`, `FrameworkRouteScenario`, or `ReactRouterFrameworkScenario` keep `vi` (UI remount, `crypto.randomUUID` pins). Generate-emitted `systemTime` clock pins (`useFakeTimers` / `setSystemTime` / `useRealTimers`) stay allowed. This rule does not try to tell a host-global pin from a collaborator spy in FromPromise files — backend mocks stay on Maddox.

## When this rule applies

Enabled on `maddoxSpecs()` spec globs. The rule only inspects `*.spec.js` / `*.spec.ts` files whose source contains `FromPromiseScenario` **and** does **not** mention `RemixScenario` / `FrameworkRouteScenario` / `ReactRouterFrameworkScenario`. It does **not** run on `*.spec.jsx` / `*.spec.tsx` (Remix/UI). Non-Maddox proxy/repo unit tests that never mention `FromPromiseScenario` stay exempt. Pure-function / table tests belong in `{name}.pure.spec.js` (same stem, no `maddox` / `FromPromiseScenario` import). `maddoxSpecs()` ignores `*.pure.spec.js` / `*.pure.spec.ts` so those files keep Vitest `expect`.

## Correct fix (checklist)

1. Delete `vi.fn`, `vi.spyOn`, `vi.mock`, `vi.stubGlobal`, and `expect(...)`.
2. Register the collaborator with `.mockThisFunction("Name", "method", Name)`.
3. Assert with `.shouldBeCalledWith("Name", "method", context.<name>Params)` and `.doesReturnWithPromise` / `.doesErrorWithPromise`.
4. Keep `vi.useFakeTimers({ toFake: ["Date"] })` / `vi.setSystemTime(...)` / `vi.useRealTimers()` only when the fixture pack sets `systemTime`. Prefer `DateProxy.getDateIsoString` + `mockThisFunction` when the Step can go through DateProxy.

## Don't

```javascript
import { describe, it, beforeEach, expect, vi } from "vitest";

it("should jitTriggerPartnerSync on the happy path.", async () => {
  vi.spyOn(UserSyncStatsRepo, "acquireSyncLease").mockResolvedValue(true);
  await PartnerModule.jitTriggerPartnerSync(state);
  expect(UserSyncStatsRepo.acquireSyncLease).toHaveBeenCalled();
});
```

## Do

```javascript
import { describe, it, beforeEach } from "vitest";

new Scenario(this)
  .mockThisFunction("UserSyncStatsRepo", "acquireSyncLease", UserSyncStatsRepo)
  .withEntryPoint(PartnerModule, "jitTriggerPartnerSync")
  .shouldBeCalledWith("UserSyncStatsRepo", "acquireSyncLease", context.userSyncStatsRepoAcquireSyncLeaseParams)
  .doesReturnWithPromise("UserSyncStatsRepo", "acquireSyncLease", context.userSyncStatsRepoAcquireSyncLeaseResponse)
```

FromPromise host-global pins (no Vitest):

```javascript
originalRandomUUID = globalThis.crypto.randomUUID;
globalThis.crypto.randomUUID = () => "11111111-1111-4111-8111-111111111111";
```

RemixScenario / FrameworkRouteScenario specs may keep `vi` (UI remount, crypto pins). Collaborator mocks still use `mockThisFunction`:

```javascript
const RemixScenario = Maddox.scenarios.FrameworkRouteScenario;
vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(context.fixedUuid);
```

## Do not

- Do not use `vi` as the mock layer in FromPromise specs, even for “just this one spy.”
- Do not convert a FromPromise spec to mention `RemixScenario` only to keep `vi` — pin host globals by assignment/restore, and keep collaborator mocks on Maddox.
- Do not ban `vi.useFakeTimers` / `vi.setSystemTime` / `vi.useRealTimers` — generate emits those for `systemTime`.
- Do not apply this rule to Remix route specs (`*.spec.jsx`), files that construct `RemixScenario` / `FrameworkRouteScenario` / `ReactRouterFrameworkScenario`, or `spec/app/front-end` component tests.
- Do not keep exported-helper `expect` tables in the FromPromise file — split them to `{name}.pure.spec.js` and leave the Scenario suite on Maddox.compare.

## Related docs

- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
- `.cursor/rules/steps-pattern/maddox-scenario-tests.mdc`
- `docs/llm/framework/maddox-scenarios.md`
