import { handleMonuments } from "./handlers/handleMonuments";
import { handleChat } from "./handlers/handleChat";

import { ChatDurableObject } from "./DurableObjects/ChatDO";

export { ChatDurableObject };

/**
 * AI Tour Guide Worker
 * Main entry point for the Cloudflare Worker
 * Handles routing for:
 * - /api/monuments - Fetch monuments from Overpass API
 * - /api/chat - Forward chat requests to ChatDurableObject
 */

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// Route: /api/monuments - Fetch monuments near coordinates
		if (pathname === "/api/monuments" && request.method === "GET") {
			return await handleMonuments(request, env);
		}

		// Route: /api/chat - Forward to ChatDurableObject
		if (pathname === "/api/chat" && (request.method === "POST" || request.method === "GET")) {
			return await handleChat(request, env);
		}

		// All other routes return 404 - assets are served automatically by the platform
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
