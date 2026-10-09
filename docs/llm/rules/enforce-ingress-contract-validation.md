# enforce-ingress-contract-validation

## Rule id

`steps-pattern/enforce-ingress-contract-validation`

## Intent (from ESLint rule)

Controller and Module entry methods must call `Validator.validate` or `Validator.validateParsed` (Zod) before orchestration — the same ingress contract Agents use.

## When this rule applies

- Static async methods on `*Controller` classes under `**/controllers/**` that take at least one non-`_`-prefixed parameter.
- Static async methods on Module classes under `**/modules/**` (and worlds `widget-module`) that take at least one non-`_`-prefixed parameter.

## What triggers

The method body has no `Validator.validate(...)` or `Validator.validateParsed(...)` call.

## What this rule does not enforce

- Zero-arg methods (no ingress payload)
- Route/loader files (Router stays thin; validation lives on the Controller)
- How strict the schema is — only that `Validator.validate` / `validateParsed` is explicit at the boundary
- Mid-flow required-value / entity-existence asserts inside Steps / Strategies / Services / Modules — those use **`Preconditions.errr().debug().test()`**, not Zod. See [`enforce-if-throw-use-precondition.md`](enforce-if-throw-use-precondition.md).

## Validator contract (identity vs clone)

`Validator` has two methods. Controllers/Modules exist to fail-fast so Steps do not grow `if (x)` guards — **not** to reshape domain objects.

| Method | On success returns | Use when |
| :--- | :--- | :--- |
| `validate(schema, value, debug)` | **the same `value` reference** | Default. State bags, Remix `args`, domain models (`Account`), SQS payloads kept as the original object. |
| `validateParsed(schema, value, debug)` | Zod's `parsed.data` clone | Opt-in when you need the DTO clone (MCP tool-arg Controllers, or SQS schemas with `.preprocess` / coerce). |

Never treat Zod's clone as a domain model. Do **not** coalesce `null` → `{}` (`?? {}` / `|| {}`) inside `Validator.validate` / `validateParsed` — the lint rule bans that. Do not use `.transform` / `.coerce` / `.default` on Controller/Module schemas unless you intentionally call `validateParsed`.

### Ingress by trigger (path / body equivalents)

| Trigger | What to validate | API |
| :--- | :--- | :--- |
| Remix HTTP | path params if present; body if present (parse once → state); else request-exists (`z.custom` Request) | `validate` |
| SQS / S3 | payload/record = body; require `type` / required keys | `validate` unless schema uses `.preprocess` / coerce → then **`validateParsed`** |
| Chrome message | payload = body; no coalesce into Validator | `validate`; empty-ok: schema accepts `undefined\|null\|object`, State fallback after validate |
| Host State (agent-runtime) | extract required fields from state into a plain DTO and validate | `validate` |
| MCP tool args | tool-arg DTO clone | `validateParsed` |
| Zero-arg | explicit no-payload check | `Validator.validate(z.object({}), {}, { method })` |

## Correct fix (checklist)

1. Define a Zod schema for the ingress payload, options object, or State bag. Flow-phase Module methods use shared **`stateSchema`** from the package `validator.js` (identity-preserving object check — Maddox stubs need not implement `accept`). Remix `request` uses `z.custom` (not `z.object().passthrough()`).
2. Call `const normalized = Validator.validate(schema, ingress, debug)` on its own line inside `try` (or `validateParsed` for tool-arg/DTO clones / preprocess). Pass the raw value — do **not** coalesce `null` → `{}`.
3. For Modules that construct their own State: validate options/context first, then `new *State(normalized)`.
4. For flow-phase Modules that receive caller State: `Validator.validate(stateSchema, state, { method })` before the accept chain.
5. Follow the ingress table above for path/body equivalents per trigger type.
6. For missing tool args with `validateParsed`, prefer `z.preprocess((v) => (v == null ? {} : v), schema)` over `toolCall?.args || {}` at the call site.

## What good looks like

```js
static async run(payload, context = {}) {
  const { messageId, body } = context;
  try {
    // validate returns the same payload reference (identity).
    const normalized = Validator.validate(payloadSchema, payload, { messageId });
    const state = new WidgetState(normalized);
    await WidgetService.run(state);
    return state.getResult();
  } catch (err) {
    // Errr wrap…
  }
}
```

```js
import { Validator, stateSchema } from "../validator.js";

static async getAccounts(state) {
  try {
    Validator.validate(stateSchema, state, { method: "getAccounts" });
    await state.accept(GetPublicAccounts);
    await state.accept(SaveAccounts);
    return state;
  } catch (err) {
    // Errr wrap…
  }
}
```

```js
// Tool-arg Controllers that need Zod's DTO clone:
const args = Validator.validateParsed(toolArgsSchema, toolCall?.args || {}, {
  toolName: toolCall?.name,
});
```

## Do not

```js
static async run(payload, context = {}) {
  const state = new WidgetState(payload);
  try {
    await WidgetService.run(state);
    return state.getResult();
  } catch (err) {
    // …
  }
}
```

Do not use `Preconditions` for Controller/Module ingress — that is Step-local; Controllers and Modules use `Validator` + Zod.

Do not use `validateParsed` (or return `parsed.data`) for domain models / State bags / Remix `Request` — that clones and strips prototype getters.

## Related docs

- `docs/llm/lint-fixes/enforce-ingress-contract-validation/`
- `docs/llm/rules/enforce-maddox-validation-coverage.md`
- `docs/llm/rules/enforce-if-throw-use-precondition.md` (Preconditions for Step-local invariants; Zod stays here)
- `.cursor/rules/steps-pattern/backend-controllers.mdc`
- `.cursor/rules/steps-pattern/backend-modules.mdc`
