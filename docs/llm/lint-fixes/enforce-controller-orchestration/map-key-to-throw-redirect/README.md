# Map key to throw-redirect (route)

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-orchestration</rule-id>
    <slug>map-key-to-throw-redirect</slug>
    <preference>alternative</preference>
    <recorded>2026-09-03</recorded>
  </meta>

  <problem>
    A route loader try body uses if (stage === …) throw redirect(path)
    to bounce the user off the page. The rule forbids IfStatement
    inside the try and forbids non-State VariableDeclaration there.
  </problem>

  <when>
    The branch is only "leave this page" — a known key (registration
    stage, role, etc.) maps to throw redirect(path). There is no
    Service pipeline to choose. Use dispatch-verb-at-ingress instead
    when the key chooses a different Service method.
  </when>

  <decision>
    Module-level map of key → () => { throw redirect(path) }. Read
    the key outside try. Invoke with
    return map[key]?.() ?? {} so the try body is one ReturnStatement.
    Unmapped keys stay on the page (empty loader payload).
  </decision>

  <thought>
    dispatch-verb-at-ingress maps a verb to a Service method name.
    Inventing a Service just to throw redirect is overkill when the
    loader does no other work.

    Bare map[key]() as an ExpressionStatement is still illegal —
    the rule only allows service / state / console calls as
    expressions. ReturnStatement and ThrowStatement are allowed.
    return map[key]?.() ?? {} invokes the thrower and keeps the
    stay-on-page path as {}.

    Key lookups (context.get, stage default) are VariableDeclarations
    that are not new XxxState — they must live outside try.
  </thought>

  <do>
    1. const RedirectByKey = { STAGE: () => { throw redirect("/path"); } }
       at module scope.
    2. Read the key outside the try (VariableDeclaration is allowed
       there).
    3. Inside try: return RedirectByKey[key]?.() ?? {};
    4. Keep the existing catch (rethrow Response, wrap with Errr).
  </do>

  <do-not>
    Do not put if (key === …) throw redirect inside the try.
    Do not call the map as a bare ExpressionStatement
    (RedirectByKey[key]();) — that is still a lint error.
    Do not keep const userModel / const stage inside the try.
    Do not invent a Service + Step solely to throw redirect.
    Do not eslint-disable this rule.
  </do-not>

  <live-canonical>
    ui/app/routes/registration.billing.jsx
  </live-canonical>

  <files>
    <file path="before-loader.js" role="before">
      Route loader with if (stage) throw redirect inside try.
    </file>
    <file path="after-loader.js" role="after">
      Key → throw-redirect function map; one return inside try.
    </file>
  </files>

  <example>
    <thought>
      Registration Billing loader bounces earlier funnel stages
      to their routes. A throw-function map keeps Remix
      throw redirect without IfStatement in the try.
    </thought>
    <before path="before-loader.js" />
    <after path="after-loader.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-loader.js](before-loader.js) | Route `if` per stage inside try |
| [after-loader.js](after-loader.js) | Key → throw-redirect map and one `return` |

Live canonical: `registration.billing.jsx`.
