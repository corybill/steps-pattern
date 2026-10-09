export function ordinalRoundLabel(round) {
  if (round === 1) return "1st";
  if (round === 2) return "2nd";
  if (round === 3) return "3rd";
  if (round != null && Number.isFinite(Number(round))) return `${round}th`;
  return "Pick";
}

export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
