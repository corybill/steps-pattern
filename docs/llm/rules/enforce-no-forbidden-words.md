# enforce-no-forbidden-words

## Rule id

`steps-pattern/enforce-no-forbidden-words`

## Intent (from ESLint rule)

`helper`, `helpers`, `util`, and `utils` paths are not allowed. Those names become dumping grounds with no owner. **A helper is what you extract when you have not named a Gang of Four pattern** ([`gang-of-four.md`](../framework/gang-of-four.md)). Domain logic belongs in a **Command** — a Step (`next(state)`, write only to state) accepted by a Service or Module (Template Method). Interchangeable algorithms belong in **Strategy**, not a second helper. Labels and ordinals that have no flow ownership belong under a **named** `common/` or `constants/` file — never a synonym of helper/util.

The path scanner’s default token is `helper`. Policy still forbids `util` / `utils` / `helpers` even when the scanner has not matched them yet. Do not create those paths. Do not rename to dodge the token.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-no-forbidden-words` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the **`Fixes:`** index: [`lint-fixes/enforce-no-forbidden-words/`](../lint-fixes/enforce-no-forbidden-words/).
2. Name the Gang of Four pattern before picking a recipe. Helpers are not a pattern.
3. Pick the recipe that matches the leftover:
   - Domain compute / map / select → [extract-into-step](../lint-fixes/enforce-no-forbidden-words/extract-into-step/)
   - Ordinal / label / string map only → [constants-or-common-not-util](../lint-fixes/enforce-no-forbidden-words/constants-or-common-not-util/)
   - Same tiny function on server Step and client hook → [duplicate-across-boundary](../lint-fixes/enforce-no-forbidden-words/duplicate-across-boundary/)
4. Delete the `helper` / `util` path. Update imports. Accept the new Step from the owning Service/Module.

## What good looks like

- Sync selections left `src/lib` and became `BuildMemberSelections` + `MapMemberSelections`, accepted by `Partner.generateNewMemberSelections` / `getTransactions`. Ordinals live in `common/selection-labels.js`.
- UI `cn` left `lib/utils.js` and lives in `lib/styles` (class-name merge only — no domain).
- `yearOf` is private on `OrderBulkActionIds` and duplicated as `yearOfRow` on `use-bulk-action-run` — no shared util.

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (`helpers` → `lib`, `utils` → `shared`, `toolbox`).
- Do not extract a shared `util/` so a Step and a React hook can import the same function — duplicate the few lines.
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/steps-pattern.mdc` and `~/.cursor/skills/steps-engineer/SKILL.md` (Zero-Tolerance for Helpers/Utils). Recipes: [`lint-fixes/enforce-no-forbidden-words/`](../lint-fixes/enforce-no-forbidden-words/).
