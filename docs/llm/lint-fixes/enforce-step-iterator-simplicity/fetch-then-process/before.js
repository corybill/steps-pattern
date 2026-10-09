class SyncPlayerStats {
  static async next(state) {
    const batches = [];
    for (let week = weekStart; week <= weekEnd; week++) {
      const fetched = await PartnerStatsProxy.fetchWeek({ season, week }) ?? [];
      batches.push(flatten(fetched, season, week));
    }
    await PlayerStatHistory.upsertManyBatches(batches);
  }
}
