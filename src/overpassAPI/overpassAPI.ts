/**
 * Monuments Service
 * Handles fetching and processing monument data from Overpass API
 */

export interface Monument {
	id: number;
	lat: number;
	lon: number;
	tags: Record<string, string>;
}

interface OverpassElement {
	type: string;
	id: number;
	lat?: number;
	lon?: number;
	tags?: Record<string, string>;
}

/**
 * Fetch monuments from Overpass API with retry logic
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns Array of monuments found near the coordinates
 */
export async function fetchMonumentsFromOverpass(lat: number, lon: number): Promise<Monument[]> {
	// Simplified Overpass QL query - focus on historic nodes with names
	const overpassQuery = `[out:json][timeout:10];
(
  node["historic"]["name"](around:3000, ${lat}, ${lon});
);
out body;`;

	const maxRetries = 2;
	let lastError = "";

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

			const response = await fetch("https://overpass-api.de/api/interpreter", {
				method: "POST",
				body: overpassQuery,
				headers: {
					"Content-Type": "text/plain",
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				lastError = `HTTP ${response.status}`;
				// Retry on 504, 503, or 429 errors
				if ([504, 503, 429].includes(response.status) && attempt < maxRetries - 1) {
					await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1))); // Exponential backoff
					continue;
				}
				console.error(`Overpass API error: ${response.status}`);
				return [];
			}

			const data = (await response.json()) as { elements?: OverpassElement[] };
			const monuments: Monument[] = [];

			if (data.elements) {
				for (const element of data.elements) {
					if (element.type === "node" && element.lat && element.lon && element.tags) {
						const name = element.tags.name;
						const historicType = element.tags.historic || "historic";

						if (name) {
							monuments.push({
								id: element.id,
								lat: element.lat,
								lon: element.lon,
								tags: {
									name,
									type: historicType,
									description: element.tags.description || "",
									wikipedia: element.tags.wikipedia || "",
								},
							});
						}
					}
				}
			}

			console.log(`Successfully fetched ${monuments.length} monuments`);
			return monuments;
		} catch (error) {
			lastError = error instanceof Error ? error.message : "Unknown error";
			if (error instanceof Error && error.name === "AbortError") {
				lastError = "Request timeout";
			}
			console.error(`Attempt ${attempt + 1} failed:`, lastError);

			// Wait before retrying
			if (attempt < maxRetries - 1) {
				await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
			}
		}
	}

	console.error(`All retry attempts failed. Last error: ${lastError}`);
	return [];
}
