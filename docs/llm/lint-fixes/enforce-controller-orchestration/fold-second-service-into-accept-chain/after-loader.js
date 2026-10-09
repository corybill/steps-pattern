import AdminValuationsService from "@/server/services/admin-valuations-service.js";
import AdminValuationsState from "@/server/state/domains/admin-valuations-state.js";

/**
 * Teaching fixture (after). One Service. AssertAdmin is accepted
 * inside getValuations.
 *
 * Not production. Distilled from admin.valuations.jsx.
 */
export async function loader(args) {
  try {
    const state = new AdminValuationsState(args);
    await AdminValuationsService.getValuations(state);
    return state.getResponse();
  } catch (err) {
    throw err;
  }
}
