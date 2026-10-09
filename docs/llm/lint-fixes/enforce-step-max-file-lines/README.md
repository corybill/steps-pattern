# `enforce-step-max-file-lines`

A Step source file is over the physical-line max (250 now; target 180). Split the work. Do not silence with `eslint-disable` or delete comments to sneak under the cap.

Prefer a named Gang of Four pattern ([`gang-of-four.md`](../../framework/gang-of-four.md)): no collection → **Template Method** (sibling Commands on the Service/Module); looping a per-item body → **Iterator** + **Composite** (batch Step + Module method). Do not shrink the file with same-file `_helpers` — that is the helper anti-pattern.

Read the matching recipe before editing.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred (no collection — one pipeline) | [split-into-sequential-steps](split-into-sequential-steps/) | `next` owns several phases on one state bag (load → score → persist). Cut each phase into a sibling Step. `acceptAll` independent phases; sequential `accept` only at data-dependency barriers. |
| preferred (looping a per-item body) | [extract-loop-into-module](extract-loop-into-module/) | `next` loops accounts / years / pages. Move the looped body onto a Module method that `acceptAll`s **two or more** Steps. The original Step `Promise.all`s `Module.method` for independent items. |

Older combined write-up (pick one of the two above): [split-fat-step](split-fat-step/).

Rule guide: [`../../rules/enforce-step-max-file-lines.md`](../../rules/enforce-step-max-file-lines.md)
