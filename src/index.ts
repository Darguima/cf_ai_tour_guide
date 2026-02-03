import { ChatDurableObject } from "./ChatDO";
import { fetchMonumentsFromOverpass, type Monument } from "./monuments";
import { handleChat } from "./chat";

/**
 * AI Tour Guide Worker
 * Main entry point for the Cloudflare Worker
 * Handles routing for:
 * - /api/monuments - Fetch monuments from Overpass API
 * - /api/chat - Forward chat requests to ChatDurableObject
 */

export { ChatDurableObject };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Route: /api/monuments - Fetch monuments near coordinates
		if (pathname === "/api/monuments" && request.method === "GET") {
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

		// Route: /api/chat - Forward to ChatDurableObject
		if (pathname === "/api/chat" && request.method === "POST") {
			return await handleChat(request, env);
		}

		// All other routes return 404 - assets are served automatically by the platform
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
