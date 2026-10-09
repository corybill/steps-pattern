class FetchMyAccountsHtml {
  static async next(state) {
    const years = [season, seasonPlusOne, seasonPlusTwo];
    const fetched = await Promise.all(
      years.map((year) =>
        BillingProxy.getMyAccountsHtml(year)
          .then((html) => ({ year, html }))
          .catch((err) => {
            if (year === season) throw err;
            return { year, html: null };
          })
      )
    );
    state.setYears(years);
    state.setFetchedMyAccountsPages(fetched);
  }
}
