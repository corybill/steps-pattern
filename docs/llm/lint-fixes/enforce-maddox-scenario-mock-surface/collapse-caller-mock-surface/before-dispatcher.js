import Errr from "errr";

import PrimaryStrategy from "../strategies/member-posture/primary-strategy.js";
import LeaderStrategy from "../strategies/member-posture/leader-strategy.js";
import SwitchStrategy from "../strategies/member-posture/switch-strategy.js";
import SteadyStrategy from "../strategies/member-posture/steady-strategy.js";
import ResetStrategy from "../strategies/member-posture/reset-strategy.js";
import ReduceStrategy from "../strategies/member-posture/reduce-strategy.js";
import TimedStrategy from "../strategies/member-posture/timed-strategy.js";

/**
 * Teaching fixture (before). A service that fans out across seven
 * Strategy.execute calls. The ingress Maddox spec must mock each one
 * → 7 unique mockThisFunction → mock-surface lint.
 *
 * Not production. Distilled from the Partner-module extract decision.
 */
class ApplyMemberPosture {
  static async run(state) {
    try {
      await LeaderStrategy.execute(state);
      await SteadyStrategy.execute(state);
      await ResetStrategy.execute(state);
      await PrimaryStrategy.execute(state);
      await ReduceStrategy.execute(state);
      await TimedStrategy.execute(state);
      await SwitchStrategy.execute(state);
    } catch (err) {
      Errr.newError("ApplyMemberPosture.run failed").appendTo(err).throw();
    }
  }
}

export default ApplyMemberPosture;
