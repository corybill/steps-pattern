# enforce-service-orchestration

## Rule id

`steps-pattern/enforce-service-orchestration`

## Intent (from ESLint rule)

Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. **`Preconditions.errr().…debug({…}).test()`** is allowed at the beginning of the method or inside the try block for **trusted-pipeline invariants** before orchestration — not for untrusted ingress (that is Zod + `Validator.validate` on Controllers / Module ingress / Parse* / Catalog). Required-value **HOW**: `enforce-if-throw-use-precondition` (no `if (!x) throw`). House teaching: `.cursor/rules/steps-pattern/backend-services.mdc` and `backend-modules.mdc`.

**Flat try body:** `if` / `else` / `switch` / loops / `Promise.all` of Module calls are **not** allowed inside the Service or Module `try` block. Allowed orchestration: `state.accept` / `acceptAll`, sequential `await SomeModule.method(state)`, `set*` (except `setInteractionResult` — use a `Map*Result` Step), logging, preconditions, variable declarations, and `return`. Move branching or fan-out into a Step — see the Fixes recipes below.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-service-orchestration` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Infer the **architectural** intent (orchestration vs business logic, test contract, layer access, etc.).
3. If the message has a **Fixes:** line, open that recipe index and pick **module-phases-via-call-steps** (multi-phase loader / kill `setDone`), **intent-to-module-method** (form/body/query intent → Module methods on one module), **dispatch-verb-at-ingress** (HTTP **verb** or pathname at the route/middleware — never body intent), or **strategy-by-verb-in-step** (leaf `Strategy.execute` writes). Discriminator table: [`framework/routing-dispatch-choice.md`](../framework/routing-dispatch-choice.md).
4. Refactor code or tests to satisfy the rule without weakening guarantees.

## What good looks like

Use small, realistic snippets from the same layer (service, module, step, spec) as the violation. The app repo’s `spec/` and `src/` trees contain canonical patterns.

**Don't** (service/module try body — skip gate / single `if`)

```js
await state.accept(TriggerJitPartnerSync);
if (state.getShouldTriggerPartnerSync()) {
  await state.accept(TriggerAccountSync);
}
```

**Do** (flat sibling Module phases — no branching)

```js
await BillingPaymentsModule.linkPrimary(state);
await BillingPaymentsModule.autoLinkMatching(state);
```

**Don't** (Module fan-out in the Service/Module try)

```js
await Promise.all([
  Partner.getAccountMembers(accountState),
  Partner.getSelections(accountState),
]);
```

**Do** (Call Step owns the gate; Service/Module stays flat)

```js
await state.accept(TriggerJitPartnerSync);
await state.accept(CallTriggerPartnerSyncIfNeeded); // early-return inside the Step
```

Or accept the leaf steps only when a dedicated Module method is the entry point for that path (ingress / Dispatch chose the method).

**Don't** (service try body — isDone phase gate)

```js
await state.accept(ShortCircuitIfNoAccounts);
if (!state.isDone()) {
  await state.accept(FetchMemberNames);
  // …
}
state.setDone(false);
await state.accept(ListGenericActions);
```

**Do** (Call Steps → Module phases)

```js
await state.accept(GetAccountsByUserId);
await state.accept(CallBuildSaleHoldActions); // Step may guard; Module is flat accepts
await state.accept(CallMergeQueueActions);
await state.accept(FormatActionsHubResponse);
```

**Don't** (service try body — intent ladder)

```js
await state.accept(SetFormData);
if (intent === "dismiss-action") {
  await GenericActionsService.dismiss(state);
  return;
}
```

**Do** (Dispatch Step → Module method; Service stays flat)

```js
await state.accept(SetFormData);
await state.accept(DispatchActionsHubInteraction);
// Dispatch Step: ActionsHubInteractionsModule[methodByIntent[intent]](state)
```

**Don't** (service try body — HTTP verb / auth skip)

```js
await state.accept(HandleOptionsRequests);
if (!state.getShouldBypassAuth()) {
  await state.accept(ResolveMiddlewareIdentity);
}
```

**Do** (ingress maps verb → Service method; each method is a flat accept list)

```js
const serviceMethod = { OPTIONS: "options" }[request.method] ?? "process";
await RootAuthMiddlewareService[serviceMethod](state);
```

When the Service method stays one sequence and only the leaf write changes, pick a Strategy in a Step (`save-account-document.js`) instead.

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
