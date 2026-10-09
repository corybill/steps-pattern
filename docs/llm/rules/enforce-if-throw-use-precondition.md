# enforce-if-throw-use-precondition

## Rule id

`steps-pattern/enforce-if-throw-use-precondition`

## Intent (from ESLint rule)

Required-value / invariant checks in Steps, Strategies, Services, and Modules must use **`Preconditions.errr().shouldBe*(…).debug({…}).test()`** — not `if (!x) throw new Error(...)` / `Errr.newError(...)`.

## Ownership split (do not blur)

| Tool | Owns | Throw contract |
| :--- | :--- | :--- |
| **Zod + `Validator.validate`** | Untrusted structured payload at a **boundary**: Controllers (ingress), Parse* body Steps, Catalog / MCP tool args | `"Validation Error"` |
| **`Preconditions.errr()`** | Trusted-pipeline **invariant**: `shouldBeDefined` / `shouldBeTruthy` (etc).`.debug({…}).test()` with a named domain message + SRE debug context | Preconditions / Errr from `.test()` |

- **Never** use Validator/Zod for mid-flow required-value checks.
- **Never** replace Preconditions with Validator to silence this rule.
- This rule decides **HOW** (Preconditions vs if/throw). Sibling `no-frivolous-defensive-if` decides **WHERE** (do not implement that here; do not move late checks earlier in this pass).

See also: [`enforce-ingress-contract-validation.md`](enforce-ingress-contract-validation.md) (Zod stays at the boundary).

## When this rule applies

Files under `**/steps/**`, `**/strategies/**`, `**/services/**`, `**/modules/**` (and worlds widget module / call-http-proxy goldens).

## What triggers

An `IfStatement` whose **consequent** is only a `ThrowStatement` (or a block whose only statement is that throw), and the thrown value is `new Error(...)` or an `Errr.newError(...)` chain.

## What this rule does not flag

- HTTP short-circuits: `throw redirect(...)`, `throw new Response(...)`, `Response.json(...)`, `AgentChatHttpError` / `*HttpError`
- Throw that is the Preconditions API ending in `.test()` (allowed)
- Catch-block classification (`if (err instanceof Response) …`)
- Real domain branches: empty skip, mode/intent maps, multi-statement consequents (not “only throw”)

## Don't

```js
const manifestKey = state.getManifestKey();
if (!manifestKey) {
  throw new Error("manifestKey is required to trigger backend sync.");
}
```

## Do

```js
const preconditions = Preconditions.errr();
const manifestKey = state.getManifestKey();
preconditions
  .shouldBeDefined(manifestKey, "manifestKey is required to trigger backend sync.")
  .debug({ manifestKey })
  .test();
```

Canonical live pass: `LoadAccountDocument` — `shouldBeDefined(storageKey).debug({ storageKey }).test()`.

## Fixes

[`../lint-fixes/enforce-if-throw-use-precondition/`](../lint-fixes/enforce-if-throw-use-precondition/)
