import SqsValuationsProxy from "../proxies/sqs-valuations-proxy.js";

class EnqueueDailyValuationsSync {
  static async next(state) {
    const season = String(state.getArgs()?.season);
    await SqsValuationsProxy.sendMessage({ type: "PLAYER_SYNC" });
    await SqsValuationsProxy.sendMessage({
      type: "PROJECTIONS_SYNC",
      season,
      weekStart: 1,
      weekEnd: 18,
    });
  }
}

export default EnqueueDailyValuationsSync;
