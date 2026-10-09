import Errr from "errr";

import MemberPostureModule from "../modules/member-posture.js";

/**
 * Teaching fixture (after). The former dispatcher now invokes one module
 * method. Ingress Maddox mocks MemberPostureModule.apply only.
 */
class ApplyMemberPosture {
  static async run(state) {
    try {
      const result = await MemberPostureModule.apply({
        accountId: state.getAccountId(),
        memberSlotId: state.getMemberId(),
      });
      state.setMemberPosture(result);
    } catch (err) {
      Errr.newError("ApplyMemberPosture.run failed").appendTo(err).throw();
    }
  }
}

export default ApplyMemberPosture;
