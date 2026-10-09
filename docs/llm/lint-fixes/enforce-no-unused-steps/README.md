# `enforce-no-unused-steps`

A Step class under `steps/` is never named in a Service or Module. The rule scans `app/` and `src/` (skipping specs) for the PascalCase class token.

Read the matching recipe before editing. Do not silence with `eslint-disable` or a comment that mentions the class.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (intended flow exists) | [accept-into-owning-service](accept-into-owning-service/) | The Step is real work. Accept it from the Service/Module that owns the persist or dispatch. |
| alternative (no caller) | Remove the Step file (and its spec). Only when nothing should run it. |

Rule guide: [`../../rules/enforce-no-unused-steps.md`](../../rules/enforce-no-unused-steps.md)
