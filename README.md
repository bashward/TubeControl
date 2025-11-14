# 🎮 TubeControl

**Control YouTube on your PC from your phone** - A real-time remote control system for YouTube that frees you from your keyboard.

## Overview

TubeControl is a three-part system that turns your mobile phone into a powerful remote control for YouTube on your computer:

- 🌐 **Web App**: Mobile-first remote control interface
- 🔌 **Browser Extension**: Receives commands and controls YouTube
- 🚀 **Backend Server**: WebSocket bridge for real-time communication

## Features

### 🎵 Player Control
- ▶️ Play/Pause
- 🔊 Volume control with mute
- ⏩ Seek/scrub through videos
- ⏭️ Next/Previous (for playlists)
- ⛶ Fullscreen toggle

### 🔍 Search & Discovery
- Search for videos from your phone
- Browse search results with thumbnails
- Play any video on your PC with one tap
- See what's currently playing

### 🔗 Easy Pairing
- Simple 6-digit room code
- Instant pairing
- Auto-reconnect on connection loss
- No account or login required

## Architecture

```
┌─────────────────┐
│   Mobile Phone  │
│   (Web App)     │  WebSocket
│   React/Next.js │◄──────────┐
└─────────────────┘            │
                               │
                    ┌──────────▼────────┐
                    │   Backend Server  │
                    │   Node.js/Socket  │
                    └──────────┬────────┘
                               │
┌─────────────────┐            │
│   PC Browser    │  WebSocket │
│   (Extension)   │◄───────────┘
│   YouTube Tab   │
└─────────────────┘
```

## Project Structure

```
TubeControl/
├── apps/
│   ├── web/              # Next.js web app (the remote)
│   ├── extension/        # Browser extension (the receiver)
│   └── server/           # Node.js/Socket.io server (the bridge)
├── packages/
│   └── common/           # Shared types and utilities
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A modern browser (Chrome, Edge, or Firefox)
- A mobile device or secondary browser for the remote

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TubeControl
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

### Running the System

You need to run all three components:

#### 1. Start the Backend Server

```bash
pnpm dev:server
```

The server will start on `http://localhost:3001`

#### 2. Start the Web App

```bash
pnpm dev:web
```

The web app will be available at `http://localhost:3000`

#### 3. Install the Browser Extension

```bash
cd apps/extension
pnpm build
```

Then load the extension in your browser:

**Chrome/Edge:**
1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `apps/extension/dist` directory

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `apps/extension/dist` directory

### Usage

1. **Open YouTube** on your PC
2. **Click the TubeControl extension icon** - you'll see a 6-digit room code
3. **Open the web app on your phone** (`http://localhost:3000` or your deployed URL)
4. **Enter the room code** from the extension
5. **Start controlling!** 🎉

## Development

### Monorepo Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build:all

# Dev mode for specific apps
pnpm dev:server    # Start backend server
pnpm dev:web       # Start web app

# Build specific apps
pnpm build:server
pnpm build:web
pnpm build:extension
```

### Environment Variables

**Backend Server** (`apps/server/.env`):
```env
PORT=3001
```

**Web App** (`apps/web/.env`):
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

**Browser Extension** (`apps/extension/background.js`):
- Update `SERVER_URL` constant for production deployment

## Deployment

### Deploy the Backend Server

Deploy to any Node.js hosting platform:

```bash
cd apps/server
pnpm install --prod
pnpm start
```

Recommended platforms:
- Railway
- Render
- Fly.io
- Heroku
- DigitalOcean App Platform

### Deploy the Web App

Deploy to Vercel, Netlify, or any Next.js-compatible platform:

```bash
cd apps/web
pnpm build
pnpm start
```

**Important**: Update `NEXT_PUBLIC_SERVER_URL` to point to your deployed backend server.

### Publish the Browser Extension

1. **Build for production**
   ```bash
   cd apps/extension
   pnpm build
   ```

2. **Update SERVER_URL** in `background.js` to your production server

3. **Package the extension**
   - Zip the `dist` directory
   - Submit to Chrome Web Store and/or Firefox Add-ons

## Technology Stack

- **Web App**: Next.js 14, React, TypeScript, Socket.io-client
- **Extension**: Vanilla JavaScript (ES6+), WebExtensions API
- **Backend**: Node.js, Express, Socket.io
- **Package Manager**: pnpm with workspaces
- **Real-time Communication**: WebSockets via Socket.io

## How It Works

### Pairing Process

1. Extension generates a unique 6-digit room code
2. Extension joins a Socket.io room with that code
3. User enters the code in the web app
4. Web app joins the same room
5. Both devices can now communicate through the server

### Command Flow

```
Mobile App → Server → Extension → YouTube Player
           (relay)    (execute)   (DOM/API)
```

### Event Flow

```
YouTube Player → Extension → Server → Mobile App
  (state)        (emit)     (relay)   (update UI)
```

## Features Roadmap

### v1.0 (Current)
- ✅ Basic player controls
- ✅ Volume and seek control
- ✅ Search functionality
- ✅ Simple pairing system
- ✅ Real-time sync

### v2.0 (Future)
- ⏳ Queue management
- ⏳ Playlist support
- ⏳ User playlists access
- ⏳ QR code pairing
- ⏳ Multiple device support
- ⏳ Keyboard shortcuts
- ⏳ Picture-in-picture control

## Troubleshooting

### Extension not connecting
- Check that the backend server is running
- Verify the `SERVER_URL` in `background.js` is correct
- Open the browser console to check for errors

### Web app can't pair
- Ensure you're entering the correct 6-digit code
- Check that the extension is installed and active
- Verify both devices can reach the backend server

### Commands not working
- Make sure you're on a YouTube video page
- Check the browser console for errors
- Try refreshing the YouTube page

### No search results
- The extension navigates to YouTube search
- Wait a moment for the page to load
- Results are scraped from the search page DOM

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

bashward

## Acknowledgments

Built following the Product Requirements Document for a YouTube Remote Control System.

---

**Enjoy controlling YouTube from anywhere in your home!** 🎉
