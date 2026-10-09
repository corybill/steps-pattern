await Promise.all(accounts.map((account) =>
  ApplyEngineValuations._processAccount({ state, account })
));
