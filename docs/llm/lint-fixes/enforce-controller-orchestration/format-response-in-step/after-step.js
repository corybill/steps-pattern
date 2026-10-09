/**
 * Teaching fixture (after). Last accept in the Service writes the
 * loader DTO onto state.response. userModel is already on State.
 *
 * Not production. Distilled from format-actions-hub-response.js.
 */
class FormatActionsHubResponse {
  static async next(state) {
    const syncStats = state.getUserModel()?.userSyncStats || {};

    state.setResponse({
      accountCount: syncStats.totalAccounts ?? state.getAccounts().length,
      actions: state.getActions(),
      queueActions: (state.getQueueActions() || []).map(FormatActionsHubResponse._toQueueActionDto),
    });
  }
}

export default FormatActionsHubResponse;
