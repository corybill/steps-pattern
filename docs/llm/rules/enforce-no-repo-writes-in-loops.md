# enforce-no-repo-writes-in-loops

## Rule id

`steps-pattern/enforce-no-repo-writes-in-loops`

## Intent (from ESLint rule)

Forbid repository write calls inside loops in Steps and Strategies so persistence is **collect-then-bulk**. This rule is a **layer-boundary** check only: it does not parse SQL and does not require a specific Prisma API. The **repository** must still implement that bulk method as **one parameterized SQL upsert/update** (or `createMany`/`updateMany`), not a relocated `for` + `prisma.upsert()`. See `.cursor/rules/steps-pattern/backend-steps.mdc` and `backend-repositories.mdc`.

## When this rule applies

Enabled on `/steps/` and `/strategies/` globs via `stepsLayers()` in `steps-pattern/eslint-config`. Repository files are intentionally excluded — chunk loops, `$transaction`, and `unnest()` SQL belong there.

## What triggers

- A binding imported from a path containing `/repositories/` or ending in `-repo`
- A write method matching `/^(upsert|insert|update|delete|create|save|replace|write|remove)/i`
- Inside `for` / `while` / `do...while`, or an array iterator callback (`map`, `forEach`, …), or a same-file helper that writes and is called from a loop

## What this rule does not enforce

- How `upsertMany` / `saveAll` is implemented. A Step that calls `SomeRepo.upsertMany(rows)` once will pass even if the repo loops Prisma `upsert()` internally — that still fails the repository contract in `backend-repositories.mdc`.
- Reads, HTTP proxy fetches, or in-memory transforms inside loops.

## Correct fix (checklist)

1. Collect rows in memory inside the loop (pure transforms / reads / outbound fetches only).
2. Call **one** bulk repository method outside the loop (`upsertMany`, `upsertAll`, `saveAll`, `replaceAllForAccounts`, …).
3. If no bulk method exists, add it on the repository as **parameterized** `INSERT … unnest($1::type[], …) ON CONFLICT … DO UPDATE` (or `UPDATE … FROM unnest(...)`). Do not wrap per-row Prisma `upsert()`.
4. Do not `eslint-disable` this rule.

## What good looks like

```js
const rows = items.map((x) => toRow(x));
await SomeRepo.upsertMany(rows);
```

Repository (required shape — not linted by this rule):

```js
await prisma.$executeRawUnsafe(`
  INSERT INTO "SomeTable" ("id", "value")
  SELECT * FROM unnest($1::text[], $2::int[]) AS batch("id", "value")
  ON CONFLICT ("id") DO UPDATE SET "value" = EXCLUDED."value";
`, ids, values);
```

## Do not

- Do not await per-row `upsert` / `save` / `update` / `delete` inside a loop in a Step or Strategy.
- Do not hide per-row writes in a same-file helper that is still called from a loop.
- Do not move N+1 writes into a Strategy to dodge the Step glob — strategies are linted too.
- Do not treat a repo `for (item of items) prisma.upsert(item)` as bulk. The Step linter will be silent; the write is still N+1.
- Do not interpolate values into `$executeRawUnsafe` SQL strings (`VALUES ('${id}', …)`). Use `$1` bind parameters.

## Related docs

- `docs/llm/framework/layers-services-modules-steps.md`
- `.cursor/rules/steps-pattern/backend-steps.mdc`
- `.cursor/rules/steps-pattern/backend-repositories.mdc`
