import AgentChatHistoryService from "@/server/services/agent-chat-history-service.js";
import AgentChatHistoryState from "@/server/state/domains/agent-chat-history-state.js";

/**
 * Teaching fixture (after). One computed Service call. Unknown verbs
 * have no method name → throw 405 before the call, outside try, or via
 * a dedicated Service.methodNotAllowed if you need it inside try.
 *
 * Not production. Distilled from the root-auth verb map applied to a route.
 */
const serviceMethodByVerb = {
  PATCH: "rename",
  DELETE: "delete",
};

export async function action(args) {
  const method = args.request.method.toUpperCase();
  const serviceMethod = serviceMethodByVerb[method];
  if (!serviceMethod) {
    throw Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const state = new AgentChatHistoryState(args);
  try {
    await AgentChatHistoryService[serviceMethod](state);
    return Response.json({ chat: state.getAgentChat(), ok: true });
  } catch (err) {
    throw err;
  }
}
