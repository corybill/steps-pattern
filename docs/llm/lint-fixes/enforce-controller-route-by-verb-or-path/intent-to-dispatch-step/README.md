# intent-to-dispatch-step

```xml
<lint-fix-recipe>
  <meta>
    <rule-id>steps-pattern/enforce-controller-route-by-verb-or-path</rule-id>
    <slug>intent-to-dispatch-step</slug>
    <preference>preferred</preference>
    <recorded>2026-09-12</recorded>
  </meta>
  <problem>
    Route or Controller peeks formData/json/searchParams (intent) and indexes
    into FooService[method] / FooController[method].
  </problem>
  <when>
    Discriminator is a body field or querystring, not HTTP verb or pathname.
  </when>
  <decision>
    Keep ingress as one handleInteraction (or verb/path map only). Parse the
    body in SetFormData (or equivalent Step). Map intent → Module methods (or
    Strategy) inside a Dispatch Step. See routing-dispatch-choice.md.
  </decision>
  <do>
```export async function action(args) {
  const state = new WidgetState(args);
  await WidgetService.handleInteraction(state);
  return state.getResult();
}
// Service: accept(SetFormData); accept(DispatchWidgetInteraction);
```
  </do>
  <do-not>
```const ServiceMethodByIntent = { "run-a": "runA", "run-b": "runB" };
const formData = await args.request.formData();
await WidgetService[ServiceMethodByIntent[formData.get("intent")]](state);
```
  </do-not>
</lint-fix-recipe>
```
