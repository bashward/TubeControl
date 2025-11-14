/**
 * Event types for TubeControl communication
 */

// Commands sent from Web App to Extension
export const COMMANDS = {
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  SET_VOLUME: 'SET_VOLUME',
  MUTE: 'MUTE',
  UNMUTE: 'UNMUTE',
  SEEK: 'SEEK',
  NEXT: 'NEXT',
  PREVIOUS: 'PREVIOUS',
  FULLSCREEN: 'FULLSCREEN',
  EXIT_FULLSCREEN: 'EXIT_FULLSCREEN',
  SEARCH: 'SEARCH',
  PLAY_VIDEO: 'PLAY_VIDEO',
  GET_STATE: 'GET_STATE'
};

// Events sent from Extension to Web App
export const EVENTS = {
  PLAYER_STATE: 'PLAYER_STATE',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
  ERROR: 'ERROR',
  VIDEO_INFO: 'VIDEO_INFO'
};

// Connection events
export const CONNECTION = {
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  ROOM_JOINED: 'ROOM_JOINED',
  PEER_CONNECTED: 'PEER_CONNECTED',
  PEER_DISCONNECTED: 'PEER_DISCONNECTED',
  DISCONNECT: 'DISCONNECT'
};

// Room code generation utility
export function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate room code
export function isValidRoomCode(code) {
  return /^\d{6}$/.test(code);
}
