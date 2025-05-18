// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join a room
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    console.log(`${username} joined room: ${room}`);

    // Notify others in room
    socket.to(room).emit('chatMessage', {
      username: 'System',
      message: `${username} has joined the room.`,
    });

    // Optionally send back current room info or users list
  });

  // Chat message received
  socket.on('chatMessage', (msg) => {
    const room = socket.room;
    if (room) {
      io.to(room).emit('chatMessage', {
        username: socket.username,
        message: msg,
      });
    }
  });

  // Video controls: play
  socket.on('videoPlay', (currentTime) => {
    socket.to(socket.room).emit('videoPlay', currentTime);
  });

  // Video controls: pause
  socket.on('videoPause', (currentTime) => {
    socket.to(socket.room).emit('videoPause', currentTime);
  });

  // Video controls: seek
  socket.on('videoSeek', (time) => {
    socket.to(socket.room).emit('videoSeek', time);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.room) {
      socket.to(socket.room).emit('chatMessage', {
        username: 'System',
        message: `${socket.username} has left the room.`,
      });
    }
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
