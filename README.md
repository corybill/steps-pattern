# steps-pattern

Custom ESLint plugin for **Steps Pattern** and **Maddox** conventions (`steps-pattern/*` rules). In this monorepo the package lives at **`packages/steps-pattern`**. ESLint rule implementations live in **`lib/rules/`**; human/LLM guides per rule live in **`docs/llm/rules/`**.

## Install

```bash
npm install steps-pattern --save-dev
```

Peer dependency: `eslint` >= 9.

In **eslint.config.js** (flat config):

```js
import stepsPatternPlugin from "steps-pattern";

export default [
  {
    plugins: { "steps-pattern": stepsPatternPlugin },
  },
  // …enable rules as `steps-pattern/enforce-…`
];
```

**Local development** (sibling checkout, before publish):

```bash
npm install ../corybill/packages/steps-pattern --save-dev
```

## LLM / human knowledge base (versioned)

Shipped with the package under **`docs/llm/`**:

- **[`docs/llm/INDEX.md`](docs/llm/INDEX.md)** — Generated single-page index of every rule, shape preset, lint-fix recipe, framework guide, anti-pattern state, and worlds golden shipped in this package. **Start here.**
- **`docs/llm/manifest.json`** — Maps each `steps-pattern/<rule>` id to markdown; includes **`topics`** for initial reading and **`lintFixes`** when a rule has decision recipes.
- **`docs/llm/framework/`** — Steps Pattern + Maddox guides (portable summaries).
- **`docs/llm/rules/`** — One markdown per ESLint rule (intent + fix checklist + anti-patterns).
- **`docs/llm/lint-fixes/`** — XML recipes for how we have structurally fixed a rule (one directory per decision).

Agent playbooks: [`docs/llm/README.md`](docs/llm/README.md) and [`docs/llm/HOWTO.md`](docs/llm/HOWTO.md).

**Regenerate the index:**

```bash
pnpm docs:build-index            # writes docs/llm/INDEX.md only
pnpm docs:build-index:extended   # also writes <repo-root>/docs/steps-pattern-contributor-index.md
```

A hermetic Vitest spec ([`specs/index-generated.spec.mjs`](specs/index-generated.spec.mjs)) fails `pnpm test` if `INDEX.md` drifts from the sources that produce it, so a new rule / recipe / preset forces the regenerate step before the suite goes green.

## Project-shape presets

Consumer packages use **shape presets** from `steps-pattern/eslint-config` — see [`eslint-config/SHAPES.md`](eslint-config/SHAPES.md).

- `lambdaBackend()` — Lambda (`lambda.js` → Controller)
- `remixApp({ reactPlugin, reactHooks, jsxA11y })` — Remix (Route loader/action)
- `shareableModule()` — ShareableModule (Controller top; optional `runtime: "webextensions"`)
- `thinLibrary()` — non-Steps packages only (models, db)

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md). Bump **package version** when rules or framework docs change in ways consumers should notice.

## Tests (development of the package)

`pnpm test` is a **hermetic library suite**. It uses checked-in fixtures and worlds goldens only. It does **not** walk `products/app`. Adding a product route or Maddox spec must not turn this package red.

Live corpus census (optional, product-facing):

```bash
pnpm test
pnpm maddox:corpus-harvest -- --check
```
