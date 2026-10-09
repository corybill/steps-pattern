import AgentChatHistoryService from "@/server/services/agent-chat-history-service.js";
import AgentChatHistoryState from "@/server/state/domains/agent-chat-history-state.js";

/**
 * Teaching fixture (before). Route action branches on verb inside try.
 * enforce-controller-orchestration forbids IfStatement in the try body
 * and more than one Service call.
 *
 * Not production. Distilled from api.agent.chats.$agentChatId.jsx.
 */
export async function action(args) {
  const method = args.request.method.toUpperCase();
  const state = new AgentChatHistoryState(args);

  try {
    if (method === "PATCH") {
      await AgentChatHistoryService.rename(state);
      return Response.json({ chat: state.getAgentChat() });
    }

    if (method === "DELETE") {
      await AgentChatHistoryService.delete(state);
      return Response.json({ ok: true });
    }

    throw Response.json({ error: "Method Not Allowed" }, { status: 405 });
  } catch (err) {
    throw err;
  }
}
