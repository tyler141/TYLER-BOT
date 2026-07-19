# TYLER-BOT — Advanced WhatsApp Automation Platform

TYLER-BOT is a feature-rich WhatsApp automation system built around the Baileys Web API, a modern pairing experience, and AI-powered command handling. It combines a polished web-based pairing portal, persistent session management, and an expansive command framework for bot owners and communities.

## What Makes TYLER-BOT Powerful

- A sleek, Ubuntu-inspired web pairing portal for linking WhatsApp accounts without scanning QR codes manually.
- Secure, persistent session storage with reconnect support and session lifecycle management.
- AI integrations through Google Gemini for conversational and utility-based commands.
- A modular command architecture, making the bot easy to extend with new features.
- Production-style deployment assets for Docker, Heroku, and similar hosting environments.

## Core Capabilities

### Web Pairing Portal
The pairing portal is served from the main app entry point and is designed for streamlined device linking.

Open the portal at:

```text
http://localhost:3000
```

From the portal you can:
- Select your country code from a complete list.
- Enter your WhatsApp number to generate a pairing code.
- Copy the pairing code automatically.
- View active sessions and manage reconnection or deletion.
- Monitor connected, pending, and disconnected session states in real time.

### Pairing Flow
1. Open the portal in your browser.
2. Choose your country and enter your WhatsApp number.
3. Generate the pairing code.
4. Open WhatsApp on your phone.
5. Go to Settings → Linked Devices → Link a Device.
6. Choose the phone-number pairing option and paste the code.

Once linked, the bot will connect automatically and remain available for command execution.

### AI and Utility Features
- Google Gemini-powered responses for natural-language queries.
- Media and downloader tools for platforms such as YouTube, TikTok, Facebook, Instagram, and X.
- Translation, weather, text-to-speech, calculator, hash, currency conversion, and web lookup utilities.
- Fun and social commands for entertainment and community engagement.
- New advanced commands such as .stats, .botinfo, and .remind for health monitoring and task reminders.
- Smart auto-replies for greetings and appreciation to make the bot feel more interactive.

### Automation and Bot Controls
- Presence toggles such as online/offline, auto-read, auto-typing, auto-recording, and auto-react.
- Group management tools including invite links, member moderation, announcements, and settings controls.
- Owner-only operations such as broadcast, bot profile changes, session inspection, and bot management commands.

## Architecture Overview

TYLER-BOT is structured around a lightweight but extensible stack:

- Node.js runtime for the server and bot logic.
- Express for the web interface and API routes.
- Baileys for WhatsApp session handling and message communication.
- Supabase for persistent session storage and backend integration.
- Google Gemini for AI command execution.

## Environment Configuration

Create a .env file in the project root and configure the following values:

```env
BOT_NAME=TYLER-BOT
GEMINI_API_KEY=your_gemini_key
OWNER_NUMBER=254712345678
HOST=0.0.0.0
PORT=3000
SMART_REPLY=true
ADVANCED_STATUS=true
```

You can obtain a Gemini API key from:

```text
https://aistudio.google.com/app/apikey
```

## Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Start the bot
```bash
npm start
```

### 3. Access the pairing portal
Open your browser and navigate to:

```text
http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | / | Main pairing portal |
| GET | /health | Check bot health and server status |
| GET | /api/sessions | List active sessions |
| GET | /api/servers | Retrieve server and bot health summary |
| POST | /api/pair | Generate a pairing code |
| POST | /api/reconnect | Reconnect a session |
| DELETE | /api/session/:id | Remove a specific session |
| GET | /api/countries | Retrieve available country codes |

## Project Structure

```text
tyler-bot/
├── index.js                  # Express server, bot manager, and API routes
├── config.js                 # Configuration loader
├── package.json              # Scripts and dependencies
├── public/
│   └── portal.html           # Web pairing portal interface
├── src/
│   ├── handler.js            # Message routing and event handling
│   ├── commands/             # Bot commands by category
│   ├── data/                 # Static data such as country codes
│   ├── features/             # Auto-features and moderation helpers
│   └── utils/                # Helper functions and shared utilities
├── sessions/                 # Session files and pairing state
└── README.md                 # Project documentation
```

## Deployment Assets

The repository includes deployment-ready files for hosting and scaling:

- Dockerfile
- Procfile
- app.json
- cx-platform.json
- heroku.yml

## Requirements

- Node.js 18 or newer
- A valid WhatsApp account
- A Google Gemini API key

## Security and Usage Notes

This project is intended for educational, development, and personal automation purposes. Please use it responsibly and comply with WhatsApp’s terms of service and applicable platform policies.
