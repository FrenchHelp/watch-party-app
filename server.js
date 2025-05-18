const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = {}; // { roomId: { videoState, users: Set } }

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        videoState: {
          playing: false,
          currentTime: 0,
          videoId: 'dQw4w9WgXcQ' // default video (Rick Astley!)
        },
        users: new Set(),
      };
    }

    rooms[roomId].users.add(socket.id);

    // Send current video state to this user
    socket.emit('video-state', rooms[roomId].videoState);

    // Notify room about new user
    io.to(roomId).emit('chat-message', {
      username: 'System',
      message: `${username} joined the room`,
    });

    // Update user list
    io.to(roomId).emit('user-list', Array.from(rooms[roomId].users));
  });

  socket.on('chat-message', msg => {
    if (socket.roomId) {
      io.to(socket.roomId).emit('chat-message', {
        username: socket.username,
        message: msg,
      });
    }
  });

  socket.on('video-control', data => {
    // Update room video state
    if (socket.roomId && rooms[socket.roomId]) {
      rooms[socket.roomId].videoState = { ...rooms[socket.roomId].videoState, ...data };
      // Broadcast to everyone else in the room
      socket.to(socket.roomId).emit('video-state', rooms[socket.roomId].videoState);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId && rooms[socket.roomId]) {
      rooms[socket.roomId].users.delete(socket.id);
      io.to(socket.roomId).emit('chat-message', {
        username: 'System',
        message: `${socket.username} left the room`,
      });
      io.to(socket.roomId).emit('user-list', Array.from(rooms[socket.roomId].users));
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
