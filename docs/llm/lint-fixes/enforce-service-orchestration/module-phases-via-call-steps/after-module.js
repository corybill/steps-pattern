import Errr from "errr";

import AppendGenericQueueActions from "../../steps/append-generic-queue-actions.js";
import AttachSaleQueueActionIds from "../../steps/attach-sale-queue-action-ids.js";
import BuildSaleActions from "../../steps/build-sale-actions.js";
import ComputeActionsCountByType from "../../steps/compute-actions-count-by-type.js";
import DedupeGenericActions from "../../steps/dedupe-generic-actions.js";
import ApplyEngineValuations from "../../steps/domains/apply-engine-valuations.js";
import ApplyCatalogAdjustments from "../../steps/domains/apply-catalog-adjustments.js";
import BuildSalePlayerIndex from "../../steps/domains/build-sale-player-index.js";
import BuildHoldActions from "../../steps/domains/build-hold-actions.js";
import FetchMemberNames from "../../steps/domains/fetch-member-names.js";
import FetchSaleTransactions from "../../steps/domains/fetch-sale-transactions.js";
import FinalizeSaleActions from "../../steps/finalize-sale-actions.js";
import ListGenericActions from "../../steps/list-generic-actions.js";
import MapSaleActionsToGenericQueue from "../../steps/map-sale-actions-to-generic-queue.js";
import MarkStaleGenericActions from "../../steps/mark-stale-generic-actions.js";
import PersistSaleGenericActions from "../../steps/persist-sale-generic-actions.js";
import SortActions from "../../steps/sort-actions.js";
import SuppressResolvedSaleActions from "../../steps/suppress-resolved-sale-actions.js";

/**
 * Teaching fixture (after). Module phases: flat accept chains only.
 * Call Steps own empty-account / empty-sale guards. No setDone / isDone.
 *
 * Not production.
 */
class ActionsHubModule {
  static async buildSaleHoldActions(state) {
    try {
      await state.accept(FetchMemberNames);
      await state.accept(FetchSaleTransactions);
      await state.accept(BuildSalePlayerIndex);
      await state.acceptAll([BuildSaleActions, BuildHoldActions]);
      await state.accept(ApplyCatalogAdjustments);
      await state.accept(ApplyEngineValuations);
      await state.accept(FinalizeSaleActions);
      await state.accept(SortActions);
      await state.accept(MapSaleActionsToGenericQueue);
      await state.accept(PersistSaleGenericActions);
    } catch (err) {
      Errr.newError("ActionsHubModule.buildSaleHoldActions failed")
        .appendTo(err)
        .throw();
    }
  }

  static async mergeQueueActions(state) {
    try {
      await state.accept(ListGenericActions);
      await state.accept(MarkStaleGenericActions);
      await state.accept(SuppressResolvedSaleActions);
      await state.accept(AttachSaleQueueActionIds);
      await state.accept(ComputeActionsCountByType);
      await state.accept(DedupeGenericActions);
      await state.accept(AppendGenericQueueActions);
    } catch (err) {
      Errr.newError("ActionsHubModule.mergeQueueActions failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default ActionsHubModule;
