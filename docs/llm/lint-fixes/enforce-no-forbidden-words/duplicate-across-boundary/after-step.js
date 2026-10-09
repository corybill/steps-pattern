import Errr from "errr";

function yearOf(row) {
  const y = row?.command?.args?.year;
  if (typeof y === "number" && Number.isFinite(y)) return y;
  if (typeof y === "string" && /^\d{4}$/.test(y)) return Number(y);
  return null;
}

class OrderBulkActionIds {
  static async next(state) {
    try {
      const rows = state.getBulkActionRows() || [];
      const ordered = [...rows].sort((a, b) => (yearOf(a) ?? 0) - (yearOf(b) ?? 0));
      state.setOrderedBulkActionIds(ordered.map((row) => row.id));
    } catch (err) {
      Errr.newError("OrderBulkActionIds failed").appendTo(err).throw();
    }
  }
}

export default OrderBulkActionIds;
