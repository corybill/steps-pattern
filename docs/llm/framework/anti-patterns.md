# Anti-patterns (agent lint observations)

**Lint-fix agents** must record **fail → pass** shape pairs when `steps-pattern/*` rules fire — and stop at the inbox.

**Feature authors (steps-engineer):** before writing a layer, skim [`../../anti-patterns/PREWRITE.md`](../../anti-patterns/PREWRITE.md) for that layer only (HOWTO Flow F).

**World mutation tests** are authored only by **steps-engineer** `/promote-anti-patterns` in a separate session (HOWTO Flow E), including a required Don't/Do teach bullet in the rule doc.

**Skill internalization** is **steps-engineer** `/improve-from-anti-patterns` (HOWTO Flow F).

Canonical protocol, schema, inbox, and coverage live in the package root:

- [`../../anti-patterns/README.md`](../../anti-patterns/README.md)
- [`../../anti-patterns/SCHEMA.md`](../../anti-patterns/SCHEMA.md)
- [`../../anti-patterns/PREWRITE.md`](../../anti-patterns/PREWRITE.md)
- [`../../anti-patterns/SUMMARY.md`](../../anti-patterns/SUMMARY.md)

HOWTO: [Flow D (record)](../HOWTO.md) · [Flow E (promote)](../HOWTO.md) · [Flow F (improve)](../HOWTO.md) · [Flow G (rule candidates)](../HOWTO.md) · [Flow H (lint-fix recipes)](../HOWTO.md).

Decision narratives (how we chose to fix a lint) live in [`../lint-fixes/`](../lint-fixes/README.md), not in this inbox.

Proposed rules that do not exist yet live in [`../../anti-patterns/rule-candidates/`](../../anti-patterns/rule-candidates/README.md) — review with `pnpm anti-patterns:review-candidates`, implement only via `/codify-best-practice`.
