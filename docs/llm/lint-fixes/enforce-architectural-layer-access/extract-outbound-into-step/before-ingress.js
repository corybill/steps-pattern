import SqsValuationsProxy from "./proxies/sqs-valuations-proxy.js";

export class Cron {
  static async enqueueDailySync(event = {}) {
    await SqsValuationsProxy.sendMessage({ type: "PLAYER_SYNC" });
    await SqsValuationsProxy.sendMessage({ type: "PROJECTIONS_SYNC" });
    return { statusCode: 200, body: "Success" };
  }
}
