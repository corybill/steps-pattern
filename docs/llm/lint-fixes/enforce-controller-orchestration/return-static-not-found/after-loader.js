/**
 * Teaching fixture (after). One static 404. No URL parse, no if.
 *
 * Not production. Distilled from $.jsx.
 */
export async function loader() {
  try {
    return new Response(null, { status: 404 });
  } catch (err) {
    throw err;
  }
}
