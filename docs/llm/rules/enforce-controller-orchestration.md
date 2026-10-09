# enforce-controller-orchestration

## Rule id

`steps-pattern/enforce-controller-orchestration`

## Intent (from ESLint rule)

Controllers orchestrate one Service call (same method name) inside try/catch with Errr. Remix **routes** are either:

1. **Thin Router (preferred for UI):** optional verb/path `if`, then `return *Controller.*(args)` — no State, no Service, no try on the route.
2. **Legacy:** try/catch with State + one Service call (until migrated).

See `.cursor/rules/routes.mdc` and `backend-services.mdc`.

## When this rule applies

This rule is enabled only where your ESLint flat config applies `steps-pattern/enforce-controller-orchestration` (see `files` globs in the consumer repo, e.g. `your eslint.config.js`).

This is **not** `enforce-maddox-scenario-mock-surface`. A wide Maddox mock list on a thin ingress is a different rule and a different recipe tree.

## Correct fix (checklist)

1. Read the ESLint message and the reported AST node / line.
2. Infer the **architectural** intent (orchestration vs business logic, test contract, layer access, etc.).
3. If the message has a **Fixes:** line, open that recipe index. For HTTP **verb** splits, use **dispatch-verb-at-ingress** (`Service[method](state)`), not `if` inside the try. **Never** map body `intent` or querystring to Service methods on the route — that is **intent-to-module-method** / Strategy under `enforce-service-orchestration` (see [`framework/routing-dispatch-choice.md`](../framework/routing-dispatch-choice.md)). When the same registration-stage bounce lives on many routes (or the stay path builds loader data), use **extract-registration-wizard-service**. When a layout/tab Service already loads data and the bounce is pathname / member / season, use **redirect-layout-index-in-step**. When the loader/action maps, coalesces, or `context.get`s a DTO after the Service, use **format-response-in-step**. When the route awaits a second Service (assert then load), use **fold-second-service-into-accept-chain**. When every splat branch is 404, use **return-static-not-found**. For one isolated key → `throw redirect` with no Service, **map-key-to-throw-redirect** is enough.
4. Refactor code or tests to satisfy the rule without weakening guarantees.

## What good looks like

**UI thin Router → Controller**

```js
export async function loader(args) {
  return ActionsHubController.getActionsHub(args);
}
```

```js
class ActionsHubController {
  static async getActionsHub(args) {
    try {
      const state = new ActionsHubState(args);
      await ActionsHubService.getActionsHub(state);
      return state.getResponse();
    } catch (err) {
      const errr = Errr.newError("Error loading actions hub").appendTo(err).get();
      LoggerProxy.error("Error loading actions hub", {}, errr);
      throw errr;
    }
  }
}
```

**Don't** (thin body calling Service)

```js
export async function action(args) {
  return ActionsHubService.handleInteraction(args);
}
```

Use small, realistic snippets from the same layer (service, module, step, spec) as the violation. The app repo’s `spec/` and `src/` trees contain canonical patterns.

**Don't** (route loader)

```js
const url = new URL(args.request.url);
await WidgetService.run(state);
if (!isIndexPath(url.pathname)) {
  return { result: state.getResult() };
}
await AccountService.getAccountLayout(state);
return redirect(`/widget/${state.getResult()}`);
```

**Don't** (view bag in the route — search params and identity the parent already has)

```js
const seasons = state.getStandingsSeasons();
const url = new URL(args.request.url);
const yearParam = url.searchParams.get("year");
const userModel = state.getUserModel();
return {
  seasons,
  yearParam,
  meOwnerId: userModel?.memberId ? String(userModel.memberId) : null,
};
```

**Do** (return the model or one state partial)

```js
const state = new AccountDetailState(args);
await AccountService.getStandingsTab(state);
return { seasons: state.getStandingsSeasons() };
```

The view reads `?year=` with `useSearchParams` and identity from the parent layout. Prefer a domain model `.toJSON()` (member, account) or one getter. A Format* Step is only for a real multi-field payload (`actions.jsx`); do not Format a view bag to silence the VariableDeclaration hit.

Index checks, empty groups, and redirects belong in a Step. A second service call belongs inside the one service method's `acceptAll` (fold the extra Step; do not call Service B from the route). A splat whose every branch is 404 should `return new Response(null, { status: 404 })` — do not invent a NotFoundService.

**Don't** (two Service calls)

```js
await AdminService.assertAdmin(state);
await AdminValuationsService.getValuations(state);
```

**Do** (one method accepts the gate Step)

```js
await AdminValuationsService.getValuations(state);
return state.getResponse();
```

`getValuations` starts with `await state.accept(AssertAdmin)`.

## Do not

- Do not add `eslint-disable`, `eslint-disable-next-line`, or blanket config overrides to silence this rule without fixing the underlying issue.
- Do not rename files, paths, or identifiers solely to bypass path-based rules (e.g. forbidden path tokens).
- Do not delete or hollow out tests to avoid coverage rules.

## Related docs

Follow `.cursor/rules/` paths mentioned in the rule description when working in app; for other repos, mirror those conventions in your own docs or vendor this package’s `docs/llm/framework/` guides.
