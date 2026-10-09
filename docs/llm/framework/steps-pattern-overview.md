# Steps Pattern — overview

## What this is

The **Steps Pattern** is a backend and test architecture: **routes** and **controllers** stay thin; **services** and **modules** orchestrate **steps**; **steps** hold business logic and call **proxies**, **entities**, and **models**; **state** carries data through a flow. ESLint rules under `steps-pattern/*` encode parts of this contract.

This file is the **portable summary** shipped with the **`steps-pattern`** package. Consumer repos may also keep local rules under `.cursor/rules/` (e.g. `steps-pattern.mdc`, `backend-steps.mdc`).

## Flow (short)

1. **Route / controller** — Build or receive state, call **one service method** (never modules), return from state or redirect. No business logic; no direct DB in routes.
2. **Service / module** — `try/catch`, orchestrate with `state.accept(Step)` / `state.acceptAll`, use **Errr** in catch. **`acceptAll` is `Promise.all` — race every Step that can run together.** Sequential `accept` only when a later Step reads an earlier write. **Flat try body** — no `if` / loops (`enforce-service-orchestration`).
3. **Step** — `static async next(state)` with `try/catch`, **Errr** in catch, **no return value**; business logic; call proxies / entities / models. DB access goes through **entities**, not raw Prisma in steps.
4. **Proxy** — External I/O; methods wrapped in `try/catch` + **Errr**.
5. **Repository / entity** — Persistence boundary; Prisma / PostgresProxy live here, not in steps or services.

## Anti-patterns (global)

- **Utils / helpers / lib** as dumping grounds — `helper`, `helpers`, `util`, and `utils` paths are not allowed. Extract a **Step** (or a named `common/` / `constants/` file for labels). Recipes: [`lint-fixes/enforce-no-forbidden-words/`](../lint-fixes/enforce-no-forbidden-words/).
- **eslint-disable** on architectural rules — hides drift; prefer refactor.
- **Calling Prisma or PostgresProxy** outside repositories (and approved paths) — see `enforce-architectural-layer-access`.

## Related topics in this package

- [`layers-services-modules-steps.md`](layers-services-modules-steps.md)
- [`routing-dispatch-choice.md`](routing-dispatch-choice.md) — verb/path at Route vs body/query → Module/Strategy
- [`maddox-scenarios.md`](maddox-scenarios.md)
- [`maddox-module-specs.md`](maddox-module-specs.md)
