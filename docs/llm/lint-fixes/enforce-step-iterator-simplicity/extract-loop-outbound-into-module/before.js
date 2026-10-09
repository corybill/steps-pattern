class ParseHtmlPages {
  static async next(state) {
    const accounts = {};
    for (const [year, key] of Object.entries(state.getMyaccountsKeys() || {})) {
      const html = await S3Proxy.downloadText(key);
      const $ = cheerio.load(html);
      accounts[year] = parseRows($);
    }
    state.setAccounts(accounts);
  }
}
