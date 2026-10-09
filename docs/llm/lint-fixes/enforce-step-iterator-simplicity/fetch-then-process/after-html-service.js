class BillingSyncService {
  static async discoverBillingData(state) {
    await state.accept(FetchMyAccountsHtml);
    await state.accept(DiscoverBillingData);
  }
}
