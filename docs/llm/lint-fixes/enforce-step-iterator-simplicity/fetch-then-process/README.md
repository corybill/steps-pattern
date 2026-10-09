# Fetch then process

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-iterator-simplicity</rule-id>
    <slug>fetch-then-process</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Step iterator awaits a Proxy (for-week fetch+flatten, or
    map(async … await S3Proxy)). The lint flags the Proxy await in the iterator.
  </problem>

  <when>
    Items are independent reads: Partner week stats / projections, a
    pair of S3 presigns per document, or bounded Billing year HTML
    GETs (season / season+1 / season+2). Flatten/metrics/bulk upsert
    or in-memory HTML regex parse can run after every payload is in
    memory. Attach-only (spread rawDoc + urls) can stay in the same
    Fetch Step. N is bounded (a season of weeks, a few years, a
    account's policy files — not an unbounded crawl).
  </when>

  <decision>
    Race independent reads with Promise.all of Proxy.method().then(...)
    (no await inside map/for). When flatten/metrics/persist follow, put
    that in a Process Step. When the Step only attaches URLs onto raw
    docs, keep attach in the same Fetch Step.
  </decision>

  <thought>
    A Module per week, year, or PDF is ceremony when the per-item body is
    one GET or two independent presigns. Flatten the Fetch Step then the
    Process Step on the Service (accept Fetch, accept Process). Promise.all
    is the right fan-out only when the iterator itself does not await.
    extract-loop-outbound-into-module is for download+cheerio+another IO
    or authorize+write sequences. Do not Promise.all Bedrock embed batches
    or sequential memory-sensitive week stamps that must stay serial.
  </thought>

  <do>
    1. Build the week/id list in memory (no await).
    2. Fetch Step: await Promise.all(items.map(item =&gt; Proxy.method(...).then(...))).
       Dual presigns: Promise.all([sign(key), sign(companion)]).then(...).catch(fail-open).
    3. state.setFetched...(payloads) or set the attached list when there is
       no flatten/persist (GetAccountDocumentDownloadUrls).
    4. Process Step only when flatten, metrics, or HTML regex parse
       run after the race. Service accept chain: Fetch then Process.
    5. One upsertManyBatches / upsertOnSync after the process loop.
    6. Fail-open (.catch): set swallowed: true on those fixture outbounds
       so generate emits continue-its. Promise.all siblings are asserted
       when they share a parallelGroup.
  </do>

  <do-not>
    Do not write await Proxy inside map(async () =&gt; ...). That still fails.
    Do not persist per week inside the process loop.
    Do not use this recipe for embed batching or cheerio/S3 HTML
    download+parse blobs (that is extract-loop-outbound-into-module).
    Independent year HTML GETs + in-memory regex parse belong here.
  </do-not>

  <live-canonical>
    lambda-worker/src/steps/fetch-records.js
    lambda-worker/src/steps/process-records.js
    lambda-worker/src/steps/fetch-forecasts.js
    lambda-worker/src/steps/process-forecasts.js
    ui/app/server/steps/get-account-document-download-urls.js
    ui/app/server/steps/domains/get-billing-upload-urls.js
    browser-extension/src/steps/fetch-my-accounts-html.js
    browser-extension/src/steps/discover-billing-data.js
    browser-extension/src/services/billing-sync-service.js
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      for-await fetchWeek then flatten in one Step.
    </file>
    <file path="before-presign.js" role="before">
      map(async … await S3Proxy) — still a loop await.
    </file>
    <file path="after-fetch.js" role="after">
      Promise.all of fetchWeek().then — no inner await.
    </file>
    <file path="after-process.js" role="after">
      In-memory flatten, then one bulk upsert.
    </file>
    <file path="after-presign.js" role="after">
      Dual S3 presigns via Promise.all + .then/.catch — no inner await.
    </file>
    <file path="after-html-fetch.js" role="after">
      Billing year GETs via Promise.all + .then/.catch — no inner await.
    </file>
    <file path="after-html-process.js" role="after">
      In-memory regex parse of fetched year HTML.
    </file>
    <file path="after-html-service.js" role="after">
      Service flattens Fetch then Process.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | Week loop awaits the Proxy then flattens |
| [before-presign.js](before-presign.js) | `map(async … await S3Proxy)` |
| [after-fetch.js](after-fetch.js) | `Promise.all` + `.then` (no inner `await`) |
| [after-process.js](after-process.js) | Flatten + bulk persist |
| [after-presign.js](after-presign.js) | Dual S3 presigns + fail-open attach |
| [after-html-fetch.js](after-html-fetch.js) | Billing year GETs + fail-open `.catch` |
| [after-html-process.js](after-html-process.js) | In-memory regex parse |
| [after-html-service.js](after-html-service.js) | Service `accept` Fetch then Process |

Live canonical: `FetchRecords` / `ProcessRecords` (same split for projections). Attach-only: `GetAccountDocumentDownloadUrls`. Billing year pages: `FetchMyAccountsHtml` / `DiscoverBillingData` on `BillingSyncService.discoverBillingData`.
