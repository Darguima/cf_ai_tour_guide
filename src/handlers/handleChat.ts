/**
 * Chat Service
 * Handles chat endpoint and forwards requests to ChatDurableObject
 */

/**
 * Handle chat requests and forward to ChatDurableObject
 * @param request - The incoming request
 * @param env - Environment with bindings
 * @returns Response from ChatDurableObject
 */
export async function handleChat(request: Request, env: Env): Promise<Response> {
	try {
		   const body = await request.json() as { doId?: string; [key: string]: any };

		   const doName = body.doId;

		   if (!doName) {
			   return new Response(JSON.stringify({ error: "Missing doId parameter" }), {
				   status: 400,
				   headers: { "Content-Type": "application/json" },
			   });
		   }

		   // Get a stub to the ChatDurableObject using the provided name
		   const stub = env.CHAT_DO.get(env.CHAT_DO.idFromName(doName));

		   // Forward the request to the Durable Object
		   const chatResponse = await stub.fetch(
			   new Request(request.url, {
				   method: "POST",
				   body: JSON.stringify(body),
				   headers: { "Content-Type": "application/json" },
			   })
		   );

		   return chatResponse;
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
