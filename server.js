// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

// Helper to ensure room data exists
function createRoomIfNotExists(room) {
  if (!rooms[room]) {
    rooms[room] = {
      users: {},
      videoID: null,
      videoState: 'paused', // 'playing' or 'paused'
      videoTime: 0,
    };
  }
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins a room
  socket.on('joinRoom', ({ username, room }) => {
    createRoomIfNotExists(room);
    socket.join(room);

    // Store user info
    rooms[room].users[socket.id] = username;

    // Send current video state to new user
    const { videoID, videoState, videoTime } = rooms[room];
    socket.emit('loadVideo', videoID);
    if (videoID) {
      if (videoState === 'playing') {
        socket.emit('videoPlay', videoTime);
      } else {
        socket.emit('videoPause', videoTime);
      }
    }

    // Notify room about new user
    io.to(room).emit('chatMessage', {
      username: 'VibeRoom Bot',
      message: `${username} has joined the room.`,
    });

    console.log(`${username} joined room ${room}`);
  });

  // Chat messages
  socket.on('chatMessage', (msg) => {
    const userRoom = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!userRoom) return;

    const username = rooms[userRoom]?.users[socket.id] || 'Anonymous';

    io.to(userRoom).emit('chatMessage', { username, message: msg });
  });

  // Video events
  socket.on('loadVideo', (videoID) => {
    const userRoom = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!userRoom) return;

    createRoomIfNotExists(userRoom);
    rooms[userRoom].videoID = videoID;
    rooms[userRoom].videoState = 'paused';
    rooms[userRoom].videoTime = 0;

    // Broadcast to all others in room
    socket.to(userRoom).emit('loadVideo', videoID);
  });

  socket.on('videoPlay', (time) => {
    const userRoom = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!userRoom) return;

    rooms[userRoom].videoState = 'playing';
    rooms[userRoom].videoTime = time;

    socket.to(userRoom).emit('videoPlay', time);
  });

  socket.on('videoPause', (time) => {
    const userRoom = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!userRoom) return;

    rooms[userRoom].videoState = 'paused';
    rooms[userRoom].videoTime = time;

    socket.to(userRoom).emit('videoPause', time);
  });

  socket.on('videoSeek', (time) => {
    const userRoom = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!userRoom) return;

    rooms[userRoom].videoTime = time;
    socket.to(userRoom).emit('videoSeek', time);
  });

  // User disconnects
  socket.on('disconnect', () => {
    for (const room in rooms) {
      if (rooms[room].users[socket.id]) {
        const username = rooms[room].users[socket.id];
        delete rooms[room].users[socket.id];

        io.to(room).emit('chatMessage', {
          username: 'VibeRoom Bot',
          message: `${username} has left the room.`,
        });

        console.log(`${username} disconnected from room ${room}`);

        // If room is empty, delete it
        if (Object.keys(rooms[room].users).length === 0) {
          delete rooms[room];
          console.log(`Deleted empty room: ${room}`);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`VibeRoom server running on port ${PORT}`);
});
