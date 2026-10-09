function yearOfRow(row) {
  const y = row?.command?.args?.year;
  if (typeof y === "number" && Number.isFinite(y)) return y;
  if (typeof y === "string" && /^\d{4}$/.test(y)) return Number(y);
  return null;
}

export function useBulkActionRun({ rowById }) {
  const skippedYears = new Set();

  function shouldSkip(row) {
    const year = yearOfRow(row);
    return year != null && skippedYears.has(year);
  }

  return { shouldSkip, rowById };
}
