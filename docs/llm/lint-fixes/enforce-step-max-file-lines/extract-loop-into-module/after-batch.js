class ApplyEngineValuations {
  static async next(state) {
    try {
      const accounts = state.getAccounts() || [];
      await Promise.all(accounts.map((account) => EngineValuationsModule.processAccount({ account })));
    } catch (err) {
      Errr.newError("ApplyEngineValuations failed").appendTo(err).throw();
    }
  }
}

export default ApplyEngineValuations;
