# Return a static 404 (splat / catch-all)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>return-static-not-found</slug>
    <preference>preferred</preference>
    <recorded>2026-09-04</recorded>
  </meta>

  <problem>
    The splat loader parses new URL and ifs pathname, then returns 404
    from every branch. VariableDeclaration + IfStatement in the try.
  </problem>

  <when>
    Every branch returns the same static Response (404). There is no
    Service pipeline and no domain bounce. Chrome DevTools /.well-known
    and unknown app paths are the same 404.
  </when>

  <decision>
    return new Response(null, { status: 404 }) as the only try-body
    statement. Drop new URL and the if. Do not invent a NotFoundService.
  </decision>

  <thought>
    map-key-to-throw-redirect and redirect-layout-index-in-step are for
    real bounces. A Service whose next() always 404s is ceremony.

    ReturnStatement is allowed. Both splat branches were already 404 —
    the if was dead.
  </thought>

  <do>
    1. try { return new Response(null, { status: 404 }); }
    2. Keep the existing catch (Errr + 404 fallback).
    3. Delete pathname parsing and the /.well-known/ branch.
  </do>

  <do-not>
    Do not invent a Service + Step solely to return 404.
    Do not keep new URL just to debug pathname — catch can parse.
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/routes/$.jsx
  </live-canonical>

  <files>
    <file path="before-loader.js" role="before">
      Splat loader that parses URL and ifs to the same 404.
    </file>
    <file path="after-loader.js" role="after">
      One static 404 return.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-loader.js](before-loader.js) | `new URL` + dead if |
| [after-loader.js](after-loader.js) | Static 404 |

Live canonical: `$.jsx`.
