import Errr from "errr";

import FetchMemberNames from "../steps/domains/fetch-member-names.js";
import FormatActionsHubResponse from "../steps/format-actions-hub-response.js";
import GetAccountsByUserId from "../steps/domains/get-accounts-by-user-id.js";
import ListGenericActions from "../steps/list-generic-actions.js";
import ShortCircuitIfNoAccounts from "../steps/short-circuit-if-no-accounts.js";

/**
 * Teaching fixture (before). Service uses isDone / setDone to skip a
 * heavy phase then re-enter the Queue phase. Trips
 * enforce-service-orchestration and encodes the isDone anti-pattern.
 *
 * Not production. Distilled from actions-hub-service.getActionsHub.
 */
class ActionsHubService {
  static async getActionsHub(state) {
    try {
      await state.accept(GetAccountsByUserId);
      await state.accept(ShortCircuitIfNoAccounts);

      if (!state.isDone()) {
        await state.accept(FetchMemberNames);
        // … many more accepts …
      }

      state.setDone(false);
      await state.accept(ListGenericActions);
      await state.accept(FormatActionsHubResponse);
    } catch (err) {
      Errr.newError("Could not load actions hub")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubService;
