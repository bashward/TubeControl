# TubeControl Browser Extension

Browser extension that receives commands from the TubeControl web app and controls YouTube playback.

## Installation

### Development Mode

1. Build the extension:
   ```bash
   pnpm build
   ```

2. Load in Chrome/Edge:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

3. Load in Firefox:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist` directory

## Usage

1. Click the extension icon to open the popup
2. You'll see a 6-digit room code
3. Enter this code in the TubeControl web app on your phone
4. Control YouTube from your phone!

## Features

- Play/Pause control
- Volume control
- Seek/scrub control
- Next/Previous (for playlists)
- Fullscreen toggle
- Search for videos
- Real-time sync

## Configuration

Update the `SERVER_URL` in `background.js` to point to your deployed server.
