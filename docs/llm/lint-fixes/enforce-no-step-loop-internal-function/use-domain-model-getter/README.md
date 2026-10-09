# Use a domain-model getter

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-step-loop-internal-function</rule-id>
    <slug>use-domain-model-getter</slug>
    <preference>preferred</preference>
    <recorded>2026-09-07</recorded>
  </meta>

  <problem>
    A Step loop calls a same-file helper whose whole job is reading or
    deriving one field of a domain object (_getAccountType, matchName,
    isPaidStatus, getPlayer).
  </problem>

  <when>
    The helper takes one item (or an id into an index of that item) and
    returns a property of that item. The model already has the getter, or
    the getter belongs on ImmutableModel (isRecurring, matchName, isPaid,
    displayName, toJSON). The loop has no other same-file calls.
  </when>

  <decision>
    Put the derivation on the domain model (get foo / static toMatchName
    / forMove). The Step loop reads the getter. Delete the same-file
    helper. Imported model methods are legal.
  </decision>

  <pattern>None — this is an existing Model accessor, not a new type.</pattern>

  <thought>
    loop-accept-module is ceremony for "is this recurring?". inline-into-next
    copies the same one-liner at every filter. The model is the singular
    mapping; Steps should not re-derive type, paid, or match-name.
  </thought>

  <do>
    1. Name the model (Account, PartnerPlayer, GenericAction, AccountPayment).
    2. Add or reuse a getter / static on that model. Serialize it in toJSON
       when Remix will see a plain object.
    3. In the loop, read item.isRecurring / item.matchName / Model.from(row).toQueueDto().
    4. Delete the same-file helper. Confirm the loop calls no other same-file function.
  </do>

  <do-not>
    Do not extract a Module for a predicate.
    Do not keep _getAccountType and also add the getter.
    Do not put Zod catalog checks on the model (that is Step validation).
    Do not call this recipe for collection aggregates (GROUP BY year) or
    multi-arg lookups (findAgg, isSourceKeyStale(key, facts)).
  </do-not>

  <live-canonical>
    ui/app/server/steps/filter-and-group-accounts.js
    (AccountSettings.from(l.settings).isRecurring)
    plus models/src/models/account-settings.js
  </live-canonical>

  <files>
    <file path="before.js" role="before">
      filter calls ThisClass._getAccountType.
    </file>
    <file path="after.js" role="after">
      filter reads AccountSettings.from(l.settings).isRecurring.
    </file>
  </files>
</lint-fix-recipe>
```

## Sibling files

| File | Role |
| :--- | :--- |
| [before.js](before.js) | `filter` → `_getAccountType` |
| [after.js](after.js) | `filter` → `AccountSettings.from(l.settings).isRecurring` |
