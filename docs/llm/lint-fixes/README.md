# Lint-fix recipes

Decision narratives for **how we chose to change code** to satisfy a `steps-pattern/*` ESLint rule. Distinct from the anti-pattern inbox (machine-ranked fail→pass *snippets*) and from world mutations (lint goldens).

Use these when a lint failure’s `Fixes:` line (or the rule’s `lintFixes` entry in [`manifest.json`](../manifest.json)) points here. One rule can have **several** recipes — pick the one that matches the smell, do not default to the cheapest silence.

## How to pick a fix (Gang of Four first)

Prefer a **named Gang of Four pattern** over a new file that has no pattern. Map: [`../framework/gang-of-four.md`](../framework/gang-of-four.md).

Name the pattern **before** you extract. Command → Step. Strategy → `strategies/`. Template Method → Service/Module accept chain. Iterator + Composite → batch Step + Module per item. Adapter → Proxy. Factory Method → Dispatch Step.

A collection of helpers is the failure mode of skipping that gate. It is not a recipe. If the leftover looks like “shared functions,” you have not named the pattern yet — open [`enforce-no-forbidden-words/`](enforce-no-forbidden-words/) and treat that as the loudest Don’t.

## Layout

```
docs/llm/lint-fixes/
  README.md                          ← this catalog
  <rule-short-id>/
    README.md                        ← index of recipes for that rule
    <recipe-slug>/
      README.md                      ← XML prompt (the recipe)
      *.js                           ← optional before/after teaching files
```

`rule-short-id` is the ESLint rule name without the `steps-pattern/` prefix (e.g. `enforce-maddox-scenario-mock-surface`).

## Catalog

