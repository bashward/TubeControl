import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONNECTION, COMMANDS, EVENTS } from './event-types.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors());

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active rooms
const rooms = new Map();

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  

  // Handle room joining
  socket.on(CONNECTION.JOIN_ROOM, ({ roomCode, deviceType }) => {
   

    // Leave any existing rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomCode);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        extension: null,
        remote: null,
        createdAt: Date.now()
      });
    }

    const room = rooms.get(roomCode);

    // Track device type
    if (deviceType === 'extension') {
      room.extension = socket.id;
    } else if (deviceType === 'remote') {
      room.remote = socket.id;
    }

    // Confirm room joined
    socket.emit(CONNECTION.ROOM_JOINED, {
      roomCode,
      deviceType,
      peersInRoom: io.sockets.adapter.rooms.get(roomCode)?.size || 1
    });

    // Notify others in the room
    socket.to(roomCode).emit(CONNECTION.PEER_CONNECTED, {
      deviceType,
      peersInRoom: io.sockets.adapter.rooms.get(roomCode)?.size || 1
    });

    
  });

  // Relay commands from remote to extension
  socket.on('COMMAND', (data) => {
    const roomCode = getRoomCode(socket);
    if (roomCode) {
      
      socket.to(roomCode).emit('COMMAND', data);
    }
  });

  // Relay events from extension to remote
  socket.on('EVENT', (data) => {
    const roomCode = getRoomCode(socket);
    if (roomCode) {
      
      socket.to(roomCode).emit('EVENT', data);
    }
  });

  // Handle explicit leave room request
  socket.on(CONNECTION.LEAVE_ROOM, () => {
    const roomCode = getRoomCode(socket);
    if (roomCode) {
      const currentSize = io.sockets.adapter.rooms.get(roomCode)?.size || 1;
      const newSize = currentSize - 1;
      

      // Notify others in the room before leaving
      
      socket.to(roomCode).emit(CONNECTION.PEER_DISCONNECTED, {
        peersInRoom: newSize
      });

      // Leave the room
      socket.leave(roomCode);
      

      // Clean up room data
      const room = rooms.get(roomCode);
      if (room) {
        if (room.extension === socket.id) {
          room.extension = null;
        
        }
        if (room.remote === socket.id) {
          room.remote = null;
          
        }
      }
    } else {
      console.log('WARNING: No room code found for socket', socket.id);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    

    const roomCode = getRoomCode(socket);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        // Clear device references
        if (room.extension === socket.id) {
          room.extension = null;
        }
        if (room.remote === socket.id) {
          room.remote = null;
        }

        // Clean up empty rooms
        if (!room.extension && !room.remote) {
          rooms.delete(roomCode);
         
        } else {
          // Notify remaining peers
          socket.to(roomCode).emit(CONNECTION.PEER_DISCONNECTED, {
            peersInRoom: io.sockets.adapter.rooms.get(roomCode)?.size || 0
          });
        }
      }
    }
  });
});

// Helper function to get room code for a socket
function getRoomCode(socket) {
  const rooms = Array.from(socket.rooms);
  return rooms.find(room => room !== socket.id);
}

// Clean up old rooms periodically (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.createdAt > dayInMs) {
      rooms.delete(roomCode);
      
    }
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`TubeControl server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
