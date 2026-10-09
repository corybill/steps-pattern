import ActionsHubService from "@/server/services/actions-hub-service.js";
import ActionsHubState from "@/server/state/domains/actions-hub-state.js";

/**
 * Teaching fixture (before). Loader try builds a hub DTO from
 * context.get, coalesced getters, and maps. Route
 * VariableDeclarations that are not `new XxxState` trip
 * enforce-controller-orchestration.
 *
 * Not production. Distilled from actions.jsx.
 */
export async function loader(args) {
  const { context } = args;
  try {
    const state = new ActionsHubState(args);
    await ActionsHubService.getActionsHub(state);

    const userModel = context.get(appUserModelContext) ?? {};
    const syncStats = userModel.userSyncStats || {};

    return {
      accountCount: syncStats.totalAccounts ?? state.getAccounts().length,
      actions: state.getActions(),
      queueActions: (state.getQueueActions() || []).map(toQueueActionDto),
    };
  } catch (err) {
    throw err;
  }
}
