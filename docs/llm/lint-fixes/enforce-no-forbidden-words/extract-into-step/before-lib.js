export function buildMemberSelections({ members, account, drafts, transferredPicks }) {
  const memberSelections = [];
  // … slot order, seasons, saled-pick overlay …
  return memberSelections;
}

export function mapMemberSelections(rows) {
  const memberSelectionsMap = new Map();
  for (const row of rows || []) {
    memberSelectionsMap.set(
      `${row.accountId}_${row.season}_${row.round}_${row.originalOwnerMemberId}`,
      row,
    );
  }
  return memberSelectionsMap;
}
