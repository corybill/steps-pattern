/**
 * Teaching fixture (before). new URL + if, both branches 404.
 * enforce-controller-orchestration flags the VariableDeclaration and IfStatement.
 *
 * Not production.
 */
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    if (url.pathname.includes("/.well-known/")) {
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 404 });
  } catch (err) {
    throw err;
  }
}
