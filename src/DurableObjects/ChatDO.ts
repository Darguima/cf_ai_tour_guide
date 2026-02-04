import { DurableObject } from "cloudflare:workers";

interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

interface ChatRequest {
	message: string;
	context: {
		monumentName: string;
		city: string;
	};
}

/**
 * ChatDurableObject - Manages conversation history and AI responses for each monument
 * Uses Durable Object storage to persist chat history
 */
export class ChatDurableObject extends DurableObject {
	private conversationHistory: ChatMessage[] = [];
	private isInitialized = false;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * Load conversation history from storage on first access
	 */
	private async ensureInitialized(monumentName: string, city: string): Promise<void> {
		if (this.isInitialized) return;

		try {
			const stored = await this.ctx.storage.get<ChatMessage[]>("messages");
			if (stored) {
				this.conversationHistory = stored;
			} else {
				// Initialize with system prompt
				const systemPrompt = `You are an expert historian specializing in ${monumentName} in ${city}. Explain history concisely and engagingly. When discussing this monument, provide accurate historical facts, interesting anecdotes, and context about its cultural significance.`;
				this.conversationHistory = [
					{
						role: "system",
						content: systemPrompt,
					},
				];
				await this.ctx.storage.put("messages", this.conversationHistory);
			}
		} catch (error) {
			console.error("Failed to load chat history:", error);
			const systemPrompt = `You are an expert historian specializing in ${monumentName} in ${city}. Explain history concisely and engagingly.`;
			this.conversationHistory = [
				{
					role: "system",
					content: systemPrompt,
				},
			];
		}

		this.isInitialized = true;
	}

	/**
	 * Handle chat messages and generate AI responses
	 */
	async fetch(request: Request): Promise<Response> {
		try {
			if (request.method === "GET") {
				const url = new URL(request.url);
				const monumentName = url.searchParams.get("monumentName");
				const city = url.searchParams.get("city");

				if (!monumentName || !city) {
					return new Response("Invalid request: missing monumentName or city", { status: 400 });
				}

				await this.ensureInitialized(monumentName, city);
				const visibleMessages = this.conversationHistory.filter((message) => message.role !== "system");

				return new Response(
					JSON.stringify({
						success: true,
						messages: visibleMessages,
					}),
					{ headers: { "Content-Type": "application/json" } }
				);
			}

			if (request.method !== "POST") {
				return new Response("Method not allowed", { status: 405 });
			}

			const body: ChatRequest = await request.json();
			const { message, context } = body;

			if (!message || !context || !context.monumentName || !context.city) {
				return new Response("Invalid request: missing message or context", { status: 400 });
			}

			// Ensure conversation is initialized
			await this.ensureInitialized(context.monumentName, context.city);

			// Add user message to history
			this.conversationHistory.push({
				role: "user",
				content: message,
			});

			// Generate AI response using Workers AI
			const aiResponse = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
				messages: this.conversationHistory,
				max_tokens: 512,
			} as { messages: ChatMessage[]; max_tokens: number });

			const assistantMessage = (aiResponse as { response?: string }).response || "";

			// Add assistant response to history
			this.conversationHistory.push({
				role: "assistant",
				content: assistantMessage,
			});

			// Save updated history to storage
			await this.ctx.storage.put("messages", this.conversationHistory);

			return new Response(
				JSON.stringify({
					success: true,
					response: assistantMessage,
				}),
				{
					headers: { "Content-Type": "application/json" },
				}
			);
		} catch (error) {
			console.error("Chat error:", error);
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
}
