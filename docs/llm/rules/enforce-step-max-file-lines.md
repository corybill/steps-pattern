# enforce-step-max-file-lines

## Rule id

`steps-pattern/enforce-step-max-file-lines`

## Intent (from ESLint rule)

A Step source file must not exceed **250** physical lines (configurable `max`; target **180**). Split into sibling Steps and flatten in the Service or Module. When a collection exists, put one item on a Module method. See `.cursor/rules/steps-pattern/backend-steps.mdc`.

## When this rule applies

Enabled on Step globs via `stepsLayers()` (`app/server/steps/**/*.js` or `src/steps/**/*.{js,ts}`). Severity is **error**. Count is editor-visible physical lines (`sourceCode.lines`, trailing empty line from a final newline stripped). Comments and blanks count.

## Correct fix (checklist)

1. Read the ESLint message and the reported file.
2. Name the Gang of Four pattern ([`gang-of-four.md`](../framework/gang-of-four.md)). Do not invent `_helpers` to land under the cap.
3. Open **Fixes:** and pick **one** path:
   - **split-into-sequential-steps** — no collection; **Template Method**: cut phases into sibling Commands (Steps). `acceptAll` independent phases; sequential `accept` only when a later Step reads an earlier write.
   - **extract-loop-into-module** — looping; **Iterator** + **Composite**: move the looped body onto a Module method with **two or more** Steps.
3. Keep the original file thin (or delete it if it becomes an empty shell). Do not silence with `eslint-disable`.

## What good looks like

**Don't** — one Step owns load, score, and write (no loop):

```js
class CalculateEngineSummaries {
  static async next(state) {
    const rows = await CalculateEngineSummaries._loadProjections(state);
    const scored = CalculateEngineSummaries._score(rows);
    await CalculateEngineSummaries._writeSummaries(scored);
  }
}
```

**Do** — sibling Steps, parallel-first (`acceptAll` is `Promise.all`):

```js
await state.acceptAll([LoadMarketRows, LoadEngineRows]);
await state.accept(JoinValuationRows);
await state.acceptAll([WriteSummaries, WriteAuditLog]);
```

**Don't** — `next` loops a same-file helper (~400 lines):

```js
await Promise.all(accounts.map((account) =>
  ApplyEngineValuations._processAccount({ state, account })
));
```

**Do** — batch Step loops a multi-step Module:

```js
await Promise.all(accounts.map((account) => Module.method({
  moduleKey: "EngineValuationsModule.processAccount",
  run: EngineValuationsModule.processAccount
}, { account })));
```

Recipes: [`lint-fixes/enforce-step-max-file-lines/`](../lint-fixes/enforce-step-max-file-lines/).

## Do not

- Do not add `eslint-disable` to keep a fat file.
- Do not move the same body into a same-file `_helper` and call that a split — the file is still over `max`.
- Do not delete comments solely to sneak under the cap. Split the work.
- Do not put the collection loop inside the Module.

## Related docs

Follow `.cursor/rules/steps-pattern/backend-steps.mdc` and `backend-modules.mdc`.
