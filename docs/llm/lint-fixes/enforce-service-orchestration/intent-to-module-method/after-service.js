import Errr from "errr";

import DispatchActionsHubInteraction from "../steps/dispatch-actions-hub-interaction.js";
import SetFormData from "../steps/set-form-data.js";

/**
 * Teaching fixture (after). Service stays a flat accept list. Intent
 * routing lives in the Dispatch Step → Module methods.
 *
 * Not production. Target shape for actions-hub-service.handleInteraction.
 */
class ActionsHubService {
  static async handleInteraction(state) {
    try {
      await state.accept(SetFormData);
      await state.accept(DispatchActionsHubInteraction);
    } catch (err) {
      Errr.newError("Could not handle interaction")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubService;
