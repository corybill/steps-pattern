# Lint-fix recipes (steps-engineer)

When a `steps-pattern/*` lint is fixed by an **architectural decision** (not a rename / `beforeEach` reorder / missing wrap `it`), record that decision as a recipe under `packages/steps-pattern/docs/llm/lint-fixes/`.

Lint messages that already have recipes include a `Fixes:` line pointing at `docs/llm/lint-fixes/<rule-short-id>/`. Open that index, reuse an existing Command (Step), Strategy, or Module method — or **name the Gang of Four pattern** (`packages/steps-pattern/docs/llm/framework/gang-of-four.md` in the holding repo) — then pick a recipe. A collection of helpers is not a recipe. How to fix: `packages/steps-pattern/docs/llm/lint-fixes/enforce-no-forbidden-words/`. After you invent a *new* way to fix the same rule, add another recipe directory — do not overwrite the old one. Put the pattern name in the recipe’s `<pattern>` tag.

## Not the anti-pattern inbox

| Store | What it captures | Who writes |
| :--- | :--- | :--- |
| `anti-patterns/inbox/` | Redacted fail→pass *shapes* (promotion fodder) | Every lint-fix pass |
| `docs/llm/lint-fixes/` | *Why we chose this structural fix*, with teaching files | steps-engineer when the fix is a decision |
| `specs/worlds/mutations/` | Lint goldens | `/promote-anti-patterns` only |

You still record fail→pass observations. A recipe is extra, and only for decisions.

## When to record

**Record** if you: extracted a module, split a fat step, moved a mock boundary, introduced a strategy dispatcher, or chose the temporary debt marker instead of extracting.

**Skip** if you: renamed `context.*Params`, reordered `setup*` calls, added a `doesErrorWithPromise` sibling, or fixed a one-line naming / one-line getter lint.

If you are unsure, record. Duplicate recipes are easier to delete than a lost decision.

## How to record

1. Read `packages/steps-pattern/docs/llm/lint-fixes/README.md` in the holding repo (layout + XML template).
2. Reuse an existing recipe when the decision is the same (cite it in the chat; do not copy-paste a second directory).
3. Otherwise create `docs/llm/lint-fixes/<rule-short-id>/<recipe-slug>/README.md` as the XML prompt.
4. Put distilled before/after teaching files next to the prompt. **No `@agent-dossier`** on those files.
5. Cite the live canonical path in `<live-canonical>` — do not vendor a production file that will drift.
6. Add the row to the catalog table and the rule-level `README.md`.
7. First recipe for a rule: set `lintFixes` on that key in `docs/llm/manifest.json`. Wrap **every** `context.report` for that rule with `withLintDocs` so **every** ESLint failure includes `Fixes: steps-pattern/docs/llm/lint-fixes/<rule-short-id>/`.
8. Note the Unreleased CHANGELOG under `docs/llm/` if the recipe teaches a new decision class.

## Command

`/record-lint-fix [rule-id] [recipe-slug]` — run the steps above for one decision. Default slug is a kebab of the decision (`collapse-caller-mock-surface`), not the file you touched.
