# Duplicate a tiny function across server Step and client hook

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-forbidden-words</rule-id>
    <slug>duplicate-across-boundary</slug>
    <preference>alternative</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    A Step and a React hook both need the same few lines (parse a
    year, skip a year-chain). A shared util/helper file would give
    them one import — and a forbidden path with no owner.
  </problem>

  <when>
    The function is small, pure, and used on both sides of the
    server/client boundary. Extracting a Step would not help the
    hook (hooks cannot accept Steps). A shared package path named
    util/helper is the smell this rule exists to stop.
  </when>

  <decision>
    Keep a private copy in the Step file and a private copy in the
    hook file. Name them for their call site (yearOf / yearOfRow).
    Record "keep in sync; do not extract a util/helper" on both
    dossiers.
  </decision>

  <thought>
    OrderBulkActionIds.yearOf and use-bulk-action-run yearOfRow are
    the same four lines. The Step owns server validate order. The
    hook owns client year-chain skip. Sharing a util/year-of.js
    would reintroduce the dumping ground and couple the client to
    a server-shaped module.

    Use extract-into-step when both callers are backend flows that
    already have state.
  </thought>

  <do>
    1. Put function yearOf(row) above the Step class in the Step file.
       Use it only inside next(state).
    2. Put function yearOfRow(row) in the hook file. Use it only
       inside that hook.
    3. Add a dossier line on both files: keep in sync; do not extract
       a util/helper.
    4. Delete any shared util/helper import.
  </do>

  <do-not>
    Do not create util/year-of.js or helper/year.js.
    Do not import the Step file from a React hook.
    Do not grow the private function into a second toolbox — if it
    becomes domain compute, make a Step for the server side and keep
    the hook copy tiny.
    Do not eslint-disable the path rule to share a file.
  </do-not>

  <live-canonical>
    ui/app/server/steps/order-bulk-action-ids.js
    ui/app/front-end/features/admin-hub/actions/use-bulk-action-run.js
  </live-canonical>

  <files>
    <file path="before-shared-util.js" role="before">
      util/year-of.js imported by Step and hook.
    </file>
    <file path="after-step.js" role="after">
      Private yearOf on the Step.
    </file>
    <file path="after-hook.js" role="after">
      Private yearOfRow on the hook.
    </file>
  </files>

  <example>
    <thought>
      Bulk year-chain skip needs the same parse on the server
      (validate order) and the client (skip remaining years after
      a failure). Two private copies beat one util.
    </thought>
    <before path="before-shared-util.js" />
    <after path="after-step.js" />
  </example>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before-shared-util.js](before-shared-util.js) | Shared `util/year-of.js` |
| [after-step.js](after-step.js) | Private `yearOf` on the Step |
| [after-hook.js](after-hook.js) | Private `yearOfRow` on the hook |

Live canonical: `order-bulk-action-ids.js` + `use-bulk-action-run.js`.
