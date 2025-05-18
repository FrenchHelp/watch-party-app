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
