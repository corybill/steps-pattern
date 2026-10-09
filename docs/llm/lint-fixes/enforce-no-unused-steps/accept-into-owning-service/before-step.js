class EnqueueAfterWriteRefresh {
  static async next(state) {
    const userId = state.getUserModel()?.userId;
    await SqsProxy.sendMessage({
      type: "GENERIC_ACTIONS_REFRESH",
      userId,
      kinds: ["payments"],
    });
  }
}

export default EnqueueAfterWriteRefresh;
