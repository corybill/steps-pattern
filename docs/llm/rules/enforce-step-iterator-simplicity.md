# enforce-step-iterator-simplicity

## Rule id

`steps-pattern/enforce-step-iterator-simplicity`

## Intent (from ESLint rule)

Fail when a Step `next` loop awaits a Proxy/Repository outbound, or contains 2+ non-`Module.method` awaits. Move per-item outbound into a Module; batch Steps may loop `await Module.method(...)` only. See `.cursor/rules/steps-pattern/backend-modules.mdc`.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-step-iterator-simplicity` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`). Severity is **error**.

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Infer the **architectural** intent (orchestration vs business logic, test contract, layer access, etc.).
3. If the message has a **Fixes:** line, open that recipe index and pick **extract-loop-outbound-into-module**, **fetch-then-process**, or **keep-sequential-embed-batches**.
4. Refactor code or tests to satisfy the rule without weakening guarantees.

## What good looks like

**Don't** — Proxy await inside a Step `for`:

```js
for (const transactionId of ids) {
  await PartnerGraphqlProxy.acceptSale(token, { transactionId });
}
```

**Do** — batch Step loops `Module.method`; Module accepts per-item Steps:

```js
for (const transactionId of ids) {
  await PartnerSaleWriteModule.acceptOne({ transactionId, /* ... */ });
}
```

In-memory loops (no outbound await) are fine. Nested `Promise.all` callbacks are not walked by this rule (parallel-read fan-out is a separate concern).

**Don't** — fetch + flatten in one week `for`:

```js
for (let week = weekStart; week <= weekEnd; week++) {
  const fetched = await PartnerStatsProxy.fetchWeek({ season, week }) ?? [];
  batches.push(flatten(fetched));
}
```

**Do** — fetch Step races `Promise.all` with no inner `await`; process Step flattens in memory:

```js
const fetched = await Promise.all(
  weeks.map((week) =>
    PartnerStatsProxy.fetchWeek({ season, week }).then((rows) => ({ week, rows: rows ?? [] }))
  )
);
```

**Don't** — `map(async … await Proxy)` (still a loop await):

```js
await Promise.all(
  documents.map(async (doc) => ({
    ...doc,
    url: await S3Proxy.getDownloadUrl(doc.storageKey),
  }))
);
```

**Do** — race the pair with `.then` / `.catch` (no inner `await`); attach stays in the Fetch Step:

```js
await Promise.all(
  documents.map((doc) =>
    Promise.all([
      S3Proxy.getDownloadUrl(doc.storageKey),
      S3Proxy.getDownloadUrl(companionKey),
    ]).then(([url, markdownUrl]) => ({ ...doc, url, markdownUrl }))
  )
);
```

**Don't** — season GET plus `map(async … await Proxy)` for other years (still a loop await):

```js
const htmlText = await BillingProxy.getMyAccountsHtml(season);
await Promise.all(
  years.map(async (year) => {
    const html = year === season ? htmlText : await BillingProxy.getMyAccountsHtml(year);
    accountsByYear[year] = parseAccountIds(html);
  })
);
```

**Do** — Service accepts Fetch then Process. Fetch races `.then` / `.catch` (no inner `await`); Process parses in memory:

```js
await state.accept(FetchMyAccountsHtml);
await state.accept(DiscoverBillingData);
```

Recipes: [`lint-fixes/enforce-step-iterator-simplicity/`](../lint-fixes/enforce-step-iterator-simplicity/).

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without a matching recipe. The only accepted disable is a sequential Bedrock Titan `embedContents` batch loop ([keep-sequential-embed-batches](../lint-fixes/enforce-step-iterator-simplicity/keep-sequential-embed-batches/)), scoped to that `for`, with the rationale in the file `@agent-dossier`.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
