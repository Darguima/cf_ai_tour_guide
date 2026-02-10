/**
 * AI Tour Guide Frontend
 * Handles map interactions, monument discovery, and chat interface
 */

// Global state
let map;
let currentMarkers = [];
let locationMarker = null; // Blue marker for selected location
let currentMonument = null;
let chatHistory = [];
let isLoadingMonuments = false;

const sessionStorageKey = "ai-tour-guide-session-id";

/**
 * Get or create a stable session id for this browser
 */
function getSessionId() {
	let sessionId = localStorage.getItem(sessionStorageKey);
	if (!sessionId) {
		if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
			sessionId = crypto.randomUUID();
		} else {
			sessionId = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		}
		localStorage.setItem(sessionStorageKey, sessionId);
	}
	return sessionId;
}

/**
 * Build durable object id for the current monument + session
 */
function getChatDoId(monumentId) {
	return `monument-${monumentId}-session-${getSessionId()}`;
}

const defaultCities = [
	{ name: "Paris, France", lat: 48.8566, lon: 2.3522 },
	{ name: "London, UK", lat: 51.5074, lon: -0.1278 },
	{ name: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
	{ name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 },
	{ name: "Madrid, Spain", lat: 40.4168, lon: -3.7038 },
	{ name: "Vienna, Austria", lat: 48.2082, lon: 16.3738 },
	{ name: "Prague, Czech Republic", lat: 50.0755, lon: 14.4378 },
	{ name: "Amsterdam, Netherlands", lat: 52.3676, lon: 4.9041 },
	{ name: "Lisbon, Portugal", lat: 38.7223, lon: -9.1393 },
	{ name: "Athens, Greece", lat: 37.9838, lon: 23.7275 },
]

const defaultCity = defaultCities[0];

/**
 * Populate the cities dropdown menu
 */
function populateCitiesDropdown() {
	const select = document.getElementById("cities-select");
	if (!select) return;

	defaultCities.forEach((city) => {
		const option = document.createElement("option");
		option.value = `${city.lat},${city.lon}`;
		option.textContent = city.name;
		select.appendChild(option);
	});
}

/**
 * Initialize the Leaflet map
 */
function initializeMap() {
	try {
		map = L.map("map").setView([defaultCity.lat, defaultCity.lon], 14);

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "&copy; OpenStreetMap contributors",
			maxZoom: 19,
		}).addTo(map);

		console.log("Map initialized successfully");
		return true;
	} catch (error) {
		console.error("Error initializing map:", error);
		return false;
	}
}

/**
 * Fetch monuments from the API
 */
async function fetchAndDisplayMonuments(lat, lng) {
	if (isLoadingMonuments) return; // Prevent duplicate requests

	try {
		isLoadingMonuments = true;
		clearMarkers();
		setLocationMarker(lat, lng);
		clearMapStatus();
		showMapLoading(true);

		const response = await fetch(`/api/monuments?lat=${lat}&lon=${lng}`);

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || "Failed to fetch monuments");
		}

		if (!data.monuments || data.monuments.length === 0) {
			showMapStatus("No monuments found in this area. Try another location!");
			return;
		}

		displayMonuments(data.monuments);
		showMapStatus(`Found ${data.monuments.length} monuments!`);
	} catch (error) {
		console.error("Error fetching monuments:", error);
		showMapStatus(`Error: ${error.message || "Could not fetch monuments. Please try again."}`);
	} finally {
		isLoadingMonuments = false;
		showMapLoading(false);
	}
}

/**
 * Display monuments as markers on the map
 */
function displayMonuments(monuments) {
	monuments.forEach((monument) => {
		// Create red circle marker for monument
		const marker = L.circleMarker([monument.lat, monument.lon], {
			radius: 8,
			fillColor: "#ff4444",
			color: "#cc0000",
			weight: 2,
			opacity: 1,
			fillOpacity: 0.7,
			title: monument.tags.name,
		}).addTo(map);

		const popupContent = `
			<div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
				${monument.tags.name}
			</div>
			<div style="font-size: 12px; color: #666; margin-bottom: 10px;">
				${monument.tags.type}
			</div>
			<button id="chat-btn-${monument.id}" class="marker-chat-btn" 
				data-monument-id="${monument.id}"
				data-monument-name="${monument.tags.name}"
				data-city=""
				style="background: var(--bg-gradient); 
					color: white; border: none; padding: 6px 12px; 
					border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
				💬 Chat with Tour Guide
			</button>
		`;

		marker.bindPopup(popupContent);

		// Store marker for cleanup
		currentMarkers.push(marker);

		// Add click handler after popup is created
		marker.on("popupopen", () => {
			setTimeout(() => {
				const chatBtn = document.getElementById(`chat-btn-${monument.id}`);
				if (chatBtn) {
					chatBtn.addEventListener("click", () => {
						openChat(monument.id, monument.tags.name);
					});
				}
			}, 100);
		});
	});
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
	currentMarkers.forEach((marker) => marker.remove());
	currentMarkers = [];
}

