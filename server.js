const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join', ({ room, username }) => {
    socket.join(room);
    socket.data.room = room;
    socket.data.username = username;

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(username);

    io.to(room).emit('user-joined', {
      username,
      users: rooms[room],
    });
  });

  socket.on('message', ({ room, text }) => {
    const username = socket.data.username;
    io.to(room).emit('message', {
      username,
      text,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  socket.on('disconnect', () => {
    const { room, username } = socket.data;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((u) => u !== username);
      if (rooms[room].length === 0) {
        delete rooms[room];
      } else {
        io.to(room).emit('user-left', {
          username,
          users: rooms[room],
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
