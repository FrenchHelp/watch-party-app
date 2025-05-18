io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (room) => {
    socket.join(room);
  });

  socket.on('chatMessage', ({ room, user, message }) => {
    io.to(room).emit('chatMessage', { user, message });
  });

  socket.on('videoControl', ({ room, action, time }) => {
    io.to(room).emit('videoControl', { action, time });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`VibeRoom server running on port ${PORT}`);
});
