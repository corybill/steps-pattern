class CalculateEngineSummaries {
  static async next(state) {
    const rows = await CalculateEngineSummaries._loadProjections(state);
    const scored = CalculateEngineSummaries._score(rows);
    const enriched = await CalculateEngineSummaries._enrich(scored);
    await CalculateEngineSummaries._writeSummaries(enriched);
  }

  static async _loadProjections() {}
  static _score() {}
  static async _enrich() {}
  static async _writeSummaries() {}
}

export default CalculateEngineSummaries;
