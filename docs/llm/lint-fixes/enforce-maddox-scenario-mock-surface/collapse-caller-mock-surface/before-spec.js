import Maddox from "maddox";

import ApplyMemberPosture from "../../src/services/apply-member-posture.js";
import PrimaryStrategy from "../../src/strategies/member-posture/primary-strategy.js";
import LeaderStrategy from "../../src/strategies/member-posture/leader-strategy.js";
import SwitchStrategy from "../../src/strategies/member-posture/switch-strategy.js";
import SteadyStrategy from "../../src/strategies/member-posture/steady-strategy.js";
import ResetStrategy from "../../src/strategies/member-posture/reset-strategy.js";
import ReduceStrategy from "../../src/strategies/member-posture/reduce-strategy.js";
import TimedStrategy from "../../src/strategies/member-posture/timed-strategy.js";

const Scenario = Maddox.scenarios.FromPromiseScenario;

/**
 * Teaching fixture (before). Seven unique mockThisFunction pairs in one
 * it — over the max of 6. setup*/shouldBeCalledWith omitted for brevity;
 * the lint counts mockThisFunction, not assertion completeness.
 */
export function tooManyStrategyMocks(testCtx, context) {
  return new Scenario(testCtx)
    .mockThisFunction("LeaderStrategy", "execute", LeaderStrategy)
    .mockThisFunction("SteadyStrategy", "execute", SteadyStrategy)
    .mockThisFunction("ResetStrategy", "execute", ResetStrategy)
    .mockThisFunction("PrimaryStrategy", "execute", PrimaryStrategy)
    .mockThisFunction("ReduceStrategy", "execute", ReduceStrategy)
    .mockThisFunction("TimedStrategy", "execute", TimedStrategy)
    .mockThisFunction("SwitchStrategy", "execute", SwitchStrategy)
    .withEntryPoint(ApplyMemberPosture, "run")
    .withInputParams(context.inputParams)
    .test(() => {});
}
