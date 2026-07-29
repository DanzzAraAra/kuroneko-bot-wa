# WhatsApp Bot (CommonJS)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Sylvatica API](https://img.shields.io/badge/API-Sylvatica-orange?style=for-the-badge)

A powerful, modular, and feature-rich WhatsApp bot built with **JavaScript (CommonJS)**. This bot uses **MongoDB** as its database, features **Pairing Code** authentication for easy login, and supports **Auto-Loading Plugins** for seamless development. 

All core features and plugins are fully powered by the highly reliable **[sylvatica.my.id](https://sylvatica.my.id)**.

---

## 🌟 Key Features

- **Pairing Code Support:** No need to scan QR codes. Just use a pairing code to connect your WhatsApp bot.
- **Auto Load Plugins:** Simply drop your `.js` files into the `plugins/` directory, and the bot will load them dynamically without needing a restart!
- **MongoDB Integration:** Fast, reliable, and scalable database for saving user data, limits, premium statuses, and group configurations.
- **API Sylvatica Powered:** All commands (AI, Downloaders, Search, etc.) are integrated with the Sylvatica API for maximum efficiency.
- **Group Protection:** Advanced group management including Anti-Link, AntiBot, Antitagsw AntiToxic, and AntiNSFW.

---

## 📂 Project Structure

The bot is highly modular, separating core logic, system events, and command plugins.

```text
├── index.js              # Main entry point & connection handler
├── package.json          # Project dependencies
├── settings.js           # Global configurations (API keys, owner number, DB URL)
├── plugins/              # Auto-loaded command modules
│   ├── ai/               # AI Integrations (GPT-5, DeepSeek, Qwen, Nova-AI, Text2Img, etc.)
│   ├── download/         # Media Downloaders (TikTok, IG, YouTube, CapCut, Pinterest)
│   ├── events/           # Eval and runtime execution commands
│   ├── game/             # Interactive Games (Family100, Cak Lontong, Tebak Gambar, etc.)
│   ├── group/            # Group Management (Kick, Add, Promote, Anti-Link, Hidetag)
│   ├── info/             # User info (Profile, Menu, Register, Claim Daily, Ping)
│   ├── maker/            # Image/Video manipulation (Carbon, IG Story, Blurface, QC)
│   ├── owner/            # Owner exclusive (Ban, Premium, Backup, Set React, Modes)
│   ├── random/           # Random media commands
│   ├── search/           # Search tools (Google, Bing, Lyrics, Pinterest, YTS)
│   ├── stalk/            # Stalking features (GitHub, NPM, TikTok, YouTube)
│   ├── sticker/          # Sticker Makers (Brat, Smeme, standard Sticker)
│   └── tools/            # Utilities (HD, SSWeb, FindSong, RVocal, SendNGL)
├── src/                  # Core libraries & utilities
│   ├── database.js       # MongoDB connection & schema handlers
│   ├── serialize.js      # Message serialization & parsing
│   ├── uploader.js       # Media uploading to external hosts
│   ├── limit.js          # User limit and premium management
│   └── ...
└── system/               # System and Event Handlers
    ├── handler.js        # Main message handler routing
    ├── loadPlugins.js    # Logic for auto-loading plugins dynamically
    └── participants.js   # Group welcome/leave events
```

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)
- WhatsApp Account (For pairing code)

### 2. Clone and Install
```bash
# Clone this repository (if hosted on git)
git clone https://github.com/DanzzAraAra/kuroneko-bot-wa
cd <your-repo-folder>

# Install dependencies
npm install
```

### 3. Configuration
Edit the `settings.js` file to match your details:
```javascript
module.exports = {
    ownerNumber: "628xxx", // Your WhatsApp number
    mongoURI: "mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority", // Your MongoDB URI
    sylvaticaApiKey: "YOUR_API_KEY", // Get it from sylvatica.my.id
    // ...other settings
}
```

### 4. Running the Bot
```bash
# Start the bot
node index.js
```
*When prompted in the terminal, enter the phone number you want to use as the bot to receive the 8-digit **Pairing Code** via WhatsApp.*

---

## 📝 API Credit
All plugins in this repository are actively supported by **Sylvatica API**.
**Website:** [sylvatica.my.id](https://sylvatica.my.id)

---

## ⚠️ Disclaimer
This bot is for educational and personal use. Please use responsibly and do not use it to spam or violate WhatsApp's Terms of Service.
