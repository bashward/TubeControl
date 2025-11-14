// YouTube player controller
let player = null;
let playerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  isMuted: false,
  title: '',
  channelName: ''
};

// Find the YouTube video player
function findPlayer() {
  return document.querySelector('video');
}

// Initialize
function init() {
  console.log('[TubeControl Content] Initializing on:', window.location.href);

  player = findPlayer();

  if (player) {
    console.log('[TubeControl Content] ✓ YouTube player found');

    // Set up event listeners
    player.addEventListener('play', sendPlayerState);
    player.addEventListener('pause', sendPlayerState);
    player.addEventListener('timeupdate', sendPlayerState);
    player.addEventListener('volumechange', sendPlayerState);
    player.addEventListener('loadedmetadata', sendPlayerState);

    // Send initial state
    setTimeout(sendPlayerState, 1000);

    // Periodic state updates
    setInterval(sendPlayerState, 5000);
  } else {
    console.log('[TubeControl Content] Player not found, retrying in 2s...');
    setTimeout(init, 2000);
  }

  // Check if we're on a search results page and send results
  if (window.location.href.includes('/results?search_query=')) {
    console.log('[TubeControl Content] On search results page, scraping...');
    setTimeout(scrapeSearchResults, 3000); // Wait for results to load
  }
}

// Get current player state
function getPlayerState() {
  if (!player) {
    player = findPlayer();
    if (!player) return null;
  }

  // Get video title and channel
  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string');
  const channelElement = document.querySelector('ytd-channel-name a, #channel-name a');

  // Check if we're in an ad (duration will be very short or invalid)
  const isAd = player.duration < 1 || isNaN(player.duration) || !titleElement?.textContent;

  // If it's an ad, don't send empty state - wait for actual video
  if (isAd) {
    return null;
  }

  return {
    isPlaying: !player.paused,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: Math.round(player.volume * 100),
    isMuted: player.muted,
    title: titleElement?.textContent || '',
    channelName: channelElement?.textContent || ''
  };
}

// Check if extension context is valid
function isExtensionContextValid() {
  try {
    return chrome.runtime?.id !== undefined;
  } catch (e) {
    return false;
  }
}

// Send player state to background
function sendPlayerState() {
  if (!isExtensionContextValid()) {
    console.log('TubeControl: Extension context invalidated, stopping');
    return;
  }

  const state = getPlayerState();
  if (state) {
    playerState = state;
    chrome.runtime.sendMessage({
      type: 'EVENT',
      data: {
        action: 'PLAYER_STATE',
        state
      }
    }).catch((error) => {
      if (error.message?.includes('Extension context invalidated')) {
        console.log('TubeControl: Extension context invalidated');
      }
    });
  }
}

// Handle commands from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'COMMAND') return;

  const { action, payload } = message;

  if (!player) {
    player = findPlayer();
    if (!player) {
      sendResponse({ error: 'Player not found' });
      return;
    }
  }

  console.log('TubeControl: Executing command:', action);

  switch (action) {
    case 'PLAY':
      player.play();
      break;

    case 'PAUSE':
      player.pause();
      break;

    case 'SET_VOLUME':
      if (payload && typeof payload.volume === 'number') {
        player.volume = Math.max(0, Math.min(1, payload.volume / 100));
      }
      break;

    case 'MUTE':
      player.muted = true;
      break;

    case 'UNMUTE':
      player.muted = false;
      break;

    case 'SEEK':
      if (payload && typeof payload.time === 'number') {
        player.currentTime = payload.time;
      }
      break;

    case 'NEXT':
      clickButton('.ytp-next-button');
      break;

    case 'PREVIOUS':
      // YouTube doesn't have a standard previous button
      // So restart the current video instead
      if (player) {
        player.currentTime = 0;
      }
      break;

    case 'FULLSCREEN':
      // Use YouTube's fullscreen button for proper fullscreen handling
      clickButton('.ytp-fullscreen-button');
      break;

    case 'SEARCH':
      if (payload && payload.query) {
        performSearch(payload.query);
      }
      break;

    case 'PLAY_VIDEO':
      if (payload && payload.videoId) {
        window.location.href = `https://www.youtube.com/watch?v=${payload.videoId}`;
      }
      break;

    case 'GET_STATE':
      sendPlayerState();
      break;
  }

  sendResponse({ success: true });
  setTimeout(sendPlayerState, 100);
});

// Click a YouTube button
function clickButton(selector) {
  const button = document.querySelector(selector);
  if (button) {
    button.click();
  }
}

// Perform search and send results
function performSearch(query) {
  // Navigate to search results
  // The scraping will happen automatically when the page loads (in init())
  window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// Scrape search results
function scrapeSearchResults() {
  console.log('[TubeControl Content] Scraping search results...');
  const results = [];
  const videoElements = document.querySelectorAll('ytd-video-renderer');

  console.log('[TubeControl Content] Found', videoElements.length, 'video elements');

  for (let i = 0; i < Math.min(videoElements.length, 10); i++) {
    const element = videoElements[i];

    const titleElement = element.querySelector('#video-title');
    const channelElement = element.querySelector('#channel-name a');
    const thumbnailElement = element.querySelector('img');
    const durationElement = element.querySelector('span.ytd-thumbnail-overlay-time-status-renderer');

    if (titleElement) {
      const videoId = titleElement.getAttribute('href')?.split('v=')[1]?.split('&')[0];

      results.push({
        videoId,
        title: titleElement.textContent.trim(),
        channelName: channelElement?.textContent.trim() || '',
        thumbnail: thumbnailElement?.src || '',
        duration: durationElement?.textContent.trim() || ''
      });
    }
  }

  console.log('[TubeControl Content] Sending', results.length, 'results to background');

  // Send results to background
  if (isExtensionContextValid()) {
    chrome.runtime.sendMessage({
      type: 'EVENT',
      data: {
        action: 'SEARCH_RESULTS',
        results
      }
    }).catch(() => {});
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
