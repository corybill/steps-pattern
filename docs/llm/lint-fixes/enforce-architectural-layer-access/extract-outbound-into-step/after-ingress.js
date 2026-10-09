import { LambdaWorkerService } from "./services/lambda-worker-service.js";
import State from "./state/state.js";

export class Cron {
  static async enqueueDailySync(event = {}) {
    const state = new State({ season: String(new Date().getFullYear()) });
    await LambdaWorkerService.enqueueDailySync(state);
    return { statusCode: 200, body: "Success" };
  }
}
