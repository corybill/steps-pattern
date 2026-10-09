import Errr from "errr";

import GenericActionsModule from "../modules/generic-actions/generic-actions.js";
import HandleActionsInteraction from "./handle-actions-interaction.js";

/**
 * Teaching fixture (after). Dispatch Step maps form intent to explicit
 * Module.method calls (no computed callee — same as Billing Dispatch).
 *
 * Not production; production lives at the same path under app/server/steps/.
 */
function isGenericActionId(actionId) {
  return typeof actionId === "string"
    && !actionId.startsWith("sale:")
    && !actionId.startsWith("hold:");
}

class DispatchActionsHubInteraction {
  static async next(state) {
    try {
      const intent = state.getFromFormData("intent");
      const actionId = state.getFromFormData("actionId");
      const genericId = isGenericActionId(actionId);

      if (intent === "dismiss-action" && genericId) {
        state.setGenericActionId(actionId);
        await GenericActionsModule.dismiss(state);
        return;
      }

      if (intent === "execute-generic-action" && genericId) {
        await GenericActionsModule.execute(state);
        return;
      }

      await state.accept(HandleActionsInteraction);
    } catch (err) {
      if (err?.get?.("errResponse") || err instanceof Response) throw err;
      Errr.newError("DispatchActionsHubInteraction failed")
        .appendTo(err)
        .debug({ intent: state.getFromFormData?.("intent") })
        .throw();
    }
  }
}

export default DispatchActionsHubInteraction;
