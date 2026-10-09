# enforce-injectable-bounded-fanout

## Rule id

`steps-pattern/enforce-injectable-bounded-fanout`

## Intent (from ESLint rule)

Outbound fan-out `for` loops must not use a hard-coded numeric iteration bound (literal or module `const N = <number>`). The bound must come from Global/config (CallExpression, or a `const` initialized from one) so Maddox/proxy specs can inject a small N and assert call cardinality.

## When this rule applies

Enabled on `/proxies/`, `/steps/`, `/modules/`, and `/services/` globs via `stepsLayers()` in `steps-pattern/eslint-config`.

## What triggers

- A `for` statement whose compare bound is a numeric literal **≥ 4**, or a module-level `const` initialized to such a literal
- And the loop body contains a proxy-like call (`HttpProxy.*`, import from `/proxies/`, or `*Proxy.method`)

Bounds **1–3** are treated as trivial and do not fail.

## What this rule does not enforce

- In-memory loops with no outbound (building fixture arrays is fine)
- Bounds from `array.length`, `state.getSeasons()`, or other MemberExpression / CallExpression sources
- `Array.from({ length: N })` fan-out (deferred)

## Correct fix (checklist)

1. Add a Global getter (e.g. `Global.getPartnerPageLimit()` → `parseInt(Global.getEnv("PARTNER_PAGE_LIMIT", "18"), 10)`). Do **not** read `process.env` in the proxy/step (blocked by `enforce-no-process-env-except-global`).
2. Use that CallExpression (or a `const` initialized from it) as the loop bound.
3. In Maddox/proxy specs, set `process.env.PARTNER_PAGE_LIMIT = "2"` (specs are exempt from the process.env rule) and assert outbound call count = 2.

## What good looks like

```js
for (let page = 1; page <= Global.getPartnerPageLimit(); page++) {
  pagePromises.push(HttpProxy.get(`${base}/records?page=${page}`));
}
```

## Do not

- Do not hard-code `const PAGE_LIMIT = 18` (or `page <= 18`) when the loop calls a proxy.
- Do not bypass with `eslint-disable`.
- Do not put raw `process.env` in the proxy to “fix” the bound.

## Related docs

- `docs/llm/rules/enforce-no-process-env-except-global.md`
- Generate-maddox: injectable N for bounded fan-out (proxy-layer cardinality)
