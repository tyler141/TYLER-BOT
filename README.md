# TYLER-BOT — WhatsApp Bot with Web Pairing Portal

A full-featured WhatsApp bot with an **Ubuntu-styled web pairing portal**, **pairing code** authentication, **Google Gemini AI**, and session management. Built with Baileys (WhatsApp Web API).

## Features

### Web Pairing Portal (Ubuntu Style)
- Beautiful Ubuntu-themed web interface at `http://localhost:3000`
- Select your country from a dropdown with **all country codes**
- Enter your WhatsApp number and get a pairing code
- **Auto-copy** — pairing code is automatically copied to clipboard
- View all **active sessions** with status (connected/pending/disconnected)
- Reconnect or delete sessions from the portal
- Live stats bar showing connected/total/pending sessions

### Pairing Code
- No QR code needed — enter your phone number, get a code, and link your WhatsApp.
- Sessions are stored in Supabase and auto-reconnect on server restart.

### Google Gemini AI
- AI commands powered by **Google Gemini** (gemini-1.5-flash model)
- Get a free API key at https://aistudio.google.com/app/apikey

### Commands (85+)

**Main**
- `.menu` / `.help` / `.list` — Show all commands

**Downloader**
- `.ytvideo <url>` — YouTube video info
- `.ytaudio <url>` — YouTube audio info
- `.play <song>` — Search YouTube
- `.tiktok <url>` — TikTok URL
- `.facebook <url>` — Facebook video
- `.instagram <url>` — Instagram content
- `.twitter <url>` — Twitter/X video
- `.img <query>` — Image search

**AI & Tools**
- `.ai <text>` — Google Gemini AI response
- `.gpt <text>` — Google Gemini AI response
- `.gemini <text>` — Google Gemini AI response
- `.translate <lang> <text>` — Translate text
- `.weather <city>` — Weather info
- `.sticker` — Image to sticker
- `.quote` — Random quote

**Status & Presence**
- `.online` / `.offline` — Always online toggle
- `.autoread <on/off>` — Auto-read messages
- `.autotype <on/off>` — Auto typing indicator
- `.autorecord <on/off>` — Auto recording indicator
- `.autostatus <on/off>` — Auto view status
- `.autoreact <on/off>` — Auto react to messages
- `.antiblue <on/off>` — Anti blue tick

**Group Management**
- `.grouplink` — Get invite link
- `.revoke` — Revoke invite link
- `.kick @user` — Kick member
- `.add <number>` — Add member
- `.promote @user` — Promote to admin
- `.demote @user` — Demote admin
- `.tagall` — Tag all members
- `.hidetag <msg>` — Hidden tag
- `.groupinfo` — Group information
- `.setpp` — Set group icon
- `.setname <name>` — Set group name
- `.setdesc <desc>` — Set group description
- `.mute` / `.unmute` — Close/open group
- `.lockgc` — Lock group settings
- `.infouser @user` — User info

**Owner Only**
- `.ping` — Response time
- `.uptime` — Bot uptime
- `.restart` — Restart bot
- `.shutdown` — Shutdown bot
- `.setpp` — Bot profile pic
- `.setname` — Bot name
- `.setbio` — Bot bio
- `.bc <msg>` — Broadcast all chats
- `.bcgc <msg>` — Broadcast all groups
- `.getgroups` — List all groups
- `.join <link>` — Join group
- `.leave` — Leave group
- `.block @user` / `.unblock @user` — Block/unblock
- `.setprefix <char>` — Change prefix
- `.status` — Bot status

**Settings**
- `.settings` — Show all settings
- `.autostatuslike <on/off>` — Auto like status
- `.anticall <on/off>` — Reject calls
- `.autobio <on/off>` — Auto update bio
- `.antidelete <on/off>` — Anti delete messages
- `.language` — Set language

**Fun**
- `.8ball <question>` — Magic 8 ball
- `.ship @user` — Ship meter
- `.joke` — Random joke
- `.meme` — Random meme
- `.rizz` — Rizz line
- `.truth` / `.dare` — Truth or dare
- `.coinflip` — Flip coin
- `.dice` — Roll dice
- `.character` — Random character

**Utility**
- `.tts <text>` — Text to speech
- `.delete` — Delete bot message
- `.calc <expr>` — Calculator
- `.shorturl <url>` — Shorten URL
- `.tempmail` — Temporary email
- `.uuid` — Generate UUID
- `.base64 <encode/decode> <text>` — Base64
- `.hash <text>` — SHA-256 hash
- `.currency <amt> <from> <to>` — Currency convert
- `.wikipedia <query>` — Wikipedia search
- `.google <query>` — Google search

### Auto Features
- Auto Read, Auto Status View/Like, Auto Typing, Auto Recording
- Always Online, Anti Call, Auto React, Anti Blue Tick
- Auto Bio, Anti Delete, Auto Save Contacts

## Remote Deployment Assets Imported

The project now includes deployment metadata and Heroku/Docker config imported from the remote `Dark-Xploit/CypherX` repository and adapted for `TYLER-BOT`:
- `Dockerfile`
- `Procfile`
- `app.json`
- `cx-platform.json`
- `heroku.yml`

These files preserve deployment configuration while keeping the current TYLER-BOT application logic intact.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure
Edit `.env`:
```
BOT_NAME=TYLER-BOT
GEMINI_API_KEY=your_gemini_key  # Get free: https://aistudio.google.com/app/apikey
OWNER_NUMBER=254712345678
```

### 3. Run the bot
```bash
npm start
```

### 4. Open the pairing portal
Go to `http://localhost:3000` in your browser.

### 5. Pair with WhatsApp
1. Select your country from the dropdown
2. Enter your WhatsApp number
3. Click "Get Pairing Code"
4. The code is **auto-copied** to your clipboard
5. Open WhatsApp → Settings → Linked Devices → Link a Device
6. Choose "Link with phone number instead"
7. Paste the code

The bot will connect automatically. Type `.menu` in any chat to see all commands.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Web pairing portal |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/pair` | Generate pairing code |
| POST | `/api/reconnect` | Reconnect a session |
| DELETE | `/api/session/:id` | Delete a session |
| GET | `/api/countries` | List all country codes |

## Project Structure
```
tyler-bot/
├── index.js              # Express server + bot manager + API
├── config.js             # Configuration loader
├── .env                  # Environment variables
├── package.json
├── public/
│   └── portal.html       # Ubuntu-styled web pairing portal
├── src/
│   ├── handler.js        # Message handler & command router
│   ├── data/
│   │   └── countryCodes.js  # All country calling codes
│   ├── commands/
│   │   ├── index.js      # Command aggregator
│   │   ├── menu.js       # Menu/help commands
│   │   ├── ai.js         # Google Gemini AI
│   │   ├── downloader.js # Media downloaders
│   │   ├── group.js      # Group management
│   │   ├── owner.js      # Owner-only commands
│   │   ├── settings.js   # Feature toggles
│   │   ├── fun.js        # Fun commands
│   │   └── utility.js    # Utility tools
│   ├── features/
│   │   ├── autoFeatures.js  # Auto-read, react, typing, etc.
│   │   └── antiDelete.js    # Anti-delete handler
│   └── utils/
│       └── helpers.js   # Utility functions
├── sessions/             # Auth sessions (auto-created)
└── README.md
```

## Requirements
- Node.js >= 18
- A WhatsApp account
- Google Gemini API key (free at https://aistudio.google.com/app/apikey)

## Disclaimer
This bot is for educational purposes. Use responsibly and comply with WhatsApp's Terms of Service.
