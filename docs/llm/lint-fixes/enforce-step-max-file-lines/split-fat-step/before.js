class ApplyEngineValuations {
  static async next(state) {
    const accounts = state.getAccounts() || [];
    await Promise.all(accounts.map((account) =>
      ApplyEngineValuations._processAccount({ state, account })));
  }

  static async _processAccount({ state, account }) {
    const engine = await ApplyEngineValuations._fetchEngineValues({ state, account });
    const catalogRows = await ApplyEngineValuations._loadCatalogRows(account);
    ApplyEngineValuations._enrichAnalyses({ account, engine, catalogRows });
  }

  static async _fetchEngineValues() {}
  static async _loadCatalogRows() {}
  static _enrichAnalyses() {}
}

export default ApplyEngineValuations;
