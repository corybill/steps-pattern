# Named common/constants — not util/helper

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-forbidden-words</rule-id>
    <slug>constants-or-common-not-util</slug>
    <preference>alternative</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    The leftover is a label, ordinal, or class-name merge. Putting it
    in util/ or helper/ (or leaving it in lib/utils.js) creates a
    forbidden dumping-ground path.
  </problem>

  <when>
    The functions have no flow ownership: they do not read state, they
    do not call proxies, and they are not the reason a Step exists.
    Examples: ordinalRoundLabel, cn (clsx + tailwind-merge).
  </when>

  <decision>
    Give the file a domain name under common/ or constants/ (sync),
    or under an existing single-concern lib subdirectory (front-end
    styles). Never name the file or folder util, utils, helper, or
    helpers.
  </decision>

  <pattern>None — named constants, not Strategy or Command. Do not park algorithms here to dodge a helper path.</pattern>

  <thought>
    This is the only leftover that is not a GoF extract: labels, not
    algorithms. If the file maps or selects domain data, stop — that
    is Command (extract-into-step), not a renamed util.

    Selection ordinals are not a Step — they are a label table
    imported by BuildMemberSelections. They live in
    common/selection-labels.js.

    Front-end cn left app/lib/utils.js and now lives in
    lib/styles/index.js. The styles file says do not add more domain
    to it. That is the only legal "utility" leftover: a class-name
    merge with no domain logic.

    If the leftover builds or selects domain data, use extract-into-step
    instead.
  </thought>

  <do>
    1. Create common/&lt;domain&gt;-labels.js or constants/&lt;domain&gt;.js
       (or front-end lib/styles for cn only).
    2. Move the functions. Name the file after the domain, not "utils".
    3. Delete the util/helper path. Update imports.
    4. The Step that uses the label still owns the flow — do not
       grow common/ into a second toolbox.
  </do>

  <do-not>
    Do not create util/, utils/, helper/, or helpers/.
    Do not recreate front-end/lib/utils.js.
    Do not put domain compute (boards, maps, selection) in common/.
    Do not eslint-disable the path rule so a utils.js can stay.
  </do-not>

  <live-canonical>
    sync/src/common/selection-labels.js
    ui/app/front-end/lib/styles/index.js
  </live-canonical>

  <files>
    <file path="before-utils.js" role="before">
      utils/labels.js dumping ground.
    </file>
    <file path="after-common.js" role="after">
      Named common/selection-labels.js.
    </file>
  </files>

  <example>
    <thought>
      ordinalRoundLabel is a 1st/2nd/3rd table. It is not a Step.
      It is also not a util. The filename says selections.
    </thought>
    <before path="before-utils.js" />
    <after path="after-common.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-utils.js](before-utils.js) | `utils/` dumping ground |
| [after-common.js](after-common.js) | Named `common/` labels |

Live canonical: `selection-labels.js`; front-end `cn` in `lib/styles`.
