# Extract loop outbound into a Module

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-iterator-simplicity</rule-id>
    <slug>extract-loop-outbound-into-module</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Step for-loop awaits S3/HTTP/GraphQL (or 2+ awaits) while also parsing
    or authorizing. enforce-step-iterator-simplicity forbids that mix.
  </problem>

  <when>
    The iterator body is a per-item sequence (download then parse, authorize
    then write). N may be small or large. Cheerio/HTML/JSON parse belongs
    in dedicated Steps, not nested IIFEs inside the batch Step.
  </when>

  <decision>
    Keep a thin batch Step that loops await Module.method(...).
    Put the per-item sequence on a Module with one static method per grain
    (year, account page, sale id). Each method creates module state and
    runs a flat accept / acceptAll list. No Proxy await in the batch loop.
  </decision>

  <thought>
    Promise.all of the same Proxy would silence the lint only if the
    iterator drops await — and it leaves download+parse in one Step.
    `Module.method` is the documented Do in the rule guide (RejectPartnerSales).
    Use fetch-then-process instead when the loop is only independent reads
    (week GETs or dual S3 presigns). Attach-only can stay in the Fetch Step.
  </thought>

  <do>
    1. Split the fat body into one Step per outbound or parse concern.
    2. Add a *Module with a flat accept chain per item grain.
    3. Batch Step: in-memory collect, then for (item of items) await
       Module.method(item).
    4. Merge module return slices onto parent state after each call.
    5. Controller flatten mocks the Module; Module Maddox suite mocks S3/HTTP.
    6. If a download used to swallow S3, keep fail-open on the Download
       Step: outer catch throws Errr, inner catch warns and writes null
       (GetPrivateTransactions). Do not nest try/catch in the Module.
  </do>

  <do-not>
    Do not wrap the fat for-await in Promise.all(map(async =&gt; await Proxy)).
    Do not put for-loops of Module.method inside the Module (that is still
    service-orchestration territory). The Step owns the fan-out loop.
    Do not leave cheerio/HTML parse in the batch Step.
  </do-not>

  <live-canonical>
    sync/src/steps/parse-billing-html-pages.js
    sync/src/modules/billing-html.js
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      Step for-of awaits S3 then parses HTML inline.
    </file>
    <file path="after-batch.js" role="after">
      Batch Step loops `Module.method` only.
    </file>
    <file path="after-module.js" role="after">
      Module method: download Step then parse Step.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | Proxy await inside a Step `for` |
| [after-batch.js](after-batch.js) | Batch Step `Module.method` loop |
| [after-module.js](after-module.js) | Flat Module accept chain |

Live canonical: `ParseBillingHtmlPages` + `BillingHtmlModule`.
