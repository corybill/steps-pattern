# Keep sequential embed batches

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-iterator-simplicity</rule-id>
    <slug>keep-sequential-embed-batches</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    A Step for-loop awaits EmbeddingProxy.embedContents on Titan V2
    batches. The lint flags the Proxy await in the iterator.
  </problem>

  <when>
    The loop is only Bedrock embedContents over BATCH_SIZE slices of
    already-in-memory text. Racing batches would blow rate limits and
    heap. a Module call would still await the same proxy per slice.
  </when>

  <decision>
    Keep the serial batch loop. Add a scoped eslint-disable / enable
    around that for only. Write the same rationale in the file
    @agent-dossier as a closed [x] [Steps] item. Do not Promise.all
    and do not extract a Module.
  </decision>

  <thought>
    fetch-then-process is for independent cheap GETs (week stats).
    extract-loop-outbound-into-module is for download+parse sequences.
    Embed batching is neither: one outbound, must stay serial, Module
    ceremony would not change the call. The disable is the architecture,
    not a pause button.
  </thought>

  <do>
    1. Leave the for (i += BATCH_SIZE) await embedContents loop.
    2. Wrap that for in eslint-disable / eslint-enable for
       steps-pattern/enforce-step-iterator-simplicity with a short
       -- comment (rate + heap; do not Promise.all).
    3. In @technical-debt add a closed [x] [Steps] line that says why
       Promise.all and Module.method are wrong for this file.
    4. In @refactoring-goals: keep embed batches serial.
  </do>

  <do-not>
    Do not Promise.all embedContents batches.
    Do not extract a Module whose only job is one embedContents.
    Do not copy this disable onto download+parse, week-fetch, or
    hydrate/S3 loops.
    Do not use a file-wide eslint-disable.
  </do-not>

  <live-canonical>
    document-processor/src/steps/embed-account-document-chunks.js
    sync/src/steps/embed-message-index-docs.js
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      Serial embed loop with no disable (lint fail).
    </file>
    <file path="after.js" role="after">
      Same loop, scoped disable, dossier explains why.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | Serial `embedContents` loop (lint fail) |
| [after.js](after.js) | Scoped disable around the same loop |
