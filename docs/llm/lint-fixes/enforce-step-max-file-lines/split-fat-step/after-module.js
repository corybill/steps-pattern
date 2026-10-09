class EngineValuationsModule {
  static async processAccount(context) {
    const state = new EngineValuationsState(context);
    await state.acceptAll([
      FetchEngineValues,
      LoadCatalogRows,
      EnrichAnalyses
    ]);
    return { analyses: state.getAnalyses() };
  }
}

export default EngineValuationsModule;
