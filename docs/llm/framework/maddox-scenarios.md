# Maddox — scenario tests (shared)

## What Maddox is used for

[Maddox](https://github.com/corybill/maddox) **FromPromiseScenario** (or project-specific `Scenario` alias) is used to write **declarative** async tests: mock outbound collaborators, call an entry point with `withInputParams`, assert call shapes and return/error behavior.

This guide summarizes conventions enforced or encouraged by `steps-pattern/enforce-maddox-*` rules. app’s long-form rules live in `.cursor/rules/maddox-scenario-tests.mdc` and layer-specific `maddox-*-scenario-tests.mdc` files.

## Core conventions

1. **Import Maddox** (`import Maddox from "maddox"`) or equivalent so rules that track `usesMaddox` apply.
2. **Scenario chain order** — Mocks → entry (`withEntryPoint`, `withInputParams`) → expectations (`shouldBeCalledWith`, `doesReturn*`, `doesError*`) → `test` / `catch`. Blank lines between groups where rules require spacing (`enforce-maddox-scenario-order`).
3. **Route/controller specs** — `.withInputParams(context.inputParams)` only; build values in `setupInputParams` (`enforce-maddox-scenario-order` strict paths).
4. **Coverage** — Each mocked function needs a **happy path** and an **error** path in the suite (`enforce-maddox-coverage`).
5. **Boilerplate** — `shouldBeCalledWith` / `doesReturn*` / `doesError*` last argument patterns must use **`context.*`** with correct suffixes (`enforce-maddox-boilerplate`).
6. **Chain formatting** — Keep each scenario method’s **argument parentheses on one line** (`enforce-maddox-scenario-chain-one-line`); accept autofix when offered.
7. **Route/controller specs** — Do **not** `mockThisFunction` **services**; mock proxies, modules, repositories so services and steps run for real (`enforce-no-service-mock-in-route-controller-spec`).

## Do not

- `eslint-disable` Maddox rules to land a scenario that skips error cases or wrong mock layers.
- Use `PostgresProxy` in Maddox mocks — mock **repository / entity** classes instead (`enforce-maddox-boilerplate` / team convention).
- Put random logic inside `it()` bodies beyond setup calls, setup overrides, and the Scenario chain (`enforce-maddox-boilerplate`).
- Use `.shouldBeCalledWithSubset`, `Maddox.compare.subset`, or `.shouldBeSubset` (`enforce-no-maddox-should-be-called-with-subset`) or `IgnoreParam` / `IgnoreParams` (`enforce-no-maddox-ignore-param`). Always `.shouldBeCalledWith` with a full `context.*Params` array. Error wrap/cause checks use `Maddox.compare.containsError(err, expected)` only.
- Generate a new spec from prose. Clone a lint-clean sibling first (`~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`).

## Related in this package

- [`maddox-before-each.md`](maddox-before-each.md) — setup function order and cardinality.
- [`maddox-module-specs.md`](maddox-module-specs.md) — module-specific describe layout and coverage.
