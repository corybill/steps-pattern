class ParseHtmlPages {
  static async next(state) {
    const accounts = {};
    for (const [year, myaccountsKey] of Object.entries(state.getMyaccountsKeys() || {})) {
      const yearResult = await HtmlModule.parseYear({ year, myaccountsKey });
      Object.assign(accounts, yearResult?.accounts);
    }
    state.setAccounts(accounts);
  }
}
