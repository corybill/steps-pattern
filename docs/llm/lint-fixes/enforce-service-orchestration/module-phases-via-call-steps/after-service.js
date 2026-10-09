import Errr from "errr";
import Preconditions from "preconditions";

import CallBuildSaleHoldActions from "../steps/call-build-sale-hold-actions.js";
import CallMergeQueueActions from "../steps/call-merge-queue-actions.js";
import FilterAccountsToCurrentSeason from "../steps/domains/filter-accounts-to-current-season.js";
import FormatActionsHubResponse from "../steps/format-actions-hub-response.js";
import GetAccountsByUserId from "../steps/domains/get-accounts-by-user-id.js";

const preconditions = Preconditions.errr();

/**
 * Teaching fixture (after). Service is a short flat accept list. Heavy
 * phases live on a Module; Call* Steps wrap Module.method(state).
 *
 * Not production. Target shape for actions-hub-service.getActionsHub.
 */
class ActionsHubService {
  static async getActionsHub(state) {
    try {
      preconditions.shouldBeDefined(state.getPartnerUserId(), "Member ID is required").test();

      await state.accept(GetAccountsByUserId);
      await state.accept(FilterAccountsToCurrentSeason);
      await state.accept(CallBuildSaleHoldActions);
      await state.accept(CallMergeQueueActions);
      await state.accept(FormatActionsHubResponse);
    } catch (err) {
      Errr.newError("Could not load actions hub")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubService;
