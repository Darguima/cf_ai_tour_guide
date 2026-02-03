<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/darguima/cf-ai-tour-guide">
    <img src="readme/banner_with_background.svg" alt="cf-ai-tour-guide thumbnail" width="350px">
  </a>

  <h3 align="center">cf-ai-tour-guide</h3>

  <p align="center">
    An interactive web application that helps tourists discover monuments on a map and chat with an AI historian about them. Built with Cloudflare Workers, Durable Objects, and Llama 3.3.
    <br />
    <br />
    <a href="#-demo">View Demo</a>
    &middot;
    <a href="#-getting-started-with-development">Start Developing</a>
  </p>

<h4 align="center">
⭐ Don't forget to Starring ⭐
</h4>

  <div align="center">

[![TypeScript][TypeScript-badge]][TypeScript-url]
[![Cloudflare][Cloudflare-badge]][Cloudflare-url]

  </div>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>📋 Table of Contents</summary>

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Usage](#-usage)
- [Getting Started with Development](#-getting-started-with-development)
- [Project Structure](#️-project-structure)
- [Contributing](#-contributing)
- [Developed by](#-developed-by)
</details>



## 🔍 About The Project

### 🎯 The Goal

This project provides an innovative way for tourists to explore historical monuments in any location. Instead of using generic travel guides, users can interact with an AI historian powered by Llama 3.3, who provides rich historical context about specific monuments. The application combines real-world location data from OpenStreetMap with cutting-edge AI, all hosted on Cloudflare's edge infrastructure.

### ⚙️ How It Works

The application has three main components:

1. **Interactive Map Interface**: Users can interact with an OpenStreetMap-based interface using Leaflet.js to select locations in three ways:
   - Clicking directly on the map
   - Using the browser's Geolocation API
   - Selecting from a curated list of hardcoded cities

2. **Monument Discovery**: When a user selects a location, the app queries the **Overpass API** (OpenStreetMap's data service) through a Cloudflare Worker proxy to find interesting historical sites and tourist attractions nearby.

3. **AI Historian Chat**: When a user clicks on a monument marker, a chat interface opens. The user can ask questions about the monument's history, and an AI historian (powered by Llama 3.3) responds with accurate, contextual information. The chat history is preserved using **Cloudflare Durable Objects**, so users can close and reopen the conversation without losing context.

### 🎬 Demo

[Add screenshots or video demo here]

### 🧩 Features

- **Real-time Monument Discovery**: Fetches nearby historical sites using Overpass API
- **AI-Powered Historian**: Chat with Llama 3.3 AI specialized in monument history
- **Persistent Chat History**: Durable Objects maintain conversation state per monument
- **Multi-location Input**: Click map, use geolocation, or choose from preset cities
- **Edge-Hosted**: Runs entirely on Cloudflare Workers for global low-latency access

## 📖 Usage

### Getting Started

1. **Open the Application**: Navigate to the hosted Cloudflare Workers deployment
2. **Select a Location**: 
   - Click directly on the map to choose coordinates
   - Click "Use My Location" to enable geolocation
   - Select a city from the preset list
3. **Explore Monuments**: The map will display markers for nearby historical sites and attractions
4. **Chat with AI Historian**: Click on any monument marker to open a chat panel
5. **Ask Questions**: Type your questions about the monument's history, architecture, significance, etc.

## 🚀 Getting Started with Development

To get a local copy up and running follow these simple steps.

### 1. Prerequisites

Install the following tools:

- [Git](https://git-scm.com/downloads) - Version Control System
- [Node.js](https://nodejs.org/) (v16+) - JavaScript Runtime
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI

### 2. Cloning

Clone the repository to your local machine:

```bash
$ git clone git@github.com:darguima/cf-ai-tour-guide.git
# or
$ git clone https://github.com/darguima/cf-ai-tour-guide.git
cd cf-ai-tour-guide
```

### 3. Dependencies

Install the project dependencies:

```bash
$ npm install
```

### 4. Configuration

1. Ensure you have a Cloudflare account and are authenticated with Wrangler:
   ```bash
   $ wrangler login
   ```

2. Update `wrangler.jsonc` with your Cloudflare account details:
   - Set your Cloudflare account ID
   - Configure Durable Objects binding
   - Set up Workers AI binding (Llama 3.3 model)
   - Configure the Assets binding for static file serving

### 5. Development Server

Start the local development server:

```bash
$ npm run dev
```

The application will be available at `http://localhost:8787`

### 6. Building

Build the project for production:

```bash
$ npm run build
```

### 7. Deployment

Deploy to Cloudflare Workers:

```bash
$ npm run deploy
```



## 🏗️ Project Structure

```
cf-ai-tour-guide/
├── 📁 src/ - TypeScript source code
│   ├── index.ts - Main Worker router and entry point
│   ├── 📁 DurableObjects/ - Durable Objects for persistent state
│   │   └── ChatDO.ts - Chat history and AI interaction handler
│   ├── 📁 handlers/ - Route handlers for API endpoints
│   │   ├── handleChat.ts - Chat message endpoint
│   │   └── handleMonuments.ts - Monument discovery endpoint
│   └── 📁 overpassAPI/ - Overpass API integration
│       └── overpassAPI.ts - Queries OpenStreetMap for monuments
├── 📁 public/ - Frontend static files
├── 📄 wrangler.jsonc - Cloudflare Workers configuration
├── 📄 PROMPTS.md - Log of AI prompts used during development
└── ...
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Developed by

- [Darguima](https://github.com/darguima)



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[project-thumbnail]: readme/banner_with_background.svg

[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org

[Cloudflare-badge]: https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white
[Cloudflare-url]: https://www.cloudflare.com
