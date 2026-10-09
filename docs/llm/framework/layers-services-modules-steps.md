# Layers — services, modules, steps, proxies, repositories

## Service (`/services/`)

- **Role:** Orchestrate steps only inside `static async method(state)` (or equivalent contract your config enforces).
- **Body:** Typically a single `try/catch`: inside `try`, only `await state.accept(Step)` / `acceptAll`, optional `state.set*` / logging / preconditions / variable declarations; in `catch`, wrap with **Errr** (`.throw()` or `.get()` per rule). **No `if` / `else` / loops** in the try body (`enforce-service-orchestration`).
- **Parallel-first:** `acceptAll` is `Promise.all`. Race every sibling Step that does not read another's writes. Sequential `accept` is a data-dependency barrier, not the default.
- **Do not:** Put branching or skip gates in the service; move them into Call Steps, Dispatch Steps, Strategies, or ingress method selection.

## Module (`/modules/`)

- Same orchestration role as services: **flat** `accept` / `acceptAll` of **steps**. Flow-phase methods take the caller’s `state`; iterated APIs may take an options object. Same parallel-first rule. Callers that iterate the Module `Promise.all` independent items.
- **Min steps (warn):** A Module method that accepts fewer than **two** Steps warns (`enforce-module-min-steps`). One-step methods are ceremony.
- Sibling-module or same-module calls are **not** legal in the module try body (`await OtherModule.foo(state)` is not on the ESLint allowlist). Put those behind a Call Step or a batch Step loop (`Module.method`).
- Same **try/catch + Errr** and **flat try body** (no `if` / loops) where `enforce-service-orchestration` applies.

## Step (`/steps/`)

- **Exported** step classes must expose **`static async next(state)`** (or `_state`) with **try/catch** and **Errr** in the catch (see `enforce-step-structure`).
- **No return values** from `next` — write results into **state** (see rule messages).
- **File length:** A Step source file over **250** physical lines is an **error** (`enforce-step-max-file-lines`; option `max`, target **180**). Split with a named Gang of Four pattern ([`gang-of-four.md`](gang-of-four.md)): sibling Commands on a Template Method, or Iterator + Composite (Module = one item). Same-file `_helpers` do not shrink the file.
- **Loops:** A Step must not loop a same-file function (`enforce-no-step-loop-internal-function`). A Step `next` loop that awaits a Proxy/Repository, or contains **2+** non-`Module.method` awaits, is an **error** (`enforce-step-iterator-simplicity`). Move per-item outbound into a Module; the batch Step `Promise.all`s `Module.method(...)` (or `Module.method`) for independent items. Serial `for-await` only for shared mutation / rate-limit.
- **Repository writes in loops:** **Error** (`enforce-no-repo-writes-in-loops`) if a Step or Strategy calls a repository write (`upsert*`, `save*`, `update*`, `delete*`, …) inside any loop, array iterator, or same-file helper called from a loop. Collect rows, then call one bulk repository method outside the loop. The bulk method itself must be parameterized SQL in the repository (`unnest($1::type[], …)` / `ON CONFLICT`), not a Prisma `upsert()` loop — see `backend-repositories.mdc`.

## Proxy (`/proxies/`)

- Methods (non-constructor) should use **try/catch** and **Errr** (`enforce-proxy-structure`).

## Repository (`/repositories/`)

- File names map to Prisma models: `<kebab-model>-repo.{js,ts}` (`enforce-repository-model-mapping`).
- **Prisma / PostgresProxy** imports are restricted to repositories (and related exemptions) via `enforce-architectural-layer-access`.
- **Bulk writes:** one (or chunked) **parameterized** `INSERT … unnest($1, …) ON CONFLICT` / `UPDATE … FROM unnest(...)`. A `for` + Prisma `upsert()` is still N+1 even if the Step only calls the method once. Do not interpolate values into SQL strings.

## Controllers & routes

- **Controllers (`/controllers/`):** Static async methods create State (when ingress), call a **service method with the same name** inside try/catch, Errr + log in catch (`enforce-controller-orchestration`). UI Remix Controllers take Remix `args`; sync Controllers take payload/context.
- **Zod ingress (required):** Controllers (and Module methods with ingress params) call `Validator.validate(schema, ingress, debug)` on its own line inside `try` before State/Service orchestration (`enforce-ingress-contract-validation`). Throw contract is `"Validation Error"`. Do **not** use Preconditions for Controller/Module ingress. Remix `request` uses `z.custom` (not `z.object().passthrough()`); flow-phase Module state bags use shared **`stateSchema`**.
- **Trusted-pipeline invariants:** Steps / Strategies / rare Service/Module mid-flow required-value checks use **`Preconditions.errr().shouldBe*(…).debug({…}).test()`** — not `if (!x) throw` (`enforce-if-throw-use-precondition`). Never Zod for those mid-flow asserts. Do not re-validate the same Controller ingress fields in Steps.
- **UI Routes (Router):** Prefer thin delegation — optional verb/path `if`, then `return *Controller.*(args)` (no State/Service/try on the route). Legacy State+Service try bodies remain legal until each route migrates. Catch requirements on the route (`enforce-route-catch-errr`) apply only when the route still has a try.
- **Ingress maps only for verb / pathname.** Body fields (`intent`) and querystring must **not** pick a Service/Controller method — use a Dispatch Step → **Module** methods and/or a Step **Strategy**. See [`routing-dispatch-choice.md`](routing-dispatch-choice.md). Controller method selection by HTTP verb or pathname is allowed; body/`intent` ladders are not (`enforce-controller-route-by-verb-or-path`).

## Do not

- Downgrade a violation by moving code to a layer that “is not linted” while breaking architecture.
- Disable orchestration rules because a method is “small” — extract a step instead.
- Map body/`intent`/querystring to Service methods at the Router or Controller.
- Extract `helpers/` / `utils/` instead of naming a Gang of Four pattern ([`gang-of-four.md`](gang-of-four.md)).
