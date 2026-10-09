const ids = [];
for (const row of rows) {
  if (row.playerId) ids.push(String(row.playerId));
}
