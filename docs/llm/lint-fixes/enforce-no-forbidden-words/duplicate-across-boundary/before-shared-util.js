export function yearOf(row) {
  const y = row?.command?.args?.year;
  if (typeof y === "number" && Number.isFinite(y)) return y;
  if (typeof y === "string" && /^\d{4}$/.test(y)) return Number(y);
  return null;
}
