import Errr from "errr";

import HandleOptionsRequests from "../steps/handle-options-requests.js";
import RequireAuthenticated from "../steps/require-authenticated.js";
import ResolveMiddlewareIdentity from "../steps/resolve-middleware-identity.js";

/**
 * Teaching fixture (after). One flat accept list per verb pipeline.
 * Ingress chooses which method runs. No shouldBypass flag.
 *
 * Not production. Distilled from RootAuthMiddlewareService.
 */
class RootAuthMiddlewareService {
  static async options(state) {
    try {
      await state.accept(HandleOptionsRequests);
    } catch (err) {
      Errr.newError("RootAuthMiddlewareService.options failed")
        .appendTo(err)
        .throw();
    }
  }

  static async process(state) {
    try {
      await state.accept(ResolveMiddlewareIdentity);
      await state.accept(RequireAuthenticated);
    } catch (err) {
      Errr.newError("RootAuthMiddlewareService.process failed")
        .appendTo(err)
        .throw();
    }
  }
}

export default RootAuthMiddlewareService;
