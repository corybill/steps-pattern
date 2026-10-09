import AccountService from "@/server/services/account-service.js";
import AccountDetailState from "@/server/state/domains/account-detail-state.js";

/**
 * Teaching fixture (after). Create state, one Service, return from
 * state. RedirectAccountLayoutIndex / RedirectAccountMemberIndex throw
 * redirect inside the Service acceptAll.
 *
 * Not production. Distilled from accounts.$accountId.jsx.
 */
export async function loader(args) {
  try {
    const state = new AccountDetailState(args);
    await AccountService.getAccountLayout(state);
    return state.getResponse();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
