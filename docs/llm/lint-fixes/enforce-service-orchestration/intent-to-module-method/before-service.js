import Errr from "errr";

import GenericActionsService from "./generic-actions-service.js";
import HandleActionsInteraction from "../steps/handle-actions-interaction.js";
import SetFormData from "../steps/set-form-data.js";

/**
 * Teaching fixture (before). Service intent if-ladder that awaits sibling
 * Services. Trips enforce-service-orchestration.
 *
 * Not production. Distilled from actions-hub-service.handleInteraction.
 */
class ActionsHubService {
  static async handleInteraction(state) {
    try {
      await state.accept(SetFormData);

      const intent = state.getFromFormData("intent");
      const actionId = state.getFromFormData("actionId");
      const isGenericId = typeof actionId === "string"
        && !actionId.startsWith("sale:")
        && !actionId.startsWith("hold:");

      if (intent === "dismiss-action" && isGenericId) {
        state.setGenericActionId(actionId);
        await GenericActionsService.dismiss(state);
        return;
      }

      if (intent === "execute-generic-action" && isGenericId) {
        await GenericActionsService.execute(state);
        return;
      }

      await state.accept(HandleActionsInteraction);
    } catch (err) {
      Errr.newError("Could not handle interaction")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubService;
