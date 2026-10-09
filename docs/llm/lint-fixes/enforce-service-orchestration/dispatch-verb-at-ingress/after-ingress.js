import RootAuthMiddlewareService from "../services/root-auth-middleware-service.js";
import RootAuthMiddlewareState from "../state/domains/root-auth-middleware-state.js";

/**
 * Teaching fixture (after). Ingress maps HTTP verb → Service method name
 * and calls Service[method](state). Unknown verbs fall through to process.
 * Routes may use the same computed call (one Service invocation).
 *
 * Not production. Distilled from root-auth.middleware.js.
 */
const serviceMethodByVerb = {
  OPTIONS: "options",
  GET: "process",
  POST: "process",
};

export async function rootAuthMiddleware({ request, context }, next) {
  const state = new RootAuthMiddlewareState({ request, context });
  const serviceMethod = serviceMethodByVerb[request.method] ?? "process";
  await RootAuthMiddlewareService[serviceMethod](state);

  const response = state.getResponse();
  if (response) return response;
  if (typeof next === "function") return await next();
}
