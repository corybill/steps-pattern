# enforce-ui-route-spec-singleton

## Rule id

`steps-pattern/enforce-ui-route-spec-singleton`

## Intent (from ESLint rule)

Enforce exactly one hand-authored `{route}.spec.jsx` per UI route.

- Reject `{route}.spec.js` siblings.
- Reject legacy `{route}.ai-driven.spec.jsx` remainder files (merge into `{route}.spec.jsx` via `work/app/collapse-spec-pairs/`).

## When this rule applies

Remix `maddoxSpecs({ remix: true })`.

## Correct fix (checklist)

1. Keep hand-authored tests in `{route}.spec.jsx`.
2. If `{route}.ai-driven.spec.jsx` exists, merge describes into `{route}.spec.jsx`, dedupe `(generated)` / `(AI-driven)` titles under `calling <method>, it`, then delete the sibling.
3. Delete any `{route}.spec.js` sibling.
4. Do not run `maddox:generate` (removed).

## Do not

- Do not add `eslint-disable` to keep dual extensions.
- Do not create new `.ai-driven.spec.jsx` files.

## Related docs

`.cursor/rules/steps-pattern/maddox-route-scenario-tests.mdc`
