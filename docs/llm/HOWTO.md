# HOWTO — use this knowledge base (agents & humans)

## Flow A: You have an ESLint failure

1. Copy the **`ruleId`** from the ESLint message (e.g. `steps-pattern/enforce-maddox-module-coverage`).
2. Open [`manifest.json`](manifest.json).
3. Under `rules`, find that key and open the `path` file (e.g. `rules/enforce-maddox-module-coverage.md`).
4. If the message has a **`Fixes:`** line (or the rule has `lintFixes` in the manifest), open that directory, **name the Gang of Four pattern** ([`framework/gang-of-four.md`](framework/gang-of-four.md)), then pick a recipe. One rule can list several ways to fix — prefer `preferred` over `temporary`. A collection of helpers is not a fix — see [`lint-fixes/enforce-no-forbidden-words/`](lint-fixes/enforce-no-forbidden-words/).
5. Optional: read the matching rule implementation in this package at `lib/rules/<rule-name>.js`.
6. Apply a **structural** fix that matches the rule’s intent; do not add `eslint-disable` unless the team explicitly allows an exception.

## Flow B: New Task (no lint yet)

1. Open [`manifest.json`](manifest.json) → **`topics`**.
2. Pick a topic (e.g. `maddox-scenarios`, `routing-dispatch-choice`, or `gang-of-four`) and open its `path` under `framework/`. For “where does this branch live?” start at [`framework/routing-dispatch-choice.md`](framework/routing-dispatch-choice.md) (verb/path at Route vs body/query → Module/Strategy). For “what type is this extract?” start at [`framework/gang-of-four.md`](framework/gang-of-four.md). For Service/Module accept chains: **parallel-first** — `acceptAll` / `Promise.all` unless a later unit reads an earlier write ([`layers-services-modules-steps.md`](framework/layers-services-modules-steps.md)). For **validation ownership**: Zod + `Validator.validate` at Controller / Module ingress / Parse* / Catalog ([`rules/enforce-ingress-contract-validation.md`](rules/enforce-ingress-contract-validation.md)); Preconditions for mid-flow invariants ([`rules/enforce-if-throw-use-precondition.md`](rules/enforce-if-throw-use-precondition.md)).
3. **Maddox specs:** For Route / Controller / Module, hand-author `{name}.spec.*` under `calling <method>, it`. Do **not** run `maddox:generate` (removed). Prefer a single spec file per route. Do not generate from prose or from packages where Maddox rules are off. Read `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md` (user-global skill). Always `.shouldBeCalledWith` (never `shouldBeCalledWithSubset` or `IgnoreParam`). Canonical lint-clean shapes live in `specs/worlds/trunk/spec/` (`maddox-lambda` / `maddox-remix` kinds)—not RuleTester fixtures.
4. Cross-check with the same repo’s ESLint config so production code and tests stay aligned with enabled rules.

## Flow C: Installed dependency (`node_modules`)

After `npm install steps-pattern`, docs ship at `node_modules/steps-pattern/docs/llm/`. In Cursor you can `@`-reference, for example:

- `node_modules/steps-pattern/docs/llm/HOWTO.md`
- `node_modules/steps-pattern/docs/llm/framework/maddox-scenarios.md`
- `node_modules/steps-pattern/docs/llm/rules/enforce-proxy-structure.md`

## Flow D: Record fail→pass anti-patterns (lint-fix agents)

When a `steps-pattern/*` rule fires while you are fixing product/app code:

1. **Record fail** — redacted snippet of the bad shape → `pnpm anti-patterns:record -- --phase fail …` (see [`../anti-patterns/README.md`](../anti-patterns/README.md)).
2. Follow **Flow A** (read rule doc; structural fix).
3. **Record pass** — same `observationId`, snippet of the clean shape → `--phase pass`.
4. **Stop** — do **not** add world mutations, edit `coverage.json`, or promote shapes in this pass.

Do not put these observations in `@agent-dossier` or the steps-engineer `TECH_DEBT_LOG.md`.

## Flow E: Promote anti-patterns to world tests (steps-engineer only)

Run in a **separate** agent session (steps-engineer `/promote-anti-patterns`), not while fixing app lints:

1. `pnpm anti-patterns:summarize` → read `SUMMARY.md` **Coverage gaps** (prefer complete pairs).
2. Add `specs/worlds/mutations/<fingerprint>/{meta.json,fail.js,pass.js}` from recorded snippets.
3. Set `coverage.json[fingerprint]`.
4. **Teach (required):** add or update one Don't/Do bullet in `docs/llm/rules/<rule>.md` from the promoted snippets.
5. `pnpm test` + `anti-patterns:summarize`.

## Flow F: Improvement ladder (skim → promote → teach → internalize)

Keep feature delivery fast. Grow prevention only from ranked examples:

