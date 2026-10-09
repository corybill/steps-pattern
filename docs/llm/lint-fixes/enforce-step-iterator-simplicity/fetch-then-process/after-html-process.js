class DiscoverBillingData {
  static async next(state) {
    const accountsByYear = {};
    for (const { year, html } of state.getFetchedMyAccountsPages() || []) {
      accountsByYear[year] = html ? parseAccountIds(html) : [];
    }
    state.setAccountsByYear(accountsByYear);
  }
}
