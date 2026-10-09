# enforce-ingress-contract-validation

Controller **and Module** methods with ingress params must call `Validator.validate` or `Validator.validateParsed` before orchestration (`new *State` / Service / `state.accept`). Do not pass `payload ?? {}` / `payload || {}` into Validator.

Recipe:

- [validator-validate](./validator-validate/) — Zod + `Validator.validate` / `validateParsed` (required)

**Not this rule:** Mid-flow required-value / entity-existence asserts use Preconditions (`enforce-if-throw-use-precondition`), not Zod.