1. **Collect** — Flow D (lint-fix agents record fail→pass). Architectural decisions also get a Flow H recipe.
2. **Skim** — Before writing a new file in a layer, open [`../anti-patterns/PREWRITE.md`](../anti-patterns/PREWRITE.md) for **that layer only** (top 5). If a lint message has `Fixes:`, open that recipe index before editing. Do not read full `SUMMARY.md` on every write.
3. **Stabilize** — Flow E when a fingerprint is a coverage gap (count ≥ threshold).
4. **Teach** — Happens inside Flow E (rule-doc Don't/Do).
5. **Internalize** — Dedicated session: steps-engineer `/improve-from-anti-patterns` patches at most 2 skill / `MADDOX_AUTHORING.md` lines from still-hot PREWRITE tops; retires stale lines.
6. **Leave to lint** — Rare or &lt;2 min fixes stay catch-and-fix forever.

First-write cleanliness is a trend, not a feature DoD gate.

## Flow G: Review lint-rule candidates (steps-engineer only)

When a census or Clean State epic names a **class of defect that has no `steps-pattern/*` rule** (or an existing rule that does not encode the shape):

1. Record it in [`../../anti-patterns/rule-candidates/inbox.json`](../../anti-patterns/rule-candidates/inbox.json) (`status: proposed`). Schema: [`../../anti-patterns/rule-candidates/SCHEMA.md`](../../anti-patterns/rule-candidates/SCHEMA.md).
2. Later: `pnpm anti-patterns:review-candidates` then `/review-rule-candidates` — **status only**.
3. Later: `/codify-best-practice <id>` for one `accepted` or `extend-existing` row. Do not implement rules in the review session.
4. **Codify DoD (worlds golden required):** Rule coverage for `steps-pattern` rules is **worlds-only** (`specs/worlds/` + `maddox-rule-parity` / `maddox-scenario-parity` / `codify-world-gate`) — do **not** add `specs/enforce-*.spec.mjs` RuleTester files. You **must** (a) keep `specs/worlds/trunk/` zero `steps-pattern/*` messages under the right kind (`lambda`/`remix`/`module` for layer rules; `maddox-lambda`/`maddox-remix` for Maddox rules), (b) add `specs/worlds/mutations/<ruleShortId>:<slug>/{meta.json,fail.js,pass.js}` with fail→`expectFail` and pass→fully clean, (c) set `anti-patterns/coverage.json` (+ Maddox inventory row when applicable), (d) run `specs/worlds/steps-worlds.spec.mjs` (+ Maddox parity gates when Maddox) green, then mark `shipped`. If the product preset parks a shipped rule `"off"`, force it on in `lint-world.mjs` on the **original layer globs** so the golden still runs. Also gated by `specs/worlds/codify-world-gate.spec.mjs` for shipped new-rule candidates.
5. Do **not** treat product LATER (knn, shared package, agent resume) as candidates — mark `rejected` / `not-lintable`.

Do not confuse this with Flow D (existing-rule fail→pass pairs) or Flow E (`/promote-anti-patterns` from observation inbox). Brand-new rules get their **first** world mutation from `/codify-best-practice`; later shapes still come from `/promote-anti-patterns`.

## Flow H: Record a lint-fix recipe (steps-engineer, architectural decisions)

When the fix was a **decision** (extract a module, move a mock boundary, choose the temporary debt marker) — not a mechanical rename / `beforeEach` reorder:

1. Open [`lint-fixes/README.md`](lint-fixes/README.md). Reuse an existing recipe if the decision matches.
2. Otherwise add `lint-fixes/<rule-short-id>/<recipe-slug>/README.md` as an XML prompt, with optional sibling teaching files (no `@agent-dossier` on those files). Include `<pattern>` with the Gang of Four name.
3. Index the recipe in the catalog table and the rule-level README.
4. First recipe for a rule: set `lintFixes` on that key in [`manifest.json`](manifest.json). Every `context.report` for that rule must go through `withLintDocs` so the ESLint message always includes `Fixes: …`.
5. Agent protocol: `~/.cursor/skills/steps-engineer/LINT_FIX_RECIPES.md` (user-global skill).

This is **not** Flow D. Snippets still go to `anti-patterns/inbox/`. Recipes teach *which structural fix to pick* the next time the same lint fires.

## Principles

- **Intent over syntax:** Rules encode architecture; fixes should preserve that architecture.
- **Gang of Four first:** Name the pattern before extracting. Helpers/utils are not a fix.
- **No silent bypasses:** Avoid eslint-disable, misleading renames, or deleting tests to pass coverage rules.
- **Living docs:** When conventions change, update `docs/llm/` and bump the package version / changelog together.
- **Record vs promote:** Lint-fix agents only append inbox pairs; world fail+pass tests from **observations** are authored only by `/promote-anti-patterns`. Exception: `/codify-best-practice` authors the first golden mutation when shipping a new rule.
- **Skim vs deep-read:** Feature agents skim `PREWRITE.md` for one layer; promotion/improve agents own SUMMARY and skill patches.
- **Teach from pairs:** Fail and pass shapes together are how agents learn what not to do and what to do instead.
