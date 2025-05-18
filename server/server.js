const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let users = {};
if (fs.existsSync('./users.json')) {
  users = JSON.parse(fs.readFileSync('./users.json'));
}
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    if (users[username].password === password) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
  } else {
    users[username] = { password, chats: [] };
    fs.writeFileSync('./users.json', JSON.stringify(users));
    return res.json({ success: true });
  }
});
