# Rule candidates (proposed ESLint rules)

Classes of defect from dossier / Clean State work that are **not yet** `steps-pattern/*` rules (or that existing rules do not fully encode).

Canonical inbox, schema, and CLI:

- [`../../../anti-patterns/rule-candidates/README.md`](../../../anti-patterns/rule-candidates/README.md)
- [`../../../anti-patterns/rule-candidates/inbox.json`](../../../anti-patterns/rule-candidates/inbox.json)
- [`../../../anti-patterns/rule-candidates/SCHEMA.md`](../../../anti-patterns/rule-candidates/SCHEMA.md)

```bash
pnpm --filter steps-pattern anti-patterns:review-candidates
```

**Review** (`/review-rule-candidates`): change `status` only.  
**Implement** (`/codify-best-practice <id>`): one `accepted` or `extend-existing` candidate, dedicated session — rule + **required** worlds golden mutation/trunk/coverage (RuleTester optional) + rule doc; mark `shipped` only when worlds suite is green.

HOWTO [Flow G](../HOWTO.md). Do not confuse with fail→pass observations ([Flow D](../HOWTO.md)).
