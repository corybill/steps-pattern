import Errr from "errr";

import HandleOptionsRequests from "../steps/handle-options-requests.js";
import RequireAuthenticated from "../steps/require-authenticated.js";
import ResolveMiddlewareIdentity from "../steps/resolve-middleware-identity.js";

/**
 * Teaching fixture (before). A Service that short-circuits later accepts
 * with if (state.getShouldBypassAuth()). That IfStatement trips
 * enforce-service-orchestration.
 *
 * Not production. Distilled from RootAuthMiddlewareService.
 */
class RootAuthMiddlewareService {
  static async process(state) {
    try {
      await state.accept(HandleOptionsRequests);
      if (!state.getShouldBypassAuth()) {
        await state.accept(ResolveMiddlewareIdentity);
        await state.accept(RequireAuthenticated);
      }
    } catch (err) {
      Errr.newError("RootAuthMiddlewareService.process failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default RootAuthMiddlewareService;
