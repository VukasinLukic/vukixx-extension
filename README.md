# VukixxExtension

Chrome Extension that saves prompts from **ChatGPT**, **Claude**, **Gemini**, and **Midjourney** to your Vukixxx library. Also includes a manual paste field for saving prompts from any website.

All prompts are sent to a central Vukixxx API server — works across multiple computers with one shared database.

## Quick Start

### 1. Build the Extension

```bash
npm install
npm run build
```

### 2. Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 3. Start the API Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env — set your GEMINI_API_KEY or configure Ollama
npm run dev
```

The server runs on `http://0.0.0.0:3777` by default.

### 4. Configure the Extension

1. Click the VukixxExtension icon in Chrome toolbar
2. Go to **Settings** tab
3. Set the **API Server URL** (e.g., `http://localhost:3777` or your server's IP)
4. Click **Test** to verify connection
5. Click **Save Settings**

## Features

- **Auto-inject** "Save to Vukixxx" buttons on ChatGPT, Claude, Gemini, and Midjourney
- **Save from input** — capture the current prompt before sending
- **Save from history** — save any previous user message from conversation
- **Manual paste** — copy any prompt from the web, paste it in the popup, and save
- **Offline queue** — if the server is unreachable, prompts queue locally and auto-retry every 5 minutes
- **AI classification** — server uses Gemini or Ollama to auto-generate title, category, and tags
- **Multi-computer** — all computers point to the same API URL = one shared library

## Architecture

```
Extension (Chrome) → HTTP POST → Vukixxx API Server → AI Classification → .md files
```

### Server Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3777` | Server port |
| `AI_PROVIDER` | `gemini` | `gemini` or `ollama` |
| `GEMINI_API_KEY` | — | Required for Gemini |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `PROMPTS_DIR` | `./prompts` | Directory for .md files |

### Prompt File Format

```markdown
---
id: chatgpt-1709xyz-abc123
label: "Build a REST API with Node.js"
category: backend
tags: [api, nodejs, rest]
created: 2026-03-05T21:00:00Z
updated: 2026-03-05T21:00:00Z
source: chatgpt
sourceUrl: https://chatgpt.com/c/xxx
---

The actual prompt content goes here...
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/prompts` | Save a prompt |
| `GET` | `/api/prompts?limit=10` | Get recent prompts |

### POST /api/prompts

```json
{
  "text": "Build a REST API with Express and TypeScript",
  "source": "chatgpt",
  "url": "https://chatgpt.com/c/xxx",
  "timestamp": "2026-03-05T21:00:00Z"
}
```

## Multi-Computer Setup

1. Run the server on one machine (your main PC or a server)
2. Open the server's port in your firewall (default: 3777)
3. On each computer, install the extension and set the API URL to your server's IP:
   `http://192.168.1.100:3777`

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Server dev mode
cd server && npm run dev
```
