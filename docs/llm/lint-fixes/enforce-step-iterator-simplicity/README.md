# `enforce-step-iterator-simplicity`

A Step `next` loop `await`s a Proxy/Repository, or contains 2+ non-`Module.method` awaits. Do not silence with `Promise.all(map(async … await Proxy))` — `map` is still a loop.

Read the matching recipe before editing.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (download + parse / per-item sequence) | [extract-loop-outbound-into-module](extract-loop-outbound-into-module/) | The loop body downloads, parses, or runs a per-item sequence. Batch Step loops `Module.method`; the Module is a flat accept chain. |
| preferred (independent week/page reads, then flatten) | [fetch-then-process](fetch-then-process/) | The loop only fetches independent payloads (week GETs, dual S3 presigns, or bounded Billing year HTML), then flattens/parses or attaches. One Step races `Promise.all` with **no inner await**. A sibling Process Step is only for flatten/parse — attach-only stays in the Fetch Step. Service accepts Fetch then Process. |
| preferred (Bedrock Titan embed batches) | [keep-sequential-embed-batches](keep-sequential-embed-batches/) | The loop is only `EmbeddingProxy.embedContents` over `BATCH_SIZE` slices. Keep it serial. Scoped disable + dossier rationale. Do not `Promise.all`. |

Looping `ThisClass._processItem` is **`enforce-no-step-loop-internal-function`**, not this rule. Fixes: [loop-accept-module](../enforce-no-step-loop-internal-function/loop-accept-module/) or [inline-into-next](../enforce-no-step-loop-internal-function/inline-into-next/).

Rule guide: [`../../rules/enforce-step-iterator-simplicity.md`](../../rules/enforce-step-iterator-simplicity.md)
