class HtmlModule {
  static async parseYear(context) {
    const state = new HtmlParseState(context);
    await state.accept(DownloadYearHtml);
    await state.accept(ParseYearRows);
    return { accounts: state.getAccounts() };
  }
}
