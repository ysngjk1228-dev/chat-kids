const socket = io();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const loginError = document.getElementById('login-error');
const roomLabel = document.getElementById('room-label');
const userList = document.getElementById('user-list');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let myUsername = '';
let currentRoom = '';

joinBtn.addEventListener('click', join);
[usernameInput, roomInput].forEach((el) =>
  el.addEventListener('keydown', (e) => e.key === 'Enter' && join())
);

function join() {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();
  if (!username) { loginError.textContent = '名前を入力してください'; return; }
  if (!room) { loginError.textContent = 'ルーム名を入力してください'; return; }
  myUsername = username;
  currentRoom = room;
  socket.emit('join', { room, username });
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  roomLabel.textContent = '# ' + room;
  messageInput.focus();
}

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('message', { room: currentRoom, text });
  messageInput.value = '';
});

socket.on('message', ({ username, text, time }) => {
  addMessage(username, text, time, username === myUsername ? 'mine' : 'other');
});

socket.on('user-joined', ({ username, users }) => {
  updateUserList(users);
  if (username !== myUsername) {
    addSystem(`${username} が入室しました`);
  }
});

socket.on('user-left', ({ username, users }) => {
  updateUserList(users);
  addSystem(`${username} が退出しました`);
});

function addMessage(username, text, time, type) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerHTML = `
    <div class="msg-meta">${type === 'mine' ? '' : username + ' '}${time}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addSystem(text) {
  const div = document.createElement('div');
  div.className = 'msg system';
  div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function updateUserList(users) {
  userList.innerHTML = users.map((u) => `<li>${escapeHtml(u)}</li>`).join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
