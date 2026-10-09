import Errr from "errr";

import ActionsHubModule from "../modules/actions-hub/actions-hub.js";

/**
 * Teaching fixture (after). Call Step wraps a Module phase. Empty-account
 * guard lives here (Steps may branch); Module try body stays flat.
 *
 * Not production.
 */
class CallBuildSaleHoldActions {
  static async next(state) {
    try {
      const accounts = state.getAccounts() || [];
      if (!state.getPartnerUserId() || accounts.length === 0) {
        state.setSaleActions([]);
        state.setHoldActions([]);
        return;
      }
      await ActionsHubModule.buildSaleHoldActions(state);
    } catch (err) {
      Errr.newError("CallBuildSaleHoldActions failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default CallBuildSaleHoldActions;
