class LambdaWorkerService {
  static async recalculateEngineSummaries(state) {
    try {
      await state.acceptAll([LoadMarketRows, LoadEngineRows]);
      await state.accept(JoinValuationRows);
      await state.acceptAll([WriteSummaries, WriteAuditLog]);
    } catch (err) {
      Errr.newError("LambdaWorkerService.recalculateEngineSummaries failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default LambdaWorkerService;
