/**
 * AI Tour Guide Frontend
 * Handles map interactions, monument discovery, and chat interface
 */

// Global state
let map;
let currentMarkers = [];
let currentMonument = null;
let chatHistory = [];

/**
 * Wait for Leaflet to be loaded
 */
function waitForLeaflet() {
	return new Promise((resolve) => {
		if (typeof L !== "undefined") {
			resolve();
		} else {
			const checkLeaflet = setInterval(() => {
				if (typeof L !== "undefined") {
					clearInterval(checkLeaflet);
					resolve();
				}
			}, 100);
		}
	});
}

/**
 * Initialize the Leaflet map
 */
function initializeMap() {
	// Get the map container
	const mapContainer = document.getElementById("map");
	
	if (!mapContainer) {
		console.error("Map container #map not found in DOM");
		return false;
	}

	// Default center (Paris)
	const defaultLat = 48.8566;
	const defaultLon = 2.3522;

	try {
		map = L.map("map").setView([defaultLat, defaultLon], 12);

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "&copy; OpenStreetMap contributors",
			maxZoom: 19,
		}).addTo(map);

		// Handle map click for location selection
		map.on("click", (event) => {
			const { lat, lng } = event.latlng;
			fetchAndDisplayMonuments(lat, lng);
		});

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
	try {
		clearMarkers();

		const response = await fetch(`/api/monuments?lat=${lat}&lon=${lng}`);
		const data = await response.json();

		if (!data.success || !data.monuments || data.monuments.length === 0) {
			showStatus("No monuments found in this area. Try another location!");
			return;
		}

		displayMonuments(data.monuments);
		showStatus(`Found ${data.monuments.length} monuments!`);
	} catch (error) {
		console.error("Error fetching monuments:", error);
		showStatus("Error fetching monuments. Please try again.");
	}
}

/**
 * Display monuments as markers on the map
 */
function displayMonuments(monuments) {
	monuments.forEach((monument) => {
		const marker = L.marker([monument.lat, monument.lon], {
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
				style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
					color: white; border: none; padding: 6px 12px; 
					border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
				💬 Chat with Historian
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
 * Open the chat interface
 */
function openChat(monumentId, monumentName) {
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
 * Send a chat message
 */
async function sendChatMessage() {
	const input = document.getElementById("chat-input");
	const message = input.value.trim();

	if (!message || !currentMonument) return;

	// Add user message to UI
	addMessageToUI(message, "user");
	input.value = "";

	// Show loading indicator
	showChatLoading(true);

	try {
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				doId: `monument-${currentMonument.id}`,
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
 * Show status message
 */
function showStatus(message) {
	const messagesContainer = document.getElementById("chat-messages");
	const statusDiv = document.createElement("div");
	statusDiv.className = "status-message";
	statusDiv.textContent = message;
	messagesContainer.appendChild(statusDiv);
	setTimeout(() => statusDiv.remove(), 5000);
}

/**
 * Get user's geolocation
 */
function getUserGeolocation() {
	if (!navigator.geolocation) {
		showStatus("Geolocation is not supported by your browser.");
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
		},
		(error) => {
			console.error("Geolocation error:", error);
			showStatus("Could not get your location. Please allow location access or click on the map.");
		},
		{
			timeout: 10000,
			enableHighAccuracy: false,
		}
	);

	// Reset button after 2 seconds
	setTimeout(() => {
		btn.textContent = originalText;
		btn.disabled = false;
	}, 2000);
}

/**
 * Navigate to a preset city
 */
function navigateToCity(coords) {
	if (!coords) return;

	const [lat, lng] = coords.split(",").map(Number);
	map.setView([lat, lng], 12);
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

	// Wait for Leaflet to be available
	await waitForLeaflet();
	console.log("Leaflet loaded");

	// Initialize map
	const mapReady = initializeMap();
	if (!mapReady) {
		console.error("Failed to initialize map, stopping initialization");
		return;
	}

	setupEventListeners();
	console.log("Event listeners setup complete");

	// Optional: Load initial city
	fetchAndDisplayMonuments(48.8566, 2.3522);
	console.log("Initial monuments loading...");
}

document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM content loaded, initializing app...");
	initialize().catch((error) => {
		console.error("Initialization error:", error);
	});
});
