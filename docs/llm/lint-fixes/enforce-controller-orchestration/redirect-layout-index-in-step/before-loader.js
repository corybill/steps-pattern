import { redirect } from "react-router";

import AccountService from "@/server/services/account-service.js";
import AccountDetailState from "@/server/state/domains/account-detail-state.js";

/**
 * Teaching fixture (before). Path if + redirect after the Service.
 * enforce-controller-orchestration forbids IfStatement in the try body.
 *
 * Not production.
 */
export async function loader(args) {
  const accountId = args.params.accountId;
  const url = new URL(args.request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || url.pathname;

  try {
    const state = new AccountDetailState(args);
    await AccountService.getAccountLayout(state);

    if (pathname === `/accounts/${accountId}/members`) {
      const selectedMemberId = state.getUserMember()?.memberSlotId;
      if (selectedMemberId) {
        return redirect(`/accounts/${accountId}/members/${selectedMemberId}`);
      }
      return redirect(`/accounts/${accountId}`);
    }

    return { account: state.getAccount()?.toJSON() ?? null };
  } catch (err) {
    throw err;
  }
}
