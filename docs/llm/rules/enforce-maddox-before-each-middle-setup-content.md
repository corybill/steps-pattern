# enforce-maddox-before-each-middle-setup-content

## Rule id

`steps-pattern/enforce-maddox-before-each-middle-setup-content`

## Intent (from ESLint rule)

1. Discourage assigning context.inputParams or context.expected* outcomes inside middle Maddox setup helpers. See `.cursor/rules/maddox-scenario-tests.mdc`.
2. Enforce that every mock setup function (e.g., `setupAccountsGet`) defines its corresponding `Params`, `Response`, and `Error` variables (e.g., `context.partnerAccountsGetParams`, `context.partnerAccountsGetResponse`, and `context.partnerAccountsGetError`).

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-maddox-before-each-middle-setup-content` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Ensure that any middle mock setup function (e.g., `setupAccountsGet`) assigns all three required variables: `Params`, `Response`, and `Error`.
3. Move any assignments to `context.inputParams` or `context.expected*` outcomes out of middle setup helpers and into `setupInputParams` or `setupResponse` respectively.

## What good looks like

A correct mock setup function defining all three required variables:

```javascript
context.setupAccountsGet = () => {
  context.partnerAccountsGetParams = [context.accountId, { members: true, users: true, drafts: true }];
  context.partnerAccountsGetResponse = new Account(context.accountRow);
  context.partnerAccountsGetError = new Error(`Accounts.get failed: ${Mock.getHash()}`);
};
```

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
