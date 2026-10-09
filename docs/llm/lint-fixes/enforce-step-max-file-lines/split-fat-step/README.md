# Split a fat Step (superseded index)

This recipe mixed two decisions. Use the rule index and pick one:

| Path | Recipe |
| :--- | :--- |
| Sequential phases, no collection | [split-into-sequential-steps](../split-into-sequential-steps/) |
| Loop over a per-item body | [extract-loop-into-module](../extract-loop-into-module/) |

Do not follow the mixed `decision` below for new work.

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-step-max-file-lines</rule-id>
    <slug>split-fat-step</slug>
    <preference>temporary</preference>
    <recorded>2026-09-05</recorded>
  </meta>

  <problem>
    Combined write-up. Replaced by split-into-sequential-steps and
    extract-loop-into-module.
  </problem>

  <when>Do not pick this recipe.</when>
  <decision>Open the sibling recipe that matches the file.</decision>
  <thought>Kept so old Fixes links do not 404.</thought>
  <do>Open ../README.md and pick one row.</do>
  <do-not>Do not implement from this file.</do-not>
  <live-canonical>See the two sibling recipes.</live-canonical>
</lint-fix-recipe>
```
