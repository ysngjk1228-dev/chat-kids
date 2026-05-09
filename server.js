require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const CHAT_PASSWORD = process.env.CHAT_PASSWORD || 'changeme';

const users = {};

io.on('connection', (socket) => {
  socket.on('join', ({ username, password }) => {
    if (password !== CHAT_PASSWORD) {
      socket.emit('join-error', 'パスワードが違います');
      return;
    }
    const takenNames = Object.values(users);
    if (takenNames.includes(username)) {
      socket.emit('join-error', 'その名前はすでに使われています');
      return;
    }

    socket.data.username = username;
    users[socket.id] = username;

    io.emit('user-joined', {
      username,
      users: Object.values(users),
    });
  });

  socket.on('message', (text) => {
    const username = socket.data.username;
    if (!username) return;
    io.emit('message', {
      username,
      text,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (!username) return;
    delete users[socket.id];
    io.emit('user-left', {
      username,
      users: Object.values(users),
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (CHAT_PASSWORD === 'changeme') {
    console.warn('⚠️  CHAT_PASSWORD is not set. Please set the CHAT_PASSWORD environment variable.');
  }
});
