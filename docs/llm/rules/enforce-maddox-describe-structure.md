# enforce-maddox-describe-structure

## Rule id

`steps-pattern/enforce-maddox-describe-structure`

## Intent (from ESLint rule)

Enforce Maddox describe block naming conventions.

- **Outer** `describe`: must start with `Given ` and end with `, when`.
- **Nested** `describe`: must end with `, it`.
- Nested titles that mention `loader` must start with `calling the loader` and end with `, it`.
- Nested titles that mention `action` must start with `calling the action` and end with `, it`.

Compiler dual-spec titles (`calling the loader (generated), it`, `calling <method> (AI-driven), it`) satisfy the nested rule.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-maddox-describe-structure` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Rename the outer describe to `Given the <subject>, when`.
2. Rename inners to `calling <method>, it` (or `calling the loader (generated), it` / `calling the action (AI-driven), it`).

## Do not

- Do not add `eslint-disable` to keep a prose-only describe title.

## Related docs

`.cursor/rules/steps-pattern/maddox-scenario-tests.mdc`
