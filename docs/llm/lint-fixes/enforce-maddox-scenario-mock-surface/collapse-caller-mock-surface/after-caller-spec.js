import Maddox from "maddox";

import MemberPostureModule from "../../src/modules/member-posture.js";
import ApplyMemberPosture from "../../src/services/apply-member-posture.js";

const Scenario = Maddox.scenarios.FromPromiseScenario;

/**
 * Teaching fixture (after). One unique mockThisFunction — under the max
 * of 6. The module spec (not shown) owns the outbound mocks for the
 * steps that used to be strategies.
 */
export function oneModuleMock(testCtx, context) {
  return new Scenario(testCtx)
    .mockThisFunction("MemberPostureModule", "apply", MemberPostureModule)
    .withEntryPoint(ApplyMemberPosture, "run")
    .withInputParams(context.inputParams)
    .shouldBeCalledWith("MemberPostureModule", "apply", context.memberPostureModuleApplyParams)
    .doesReturnWithPromise("MemberPostureModule", "apply", context.memberPostureModuleApplyResponse)
    .test(() => {});
}
