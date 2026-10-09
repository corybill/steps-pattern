# enforce-state-getter-setter-structure

## Rule id

`steps-pattern/enforce-state-getter-setter-structure`

## Intent (from ESLint rule)

Enforce that state file getter/setters are on one line and in alphabetical order.

Applies when the file path includes `src/state/` **or** the class `extends State`. UI `app/server/state/` files are covered when they extend `State`. The base `State` class (does not extend `State`, and is not under `src/state/`) is **not** path-matched.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-state-getter-setter-structure` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Put each `getX` / `setX` method on a **single line**.
2. Order all `get*` / `set*` methods **alphabetically** by method name.
3. Do not add `isDone`, `setDone`, `getError`, or `setError` (product contract; not this rule’s AST check).

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.

## Related docs

`.cursor/rules/steps-pattern/backend-state.mdc`
