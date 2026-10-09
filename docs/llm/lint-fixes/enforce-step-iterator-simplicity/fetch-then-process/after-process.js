class ProcessRecords {
  static async next(state) {
    const batches = [];
    for (const { week, rows } of state.getFetchedPlayerStats() || []) {
      batches.push(flatten(rows, season, week));
    }
    await PlayerStatHistory.upsertManyBatches(batches);
  }
}
