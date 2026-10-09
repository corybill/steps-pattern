import AdminService from "@/server/services/admin-service.js";
import AdminValuationsService from "@/server/services/admin-valuations-service.js";
import AdminValuationsState from "@/server/state/domains/admin-valuations-state.js";

/**
 * Teaching fixture (before). Two Service calls. The rule allows one.
 *
 * Not production.
 */
export async function loader(args) {
  try {
    const state = new AdminValuationsState(args);
    await AdminService.assertAdmin(state);
    await AdminValuationsService.getValuations(state);
    return state.getResponse();
  } catch (err) {
    throw err;
  }
}
