import { fetchMonumentsFromOverpass, type Monument } from "../overpassAPI/overpassAPI";

/**
 * Monuments Service
 * Handles monuments endpoint using Overpass API
 */

/**
 * Handle monuments requests using Overpass API
 * @param request - The incoming request
 * @param env - Environment with bindings
 * @returns Response with monuments data
 */
export async function handleMonuments(request: Request, _env: Env): Promise<Response> {
  const url = new URL(request.url);

  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  if (!lat || !lon) {
    return new Response(JSON.stringify({ error: "Missing lat or lon parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const monuments: Monument[] = await fetchMonumentsFromOverpass(parseFloat(lat), parseFloat(lon));
    return new Response(JSON.stringify({ success: true, monuments }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
