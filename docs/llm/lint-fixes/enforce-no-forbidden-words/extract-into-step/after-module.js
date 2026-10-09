class Partner {
  static async generateNewMemberSelections(state) {
    try {
      await state.accept(GetPublicSaledPicks);
      await state.accept(BuildMemberSelections);
      await state.acceptAll([SaveTransferredPicks, SaveMemberSelections]);
    } catch (err) {
      Errr.newError("Partner.generateNewMemberSelections failed")
        .debug({ accountId: state.getAccountId() })
        .appendTo(err)
        .throw();
    }
  }
}

export default Partner;
