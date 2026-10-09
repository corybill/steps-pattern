import Errr from "errr";

import AssertGenericActionOwner from "../../steps/assert-generic-action-owner.js";
import HandleActionsInteraction from "../../steps/handle-actions-interaction.js";
import LoadGenericActionById from "../../steps/load-generic-action-by-id.js";
import PersistGenericActionStatus from "../../steps/persist-generic-action-status.js";
import SetGenericActionIdFromForm from "../../steps/set-generic-action-id-from-form.js";

/**
 * Teaching fixture (after). One Module; each static method is a flat
 * accept chain (the "strategy"). All intents live in this module.
 *
 * Not production. Distilled from BillingPaymentsModule + the
 * Actions Hub intent ladder.
 */
class ActionsHubInteractionsModule {
  static async dismiss(state) {
    try {
      await state.accept(SetGenericActionIdFromForm);
      await state.accept(LoadGenericActionById);
      await state.accept(AssertGenericActionOwner);
      await state.accept(PersistGenericActionStatus);
    } catch (err) {
      Errr.newError("ActionsHubInteractionsModule.dismiss failed")
        .appendTo(err)
        .throw();
    }
  }

  static async execute(state) {
    try {
      await state.accept(SetGenericActionIdFromForm);
      // …flat accept chain for execute
    } catch (err) {
      Errr.newError("ActionsHubInteractionsModule.execute failed")
        .appendTo(err)
        .throw();
    }
  }

  static async legacy(state) {
    try {
      await state.accept(HandleActionsInteraction);
    } catch (err) {
      Errr.newError("ActionsHubInteractionsModule.legacy failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubInteractionsModule;
