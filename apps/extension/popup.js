// UI Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const peersText = document.getElementById('peersText');
const roomCodeEl = document.getElementById('roomCode');
const newCodeBtn = document.getElementById('newCodeBtn');
const disconnectBtn = document.getElementById('disconnectBtn');

let currentStatus = {
  connected: false,
  roomCode: '',
  peers: 0
};

// Update UI
function updateUI() {
  // Status
  if (currentStatus.connected) {
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected to server';
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }

  // Room code
  roomCodeEl.textContent = currentStatus.roomCode || '------';

  // Peers
  const isRemoteConnected = currentStatus.peers > 1;
  if (isRemoteConnected) {
    peersText.textContent = `✓ Remote connected (${currentStatus.peers} devices)`;
    peersText.style.color = '#00ff00';
  } else {
    peersText.textContent = 'Waiting for remote...';
    peersText.style.color = '#aaa';
  }

  // Button states
  // Disable "New Code" when remote is connected
  newCodeBtn.disabled = isRemoteConnected;
  newCodeBtn.style.opacity = isRemoteConnected ? '0.5' : '1';
  newCodeBtn.style.cursor = isRemoteConnected ? 'not-allowed' : 'pointer';

  // Disable "Disconnect" when no remote is connected
  disconnectBtn.disabled = !isRemoteConnected;
  disconnectBtn.style.opacity = !isRemoteConnected ? '0.5' : '1';
  disconnectBtn.style.cursor = !isRemoteConnected ? 'not-allowed' : 'pointer';
}

// Get status from background
function getStatus() {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (response) {
      currentStatus.connected = response.connected;
      currentStatus.roomCode = response.roomCode;
      currentStatus.peers = response.peersInRoom || 1;
      updateUI();
    }
  });
}

// Generate new code
newCodeBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GENERATE_NEW_CODE' }, (response) => {
    if (response) {
      currentStatus.roomCode = response.roomCode;
      currentStatus.peers = 1;
      updateUI();
    }
  });
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
  if (confirm('Disconnect from the current session? Remote control will stop working.')) {
    chrome.runtime.sendMessage({ type: 'DISCONNECT' }, (response) => {
      if (response && response.roomCode) {
        currentStatus.roomCode = response.roomCode;
        currentStatus.peers = 1;
        updateUI();
      }
    });
  }
});

// Listen for updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CONNECTION_STATUS') {
    currentStatus.connected = message.connected;
    updateUI();
  }

  if (message.type === 'ROOM_JOINED') {
    currentStatus.peers = message.data.peersInRoom || 1;
    updateUI();
  }

  if (message.type === 'PEER_CONNECTED') {
    currentStatus.peers = message.data.peersInRoom || 1;
    updateUI();
  }

  if (message.type === 'PEER_DISCONNECTED') {
    currentStatus.peers = message.data.peersInRoom || 1;
    updateUI();
  }
});

// Initialize
getStatus();
setInterval(getStatus, 3000);
