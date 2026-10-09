import ActionsHubService from "@/server/services/actions-hub-service.js";
import ActionsHubState from "@/server/state/domains/actions-hub-state.js";

/**
 * Teaching fixture (after). Create state, one Service, return
 * state.getResponse(). FormatActionsHubResponse setResponse'd the DTO.
 *
 * Not production. Distilled from actions.jsx.
 */
export async function loader(args) {
  try {
    const state = new ActionsHubState(args);
    await ActionsHubService.getActionsHub(state);
    return state.getResponse();
  } catch (err) {
    throw err;
  }
}