/**
 * Set or update the blue location marker
 */
function setLocationMarker(lat, lng) {
	// Remove existing location marker if any
	if (locationMarker) {
		locationMarker.remove();
	}

	// Create blue circle marker for the selected location
	locationMarker = L.circleMarker([lat, lng], {
		radius: 12,
		fillColor: "#4A90E2",
		color: "#2E5C8A",
		weight: 3,
		opacity: 1,
		fillOpacity: 0.5,
	}).addTo(map);
}

/**
 * Open the chat interface
 */
async function openChat(monumentId, monumentName) {
	currentMonument = {
		id: monumentId,
		name: monumentName,
	};

	chatHistory = [];
	document.getElementById("chat-messages").innerHTML = "";
	document.getElementById("chat-monument-name").textContent = monumentName;
	document.getElementById("chat-input").value = "";

	const chatInterface = document.getElementById("chat-interface");
	chatInterface.classList.add("active");

	// Try to extract city from search context (would need to be enhanced)
	const cityName = "Unknown City"; // In a real app, you'd track this better
	document.getElementById("chat-city-name").textContent = cityName;

	// Load previous conversation (if any)
	const historyLoaded = await loadChatHistory();

	if (!historyLoaded) {
		// Send initial template message when no history exists
		setTimeout(() => {
			sendChatMessage("Hi, talk me about this monument.");
		}, 300);
	}

	// Focus input
	setTimeout(() => {
		document.getElementById("chat-input").focus();
	}, 100);
}

/**
 * Close the chat interface
 */
function closeChat() {
	const chatInterface = document.getElementById("chat-interface");
	chatInterface.classList.remove("active");
	currentMonument = null;
	chatHistory = [];
}

/**
 * Load previous chat history from the Durable Object
 */
async function loadChatHistory() {
	if (!currentMonument) return false;

	try {
		const params = new URLSearchParams({
			doId: getChatDoId(currentMonument.id),
			monumentName: currentMonument.name,
			city: document.getElementById("chat-city-name").textContent,
		});

		const response = await fetch(`/api/chat?${params.toString()}`, {
			method: "GET",
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		if (!data.success || !Array.isArray(data.messages)) {
			return false;
		}

		if (data.messages.length === 0) {
			return false;
		}

		data.messages.forEach((message) => {
			if (message.role === "user" || message.role === "assistant") {
				addMessageToUI(message.content, message.role);
			}
		});

		return true;
	} catch (error) {
		console.error("Failed to load chat history:", error);
		return false;
	}
}

/**
 * Send a chat message
 */
async function sendChatMessage(customMessage = null) {
	const input = document.getElementById("chat-input");
	const message = customMessage || input.value.trim();

	if (!message || !currentMonument) return;

	// Add user message to UI
	addMessageToUI(message, "user");
	
	// Only clear input if it's a manual send (not a custom message)
	if (!customMessage) {
		input.value = "";
	}

	// Show loading indicator
	showChatLoading(true);

	try {
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				doId: getChatDoId(currentMonument.id),
				message,
				context: {
					monumentName: currentMonument.name,
					city: document.getElementById("chat-city-name").textContent,
				},
			}),
		});

		const data = await response.json();

		if (data.success) {
			addMessageToUI(data.response, "assistant");
		} else {
			addMessageToUI("Sorry, I encountered an error. Please try again.", "assistant");
		}
	} catch (error) {
		console.error("Chat error:", error);
		addMessageToUI("Connection error. Please try again.", "assistant");
	} finally {
		showChatLoading(false);
	}
}

/**
 * Add a message to the chat UI
 */
