# steps-pattern — LLM / human docs

This directory (`docs/llm/`) is the **versioned knowledge base** shipped with the **`steps-pattern`** package: **Steps Pattern**, **Maddox** conventions, and **per-rule** fix guidance for the custom ESLint plugin (`steps-pattern/*`).

| Area | Path | Use when |
|------|------|----------|
| Index + machine map | [`manifest.json`](manifest.json) | Mapping `ruleId` or topic id → markdown file (`lintFixes` when recipes exist) |
| Agent playbook | [`HOWTO.md`](HOWTO.md) | How to use this tree from a lint failure or new task |
| Framework guides | [`framework/`](framework/) | Building features/tests in the architecture (not tied to one rule) |
| Rule guides | [`rules/`](rules/) | Fixing a specific `steps-pattern/enforce-…` violation |
| Lint-fix recipes | [`lint-fixes/`](lint-fixes/) | Decision narratives (XML prompts + teaching files) for how we have fixed a rule |

**Versioning:** Docs and ESLint rules share the same `package.json` version. Meaningful changes to conventions or rule behavior should bump semver and be noted in the package root [`CHANGELOG.md`](../CHANGELOG.md).

**Other repos:** Depend on `steps-pattern` (npm or `file:`). After install, open `node_modules/steps-pattern/docs/llm/` (same layout as in this monorepo under `packages/steps-pattern/docs/llm/`).
