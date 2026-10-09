# steps-pattern portable export

A copy of the Steps Pattern ESLint plugin, Cursor rules, and steps-engineer skill.
Nothing here installs itself. Copy the pieces onto the other machine.

## Linter

From the repo that should lint with these rules:

```bash
npm install /absolute/path/to/steps-pattern
```

Peer dependencies: `eslint` >= 9, Node >= 24. In `eslint.config.js`:

```js
import stepsPatternPlugin from "steps-pattern";

export default [
  { plugins: { "steps-pattern": stepsPatternPlugin } },
];
```

Shape presets are exported from `steps-pattern/eslint-config`. Rule guides are in `docs/llm/`.

This copy does not include a partner-HTTP allowlist rule. Examples use account, member, and order. Auth, Model, and Search stand in for specific vendors. Shape docs use `lambda-worker`, `document-processor`, and `agent-runtime`.

## Cursor rules

Copy `cursor/rules/*.mdc` to `<repo>/.cursor/rules/steps-pattern/`.
Copy `cursor/rules/universal/*.mdc` to `<repo>/.cursor/rules/universal/`.

Universal rules read repo-specific paths from a `.agent-context.json` you create in that repo. They do not ship with one.

## Skill

Copy `skills/steps-engineer/` to `~/.cursor/skills/steps-engineer/`.
For Claude Code, copy the same folder to `~/.claude/skills/steps-engineer/`.

Product-specific feature maps were left out of this export. Globs in the Cursor rules are generic (`**/server/steps/**`, and similar).
