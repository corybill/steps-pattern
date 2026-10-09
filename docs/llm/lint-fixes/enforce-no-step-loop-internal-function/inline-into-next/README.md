# Inline the helper into next

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-step-loop-internal-function</rule-id>
    <slug>inline-into-next</slug>
    <preference>alternative</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Step loop calls a same-file helper that is one in-memory transform
    (collect ids, format a key). A Module would be ceremony.
  </problem>

  <when>
    The helper has no outbound, or one in-memory map/filter. next would
    stay under the file-length cap after inlining.
  </when>

  <decision>
    Delete the helper. Put the loop body in next. Keep the loop — this
    rule forbids the same-file call, not the iterator.
  </decision>

  <thought>
    loop-accept-module is wrong here: a one-step Module will warn on
    enforce-module-min-steps. Inline is the Do for a single concern.
  </thought>

  <do>
    1. Paste the helper body into the loop in next.
    2. Delete the same-file function.
    3. Leave imported functions (valuePick, deriveFormatKey) as they are.
  </do>

  <do-not>
    Do not extract a Module for a Set.add loop.
    Do not keep _collectIds and call it from next's map.
  </do-not>

  <live-canonical>
    In-memory collect loops inside apply-engine-valuations _collectPartnerIdsForAccount
    (those loops do not call same-file functions — legal). After a split, that
    collect belongs in next or a dedicated Collect* Step, not a Module.
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      map calls _collectId.
    </file>
    <file path="after.js" role="after">
      loop body inlined in next.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | `map` → `_collectId` |
| [after.js](after.js) | inline `ids.add` in `next` |
