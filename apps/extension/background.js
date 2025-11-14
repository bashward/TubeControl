console.log('[TubeControl] Background script starting...');

import { io } from './socket.io.esm.min.js';

console.log('[TubeControl] Socket.io imported successfully');

let socket = null;
let roomCode = null;
let isConnected = false;
let peersInRoom = 1;
let youtubeTabId = null;

// Server URL - change this to your deployed server
const SERVER_URL = 'https://tubecontrol.onrender.com';



// Generate a 6-digit room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Initialize room code on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['roomCode'], (result) => {
    if (!result.roomCode) {
      roomCode = generateRoomCode();
      chrome.storage.local.set({ roomCode });
    } else {
      roomCode = result.roomCode;
    }
    connectToServer();
  });
});

// Connect on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['roomCode'], (result) => {
    roomCode = result.roomCode || generateRoomCode();
    if (!result.roomCode) {
      chrome.storage.local.set({ roomCode });
    }
    connectToServer();
  });
});

// Connect to Socket.io server
function connectToServer() {
  if (socket && socket.connected) {
    return;
  }

  socket = io(SERVER_URL, {
    transports: ['websocket'], // Force WebSocket only (service workers don't support polling)
    upgrade: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    isConnected = true;

    // Join room with current room code
    socket.emit('JOIN_ROOM', {
      roomCode: roomCode,
      deviceType: 'extension'
    });

    // Update popup
    notifyPopup({ type: 'CONNECTION_STATUS', connected: true });
  });

  socket.on('connect_error', (error) => {
    console.error('[TubeControl] Connection error:', error);
  });

  socket.on('ROOM_JOINED', (data) => {
    console.log('Joined room:', data);
    peersInRoom = data.peersInRoom || 1;
    notifyPopup({ type: 'ROOM_JOINED', data });
  });

  socket.on('PEER_CONNECTED', (data) => {
    
    peersInRoom = data.peersInRoom || 1;
    notifyPopup({ type: 'PEER_CONNECTED', data });
  });

  socket.on('PEER_DISCONNECTED', (data) => {
    
    peersInRoom = data.peersInRoom || 1;

    // If we're the only one left in the room, we're waiting for remote again
    if (peersInRoom <= 1) {
      // Clear the YouTube tab reference since session ended
      youtubeTabId = null;
    }

    notifyPopup({ type: 'PEER_DISCONNECTED', data });
  });

  socket.on('disconnect', () => {
    isConnected = false;
    peersInRoom = 1; // Reset peer count on disconnect
    notifyPopup({ type: 'CONNECTION_STATUS', connected: false });
  });

  // Handle commands from remote
  socket.on('COMMAND', (data) => {
    handleCommand(data);
  });
}

// Handle commands from the remote
async function handleCommand(data) {
  const { action, payload } = data;

  console.log('[TubeControl] Handling command:', action);

  // Get the active YouTube tab
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });

  if (tabs.length === 0) {
    return;
  }

  const tab = tabs[0];

  // Track the YouTube tab
  youtubeTabId = tab.id;

  // Send command to content script
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'COMMAND',
      action,
      payload
    });
  } catch (error) {
    console.error('[TubeControl] Error sending message to tab:', error.message);
    console.error('[TubeControl] This usually means the YouTube tab needs to be refreshed or reopened');
  }
}

// Detect when YouTube tab is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === youtubeTabId) {
    youtubeTabId = null;

    // Leave the room to notify peers
    if (socket && socket.connected) {
      socket.emit('LEAVE_ROOM');

      // Reset state
      peersInRoom = 1;

      // Generate new room code and rejoin
      roomCode = generateRoomCode();
      chrome.storage.local.set({ roomCode });

      setTimeout(() => {
        socket.emit('JOIN_ROOM', {
          roomCode: roomCode,
          deviceType: 'extension'
        });
      }, 200);
    }
  }
});

// Notify popup of updates
function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open, ignore error
  });
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: isConnected,
      roomCode: roomCode,
      peersInRoom: peersInRoom
    });
    return true;
  }

  if (message.type === 'RECONNECT') {
    connectToServer();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'DISCONNECT') {
    if (socket && socket.connected) {
      // Leave the room (stay connected, just leave the room)
      socket.emit('LEAVE_ROOM');

      // Reset local state
      peersInRoom = 1;
      youtubeTabId = null;

      // Generate new room code for next session
      roomCode = generateRoomCode();
      chrome.storage.local.set({ roomCode });

      // Rejoin with new room code immediately
      setTimeout(() => {
        socket.emit('JOIN_ROOM', {
          roomCode: roomCode,
          deviceType: 'extension'
        });
      }, 200);

      notifyPopup({ type: 'CONNECTION_STATUS', connected: true });
    }
    sendResponse({ success: true, roomCode });
    return true;
  }

  if (message.type === 'GENERATE_NEW_CODE') {
    roomCode = generateRoomCode();
    chrome.storage.local.set({ roomCode });
    if (socket && socket.connected) {
      socket.emit('JOIN_ROOM', {
        roomCode: roomCode,
        deviceType: 'extension'
      });
    }
    sendResponse({ roomCode });
    return true;
  }

  if (message.type === 'EVENT') {
    // Relay events from content script to server
    if (socket && socket.connected) {
      socket.emit('EVENT', message.data);
    }
    sendResponse({ success: true });
    return true;
  }

  return true;
});

// Initialize connection

chrome.storage.local.get(['roomCode'], (result) => {
  roomCode = result.roomCode || generateRoomCode();
  if (!result.roomCode) {
    chrome.storage.local.set({ roomCode });
  }
  connectToServer();
});
