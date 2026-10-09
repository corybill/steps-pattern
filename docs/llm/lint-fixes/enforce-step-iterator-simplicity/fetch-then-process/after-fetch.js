class FetchRecords {
  static async next(state) {
    const weeks = [];
    for (let week = weekStart; week <= weekEnd; week++) weeks.push(week);
    const fetched = await Promise.all(
      weeks.map((week) =>
        PartnerStatsProxy.fetchWeek({ season, week }).then((rows) => ({
          week,
          rows: rows ?? []
        }))
      )
    );
    state.setFetchedPlayerStats(fetched);
  }
}