| Rule | Recipes |
| :--- | :--- |
| `enforce-architectural-layer-access` | [extract-outbound-into-step](enforce-architectural-layer-access/extract-outbound-into-step/) (preferred when Cron / HTTP host / valuation helpers call a Proxy or repository) |
| `enforce-maddox-scenario-mock-surface` | [split-by-iterator](enforce-maddox-scenario-mock-surface/split-by-iterator/) (preferred when a collection exists) · [collapse-caller-mock-surface](enforce-maddox-scenario-mock-surface/collapse-caller-mock-surface/) (split by steps when there is no iterator, or to share a step group) · [acknowledge-mock-surface-debt](enforce-maddox-scenario-mock-surface/acknowledge-mock-surface-debt/) (temporary) |
| `enforce-service-orchestration` | [module-phases-via-call-steps](enforce-service-orchestration/module-phases-via-call-steps/) (preferred for multi-phase loaders / kill setDone) · [intent-to-module-method](enforce-service-orchestration/intent-to-module-method/) (preferred for form/body/query intent → Module methods) · [dispatch-verb-at-ingress](enforce-service-orchestration/dispatch-verb-at-ingress/) (preferred for **verb**/pathname at router/controller — not body intent) · [strategy-by-verb-in-step](enforce-service-orchestration/strategy-by-verb-in-step/) (alternative for interchangeable leaf writes). Choice table: [framework/routing-dispatch-choice.md](../framework/routing-dispatch-choice.md) |
| `enforce-controller-orchestration` | [dispatch-verb-at-ingress](enforce-controller-orchestration/dispatch-verb-at-ingress/) (preferred for route/controller **verb** maps only) · [extract-registration-wizard-service](enforce-controller-orchestration/extract-registration-wizard-service/) (preferred when the same stage bounce lives on many routes) · [redirect-layout-index-in-step](enforce-controller-orchestration/redirect-layout-index-in-step/) (preferred when a layout/tab Service already loads data and the bounce is pathname / member / season) · [format-response-in-step](enforce-controller-orchestration/format-response-in-step/) (preferred when the loader/action assembles a DTO) · [fold-second-service-into-accept-chain](enforce-controller-orchestration/fold-second-service-into-accept-chain/) (preferred when the route awaits a second Service) · [return-static-not-found](enforce-controller-orchestration/return-static-not-found/) (preferred for splat loaders whose every branch is 404) · [map-key-to-throw-redirect](enforce-controller-orchestration/map-key-to-throw-redirect/) (alternative when the branch is only `throw redirect` and there is no Service). Choice table: [framework/routing-dispatch-choice.md](../framework/routing-dispatch-choice.md) |
| `enforce-step-iterator-simplicity` | [extract-loop-outbound-into-module](enforce-step-iterator-simplicity/extract-loop-outbound-into-module/) (preferred for download+parse / per-item sequences) · [fetch-then-process](enforce-step-iterator-simplicity/fetch-then-process/) (preferred for independent week/page reads or dual S3 presigns) · [keep-sequential-embed-batches](enforce-step-iterator-simplicity/keep-sequential-embed-batches/) (preferred for serial Bedrock Titan `embedContents` batches) |
| `enforce-step-max-file-lines` | [split-into-sequential-steps](enforce-step-max-file-lines/split-into-sequential-steps/) (preferred when there is no collection — sibling Steps, `acceptAll` independent phases) · [extract-loop-into-module](enforce-step-max-file-lines/extract-loop-into-module/) (preferred when `next` loops a per-item body — `Promise.all` independent Module items) |
| `enforce-no-step-loop-internal-function` | [loop-accept-module](enforce-no-step-loop-internal-function/loop-accept-module/) (preferred when the helper is a per-item sequence) · [use-domain-model-getter](enforce-no-step-loop-internal-function/use-domain-model-getter/) (preferred when the helper is a property of one domain object) · [strategy-by-prefix](enforce-no-step-loop-internal-function/strategy-by-prefix/) (preferred when the helper is a prefix/algorithm ladder) · [inline-into-next](enforce-no-step-loop-internal-function/inline-into-next/) (single in-memory concern that is not a model field) |
| `enforce-module-min-steps` | [expand-accept-chain](enforce-module-min-steps/expand-accept-chain/) (preferred when the method should own 2+ Steps; warn-only) |
| `enforce-no-unused-steps` | [accept-into-owning-service](enforce-no-unused-steps/accept-into-owning-service/) (preferred when the Step belongs on an existing persist/dispatch chain) |
| `enforce-logger-static-message` | [static-message-attrs](enforce-logger-static-message/static-message-attrs/) |
| `enforce-error-log-at-ingress` | [wrap-and-rethrow](enforce-error-log-at-ingress/wrap-and-rethrow/) |
| `enforce-no-empty-catch` | [rethrow-or-warn](enforce-no-empty-catch/rethrow-or-warn/) |
| `enforce-no-service-from-step` | [accept-step-instead](enforce-no-service-from-step/accept-step-instead/) |
| `enforce-module-accept-not-step-next` | [use-state-accept](enforce-module-accept-not-step-next/use-state-accept/) |
| `enforce-errr-append-to` | [append-to-catch-binding](enforce-errr-append-to/append-to-catch-binding/) |
| `enforce-no-browser-api-outside-proxy` | [wrap-in-proxy](enforce-no-browser-api-outside-proxy/wrap-in-proxy/) |
| `enforce-outbound-class-method-call` | [class-method-call](enforce-outbound-class-method-call/class-method-call/) (preferred when the callee is outbound / DateProxy) · [in-process-in-step](enforce-outbound-class-method-call/in-process-in-step/) (preferred when the callee is in-process policy — keep it on the Step) · [hoist-in-process-onto-proxy](enforce-outbound-class-method-call/hoist-in-process-onto-proxy/) (**never** — do not wrap in-process policy as `Proxy.method`) |
| `enforce-no-forbidden-words` | [extract-into-step](enforce-no-forbidden-words/extract-into-step/) (preferred for domain compute / map / select) · [constants-or-common-not-util](enforce-no-forbidden-words/constants-or-common-not-util/) (labels / ordinals / `cn`) · [duplicate-across-boundary](enforce-no-forbidden-words/duplicate-across-boundary/) (same tiny fn on server Step + client hook) |
| `enforce-no-route-options-preflight` | [remove-options-branch](enforce-no-route-options-preflight/remove-options-branch/) |
| `enforce-no-route-auth-check` | [remove-auth-gate](enforce-no-route-auth-check/remove-auth-gate/) |
| `enforce-controller-route-by-verb-or-path` | [intent-to-dispatch-step](enforce-controller-route-by-verb-or-path/intent-to-dispatch-step/) (preferred when body/query picks a Service method at ingress). Choice table: [framework/routing-dispatch-choice.md](../framework/routing-dispatch-choice.md) |
| `enforce-no-maddox-compare-outside-scenario` | [use-vitest-expect](enforce-no-maddox-compare-outside-scenario/use-vitest-expect/) |
| `enforce-ingress-contract-validation` | [validator-validate](enforce-ingress-contract-validation/validator-validate/) |
| `enforce-maddox-validation-coverage` | [validation-error-it](enforce-maddox-validation-coverage/validation-error-it/) |
| `enforce-maddox-boilerplate` | [inline-setup-fields](enforce-maddox-boilerplate/inline-setup-fields/) |
| `enforce-if-throw-use-precondition` | [preconditions-debug-test](enforce-if-throw-use-precondition/preconditions-debug-test/) |

