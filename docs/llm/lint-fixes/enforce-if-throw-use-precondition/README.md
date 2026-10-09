# `enforce-if-throw-use-precondition`

Required-value invariants use Preconditions, not if/throw.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred | [preconditions-debug-test](preconditions-debug-test/) | `if (!x) throw new Error` / `Errr.newError` for a required value |

Rule guide: [`../../rules/enforce-if-throw-use-precondition.md`](../../rules/enforce-if-throw-use-precondition.md)
