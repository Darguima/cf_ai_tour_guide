# Prompt to generate .github/copilot-instructions.md (with context of Cloudflare Internship Project)

I want to complete my AI assignment. I’m going to do it with the help of Github Copilot, so I’m here to ask for your help. First, let me present my idea:

I want to build a website (hosted on Cloudflare Pages). This website will feature a map. The user provides a location—they can click anywhere on the map, use their current location, or choose from a list of hardcoded default locations. All three options should be available and clear in the interface.

Once a position is marked on the map, the webpage fetches data from an API to find all monuments near that location. This API is a Cloudflare Worker. It will use the Overpass API to search for tourist-relevant monuments in that area and return them.

These monuments are then displayed on the same map. The user can click on a monument; upon selection, a chat interface appears where an LLM is prompted: 'Explain the history of the monument [Name] in the city [City].' Once the response arrives, the user can continue the conversation. This LLM component should also use Cloudflare Workers AI and Durable Objects to maintain the conversation state.

I have already created the Cloudflare project using the 'Hello World' template with the 'Workers + Durable Objects + Assets' option.

What I need now: Since I am using Github Copilot, I need you to create a .github/copilot-instructions.md file with useful rules to build this project quickly for my application."

- - -

# Prompt to generate the project

Please act as a Senior Cloudflare Developer. I have defined the project architecture and requirements in the `.github/copilot-instructions.md` file in my workspace.

Based on that file, I need you to scaffold the full project code. Please provide the code needed fot the application. Here are some important notes to consider:

1. **`wrangler.jsonc`**:
   - Configure the `[durable_objects]` binding (class name: `ChatDurableObject`).
   - Configure the `[ai]` binding.
   - Configure the `assets` binding to serve the `./public` directory.
   - Add a migration configuration for the Durable Object.

2. **`src/ChatDO.ts`**:
   - Implement the `ChatDurableObject` class.
   - It must handle a POST request containing `{ message, context }` (context is the monument name/city).
   - Use `this.ctx.storage` to load and save the conversation history (System + User + Assistant).
   - Use `env.AI.run` with `@cf/meta/llama-3.3-70b-instruct-fp8-fast` to generate the response.
   - Return the AI response as JSON.

3. **`src/index.ts`**:
   - This is the main Worker entry point.
   - Implement a router (can be a simple switch/case on `url.pathname`).
   - **Route `/api/monuments`**: Accept `lat` and `lon` query params, fetch data from the **Overpass API** (use the query structure from .github/copilot-instructions.md), and return the cleaned JSON.
   - **Route `/api/chat`**: Parse the request, identify the `doId` (Durable Object ID) based on the monument name (use `idFromName`), and forward the request to the `ChatDurableObject`.

4. **`public/index.html`**:
   - A clean HTML5 layout.
   - Import Leaflet.js (CSS and JS) via CDN.
   - Create 3 locations modes (Click on map, user Geolocation and a picker to Hardcoded locations), a `#map` div and a hidden `#chat-interface` div.
   - Add a "Close Chat" button.

5. **`public/app.js`**:
   - Initialize the Leaflet map.
   - Implement logic to handle:
     - "Use my location" button.
     - "Click on map" event.
     - "Hardcoded locations" picker.
   - Function to `fetch('/api/monuments')` and add markers to the map.
   - Function to handle marker click -> open Chat UI -> `fetch('/api/chat')` to talk to the Durable Object.

Please generate these files now, ensuring strict adherence to Cloudflare Workers syntax (ES Modules).

- - -

# Improving website design

Instead of this blue markers I want a red small circle on the monuments. I also want a a blue circle marker on the picked location (so the user location, selected city or select point of the map).

I also want the page to be cleaner on monuments loading and when overpass API return an error.