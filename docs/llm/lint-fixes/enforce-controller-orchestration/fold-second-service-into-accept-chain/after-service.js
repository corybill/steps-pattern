import AssertAdmin from "../steps/assert-admin.js";
import FormatAdminValuationsResponse from "../steps/format-admin-valuations-response.js";
import SetAdminValuationsSeason from "../steps/set-admin-valuations-season.js";

/**
 * Teaching fixture (after). Fold the extra gate Step into the one
 * method the route calls.
 *
 * Not production. Distilled from admin-valuations-service.js.
 */
class AdminValuationsService {
  static async getValuations(state) {
    await state.accept(AssertAdmin);
    await state.accept(SetAdminValuationsSeason);
    await state.accept(FormatAdminValuationsResponse);
  }
}

export default AdminValuationsService;
