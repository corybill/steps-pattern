# remove-options-branch

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-no-route-options-preflight</rule-id>
    <slug>remove-options-branch</slug>
    <preference>preferred</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>Route loader/action branches on OPTIONS.</problem>
  <when>This rule fires.</when>
  <decision>Delete the OPTIONS if; rootAuthMiddleware HandleOptionsRequests owns /api CORS preflight.</decision>
  <do>
```export async function action(args) {
  const state = new WidgetState(args);
  await WidgetService.run(state);
  return Response.json(state.getResponse());
}```
  </do>
  <do-not>
```if (args.request.method === "OPTIONS") {
  return Response.json({}, { status: 200, headers: corsHeaders });
}```
  </do-not>
</lint-fix-recipe>
```
