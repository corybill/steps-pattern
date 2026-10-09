import Errr from "errr";

import ApplyContender from "../steps/apply-contender.js";
import ApplyLeader from "../steps/apply-leader.js";
import ApplyPivot from "../steps/apply-pivot.js";
import ApplySteady from "../steps/apply-steady.js";
import ApplyRebuilder from "../steps/apply-rebuilder.js";
import ApplyTank from "../steps/apply-tank.js";
import ApplyWindow from "../steps/apply-window.js";
import MemberPostureState from "../state/member-posture-state.js";

/**
 * Teaching fixture (after). Partner-shaped module: static async entry
 * that creates module state and acceptAlls the former strategy sequence.
 * Strategies may still run *inside* those steps; the caller never mocks them.
 *
 * Live canonical: sync/src/modules/partner.js
 */
class MemberPostureModule {
  static async apply(context) {
    try {
      const state = new MemberPostureState(context);
      await state.acceptAll([
        ApplyLeader,
        ApplySteady,
        ApplyRebuilder,
        ApplyContender,
        ApplyTank,
        ApplyWindow,
        ApplyPivot,
      ]);
      return state.getResult();
    } catch (err) {
      Errr.newError("MemberPostureModule.apply failed").appendTo(err).throw();
    }
  }
}

export default MemberPostureModule;
