import { redirect } from "react-router";

/**
 * Teaching fixture (after). Index path throws redirect. Stay path
 * is a no-op so the Service continues to Format*.
 *
 * Not production. Distilled from redirect-account-layout-index.js.
 */
class RedirectAccountLayoutIndex {
  static async next(state) {
    const accountId = state.getFromPathParams("accountId");
    const pathname = String(state.getUrlPathName() || "").replace(/\/+$/, "") || "/";
    if (pathname !== `/accounts/${accountId}`) return;
    throw redirect(`/accounts/${accountId}/overview`);
  }
}

export default RedirectAccountLayoutIndex;
