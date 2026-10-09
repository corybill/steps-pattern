class LedgerWriteService {
  static async saveTransaction(state) {
    try {
      await state.accept(ParseTransactionPayload);
      await state.accept(SaveTransaction);
      await state.accept(EnqueueAfterWriteRefresh);
      await state.accept(IndexPaymentDocs);
    } catch (err) {
      Errr.newError("LedgerWriteService.saveTransaction failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default LedgerWriteService;
