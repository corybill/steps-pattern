# enforce-jsx-spec-for-ui-routes

## Rule id

`steps-pattern/enforce-jsx-spec-for-ui-routes`

## Intent (from ESLint rule)

Enforce `.jsx` extension for specs of routes that have UI components.

## When this rule applies

Remix `maddoxSpecs({ remix: true })` — typically `spec/**/*.spec.js` and `spec/**/*.spec.jsx`.

## Correct fix (checklist)

1. If the route module has a default-export UI component, the spec file must be `*.spec.jsx` (not `*.spec.js`).
2. Do not add a `.spec.js` sibling for the same route (`enforce-ui-route-spec-singleton`).

## Do not

- Do not add `eslint-disable` and keep a `.spec.js` UI-route spec.

## Related docs

`.cursor/rules/steps-pattern/maddox-route-scenario-tests.mdc`