## When to add a recipe

Record a recipe when the fix is an **architectural decision** (extract a module, split a step, move mocks to a new boundary) — not when you only rename a `setup*` helper, reorder `beforeEach`, or add a missing wrap `it`.

Anti-pattern fail→pass snippets stay mandatory for every `steps-pattern/*` hit. A recipe is the *why we chose this shape* layer on top.

## Authoring a recipe

1. Create `docs/llm/lint-fixes/<rule-short-id>/<recipe-slug>/`.
2. Write `README.md` as an XML prompt using the tags in the template below. Embed short snippets in the prompt **and/or** put fuller teaching files next to it and list them in `<files>`.
3. Distill. Do **not** copy a live production file that will drift. Cite the live canonical path in `<live-canonical>`.
4. Do **not** put `@agent-dossier` on teaching files (they must not enter `TECH_DEBT_LOG.md`).
5. Add the recipe to this catalog table and to `<rule-short-id>/README.md`.
6. If this is the **first** recipe for a rule, set `lintFixes` on that rule in [`manifest.json`](../manifest.json). Wrap **every** `context.report` for that rule with `withLintDocs` from `lib/rules/lint-docs-footer.js` so **every** failure includes `Fixes: steps-pattern/docs/llm/lint-fixes/<rule-short-id>/`.
7. Protocol for agents: `~/.cursor/skills/steps-engineer/LINT_FIX_RECIPES.md` (user-global skill).

## Recipe `README.md` template

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-…</rule-id>
    <slug>kebab-decision-name</slug>
    <preference>preferred|alternative|temporary|never</preference>
    <recorded>YYYY-MM-DD</recorded>
  </meta>
  <problem>What the lint is telling you, in one sentence.</problem>
  <when>The production/test shape this recipe applies to.</when>
  <decision>The architectural change we chose.</decision>
  <pattern>Gang of Four name (Strategy, Command, Template Method, Iterator, Adapter, Facade, Factory Method). Required when the fix creates a type.</pattern>
  <thought>Why this over the other recipes for the same rule.</thought>
  <do>Numbered structural moves.</do>
  <do-not>Silences and lookalikes that fail sibling rules.</do-not>
  <live-canonical>workspace-relative path to the real example</live-canonical>
  <files>
    <file path="before.js" role="before">Dispatcher that trips the rule</file>
    <file path="after.js" role="after">Extracted module / caller</file>
  </files>
</lint-fix-recipe>
```