function addMessageToUI(message, role) {
	const messagesContainer = document.getElementById("chat-messages");
	const messageDiv = document.createElement("div");
	messageDiv.className = `message ${role}`;

	const contentDiv = document.createElement("div");
	contentDiv.className = "message-content";
	contentDiv.textContent = message;

	messageDiv.appendChild(contentDiv);
	messagesContainer.appendChild(messageDiv);

	// Scroll to bottom
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Show/hide loading indicator
 */
function showChatLoading(show) {
	const messagesContainer = document.getElementById("chat-messages");
	const loadingId = "chat-loading-indicator";

	if (show) {
		if (!document.getElementById(loadingId)) {
			const loadingDiv = document.createElement("div");
			loadingDiv.id = loadingId;
			loadingDiv.className = "loading-indicator";
			loadingDiv.innerHTML = '<div class="spinner"></div>AI is thinking...';
			messagesContainer.appendChild(loadingDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	} else {
		const loading = document.getElementById(loadingId);
		if (loading) loading.remove();
	}
}

/**
 * Show/hide loading indicator for monuments
 */
function showMapLoading(show) {
	const loadingDiv = document.getElementById("map-loading-indicator");
	if (show) {
		loadingDiv.classList.add("show");
	} else {
		loadingDiv.classList.remove("show");
	}
}

/**
 * Show status message on map
 */
function showMapStatus(message) {
	clearMapStatus();
	const statusDiv = document.getElementById("map-status-message");
	statusDiv.textContent = message;
	statusDiv.classList.add("show");

	// Auto-remove after 5 seconds
	setTimeout(() => {
		if (statusDiv.classList.contains("show")) {
			clearMapStatus();
		}
	}, 5000);
}

/**
 * Clear map status messages
 */
function clearMapStatus() {
	const statusDiv = document.getElementById("map-status-message");
	statusDiv.classList.remove("show");
	statusDiv.textContent = "";
}

/**
 * Get user's geolocation
 */
function getUserGeolocation() {
	if (!navigator.geolocation) {
		showMapStatus("Geolocation is not supported by your browser.");
		return;
	}

	const btn = document.getElementById("geolocation-btn");
	const originalText = btn.textContent;
	btn.textContent = "📍 Getting location...";
	btn.disabled = true;

	navigator.geolocation.getCurrentPosition(
		(position) => {
			const { latitude, longitude } = position.coords;
			fetchAndDisplayMonuments(latitude, longitude);
			map.setView([latitude, longitude], 14);
			btn.textContent = originalText;
			btn.disabled = false;
		},
		(error) => {
			console.error("Geolocation error:", error);
			showMapStatus("Could not get your location. Please allow location access or click on the map.");
			btn.textContent = originalText;
			btn.disabled = false;
		},
		{
			timeout: 10000,
			enableHighAccuracy: false,
		}
	);
}

/**
 * Navigate to a preset city
 */
function navigateToCity(coords) {
	if (!coords) return;

	const [lat, lng] = coords.split(",").map(Number);
	map.setView([lat, lng], 14);
	fetchAndDisplayMonuments(lat, lng);
}

/**
 * Initialize event listeners
 */
function setupEventListeners() {
	// Geolocation button
	document.getElementById("geolocation-btn").addEventListener("click", getUserGeolocation);

	// Cities select
	document.getElementById("cities-select").addEventListener("change", (e) => {
		navigateToCity(e.target.value);
		e.target.value = ""; // Reset select
	});

	// Handle map click for location selection
	map.on("click", (event) => {
		const { lat, lng } = event.latlng;
		fetchAndDisplayMonuments(lat, lng);
	});

	// Chat close button
	document.getElementById("close-chat-btn").addEventListener("click", closeChat);

	// Chat input
	const chatInput = document.getElementById("chat-input");
	chatInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendChatMessage();
		}
	});

	// Send button
	document.getElementById("send-btn").addEventListener("click", sendChatMessage);
}

/**
 * Main initialization
 */
async function initialize() {
	console.log("Starting app initialization...");

	console.log("Populating cities dropdown...");
	populateCitiesDropdown();

	// Initialize map
	const mapReady = initializeMap();
	if (!mapReady) {
		console.error("Failed to initialize map, stopping initialization");
		return;
	}

	setupEventListeners();
	console.log("Event listeners setup complete");

	// Load initial city
	fetchAndDisplayMonuments(defaultCity.lat, defaultCity.lon);
	console.log("Initial monuments loading...");
}

document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM content loaded, initializing app...");
	initialize().catch((error) => {
		console.error("Initialization error:", error);
	});
});
