import Errr from "errr";

class BuildMemberSelections {
  static async next(state) {
    try {
      const members = state.getMembers() || [];
      const account = state.getAccount() || {};

      const memberSelections = [];
      for (const member of members) {
        memberSelections.push({
          accountId: account.accountId,
          originalOwnerMemberId: member.memberSlotId,
          season: account.season,
        });
      }

      state.setMemberSelections(memberSelections);
    } catch (err) {
      Errr.newError("BuildMemberSelections failed")
        .debug({ args: state.getArgs() })
        .appendTo(err)
        .throw();
    }
  }
}

export default BuildMemberSelections;
