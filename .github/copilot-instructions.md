# PROJECT CONTEXT: Cloudflare Internship AI Assignment

## 1. Project Overview
We are building a web application hosted on Cloudflare Workers (using the "Assets" configuration for static hosting). The app is a Tourist Guide that allows users to find monuments on a map and chat with an AI historian about them.

**Key Features:**
1.  **Interactive Map:** Users select a location via Click, Geolocation API, or a Hardcoded List of cities.
2.  **Monument Discovery:** Fetches interesting locations via the **Overpass API** (OpenStreetMap) through a Worker proxy.
3.  **AI Historian Chat:** When a user selects a monument, a chat opens. The user talks to an LLM (Llama 3.3) which has the context of that specific monument.
4.  **State Management:** The chat history is preserved using **Cloudflare Durable Objects**.

## 2. Technical Stack & Constraints (STRICT)
* **Platform:** Cloudflare Workers + Durable Objects + Workers AI.
* **Language:** TypeScript.
* **Runtime:** Cloudflare Workers Runtime (NOT Node.js).
    * *Do not use:* `fs`, `net`, or native Node modules.
    * *Use:* Standard `fetch` API for HTTP requests.
* **Frontend:** HTML/CSS/Vanilla JS (served via `assets` binding).
    * **Map Library:** Use **Leaflet.js** (OpenStreetMap) because it requires no API key.
* **AI Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (or similar supported Llama 3 version).

## 3. Architecture & Data Flow

### A. The Worker (`src/index.ts`)
The main Worker acts as the router and entry point.
* **Route `/api/monuments`:** Accepts `lat` and `lon`. Makes a fetch request to the Overpass API to find historic nodes nearby. Returns JSON to frontend.
* **Route `/api/chat`:** Handles the upgrade to a WebSocket OR HTTP-based interaction with the **Durable Object**. (Since this is a simple internship assignment, standard HTTP POST to the DO is acceptable, but WebSockets are preferred for "real-time" feel if possible. Let's stick to HTTP POST for simplicity if it gets too complex, but aim for WebSocket).

### B. The Durable Object (`src/ChatDO.ts`)
* **Class:** `ChatDurableObject`
* **State:** Stores an array of messages: `[{ role: 'system', content: ... }, { role: 'user', content: ... }]`.
* **Functionality:**
    1.  Receives a message and the "Monument Name" + "City".
    2.  If it's the first message, initializes the System Prompt: *"You are an expert historian specializing in [Monument] in [City]. Explain history concisely."*
    3.  Calls **Workers AI** (`env.AI.run`) with the message history.
    4.  Saves the new user message and AI response to `state.storage`.
    5.  Returns the AI response.

### C. The Frontend (`public/` or `assets/`)
* **`index.html`**: Contains the Leaflet map div and a hidden Chat div.
* **`app.js`**:
    * Handles Map logic (Leaflet).
    * Fetches `/api/monuments`.
    * On marker click -> Opens Chat UI.
    * Chat UI sends fetch requests to `/api/chat?doId=[unique_id_for_monument]`.

## 4. Implementation Steps for the Assistant

**Phase 1: Configuration (`wrangler.jsonc`)**
* Ensure `[durable_objects]` are bound.
* Ensure `[ai]` binding is set.
* Ensure `[assets]` binding is set (if using the new Assets setup) or `[site]` (legacy). *Note: The user selected the "Assets" template.*

**Phase 2: The Map & Search (Frontend + Worker)**
* Create the HTML layout - 3 locations modes (Click on map, user Geolocation and a picker to Hardcoded locations), a map div, and a hidden chat div.
* Implement the Overpass API proxy in the Worker (Overpass QL can be tricky, ensure we query for `node["historic"]` or `node["tourism"]`).

**Phase 3: The Durable Object (Backend)**
* Scaffold the DO class.
* Implement the `fetch` handler inside the DO to process chat messages.
* Connect the `env.AI` binding to generate responses.

**Phase 4: Connecting the UI**
* Make the chat window appear when a marker is clicked.
* Generate a unique ID for the Durable Object based on the Monument ID (so if I close and reopen the monument, the chat history is still there).

## 5. Special Requirement: Documentation
* **PROMPTS.md:** Since this is an assignment, every time you (the AI) generate significant code, please provide a log entry I can paste into `PROMPTS.md` describing what I asked you.

## 6. Example Overpass Query (Reference)
When fetching monuments, use a query similar to this for the Overpass API:
```text
[out:json];
(
  node["historic"](around:5000, {lat}, {lon});
  node["tourism"="attraction"](around:5000, {lat}, {lon});
);
out body;
>;
out skel qt;