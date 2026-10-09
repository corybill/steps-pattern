# `enforce-outbound-class-method-call`

Outbound collaborators must be Class.method so Maddox can mockThisFunction.

| Preference | Recipe | Use when |
| :--- | :--- | :--- |
| preferred | [class-method-call](class-method-call/) | The callee leaves the process (or is DateProxy) |
| preferred | [in-process-in-step](in-process-in-step/) | The callee is in-process policy — put it on the Step |
| never | [hoist-in-process-onto-proxy](hoist-in-process-onto-proxy/) | Do not wrap Errr flags / caps / delay math as `Proxy.method` to silence this lint |

Rule guide: [`../../rules/enforce-outbound-class-method-call.md`](../../rules/enforce-outbound-class-method-call.md)
