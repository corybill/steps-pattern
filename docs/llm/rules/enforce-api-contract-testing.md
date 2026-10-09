# enforce-api-contract-testing

## Rule id

`steps-pattern/enforce-api-contract-testing`

## Intent (from ESLint rule)

When a Remix route spec **paints** the leaf UI, every `/api/*` URL discovered from that route’s front-end graph must be stubbed with the **real** API route module (`import * as ApiXNs from "@/routes/api.…jsx"` + `.addStub({ path, module: ApiXNs })`).

The rule does **not** apply to:

- Empty placeholders (no RemixScenario yet)
- Specs that never call `.triggerRender()` or `.render()`

Those files do not mount the component that issues the fetch. Painted route specs still must stub.

## When this rule applies

Enabled on Remix route specs via `maddoxSpecs({ remix: true })` (`*.spec.jsx` that map to `app/routes/<name>.jsx`). Discovery walks the route file’s front-end imports (`findApiUrls`).

## Correct fix (checklist)

1. Confirm the spec actually paints (`triggerRender` / `.render()`). If it does not, this rule should stay silent — do not invent a dummy scenario just to host stubs.
2. For painted specs: add real-module `addStub`s (namespace import from `app/routes/api.*.jsx`).
3. Never stub with a mock object (`module: { action() {} }`).
4. Do not run `maddox:generate` (removed).

## Don't

```javascript
// Empty compiler placeholder — do not bootstrap a fake RemixScenario
// just to silence this rule. Generate writes the chain when the pack is fillable.

// Painted spec with a fake module:
.addStub({ path: "/api/sync", module: { action: () => ({}) } })
```

## Do

```javascript
import * as ApiSyncNs from "@/routes/api.sync.jsx";
import * as ApiUsersNs from "@/routes/api.users.jsx";

new RemixScenario(this)
  .addStub({ mockName: "FixtureRoute", path: "/accounts", module: context.stubModule })
  .addStub({ mockName: "ApiSync", path: "/api/sync", module: ApiSyncNs })
  .addStub({ mockName: "ApiUsers", path: "/api/users", module: ApiUsersNs })
  .triggerRender()
```

## Related docs

- Discovery: `lib/rules/enforce-api-contract-testing.js` (`findApiUrls`)
- Authoring: `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
