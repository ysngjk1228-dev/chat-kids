const socket = io();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const joinBtn = document.getElementById('join-btn');
const loginError = document.getElementById('login-error');
const userList = document.getElementById('user-list');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let myUsername = '';

joinBtn.addEventListener('click', join);
[usernameInput, passwordInput].forEach((el) =>
  el.addEventListener('keydown', (e) => e.key === 'Enter' && join())
);

function join() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username) { loginError.textContent = '名前を入力してください'; return; }
  if (!password) { loginError.textContent = 'パスワードを入力してください'; return; }
  myUsername = username;
  joinBtn.disabled = true;
  socket.emit('join', { username, password });
}

socket.on('join-error', (msg) => {
  loginError.textContent = msg;
  joinBtn.disabled = false;
  passwordInput.value = '';
  passwordInput.focus();
});

socket.on('user-joined', ({ username, users }) => {
  if (username === myUsername) {
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    messageInput.focus();
  } else {
    addSystem(`${username} が入室しました`);
  }
  updateUserList(users);
});

socket.on('user-left', ({ username, users }) => {
  updateUserList(users);
  addSystem(`${username} が退出しました`);
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('message', text);
  messageInput.value = '';
});

socket.on('message', ({ username, text, time }) => {
  addMessage(username, text, time, username === myUsername ? 'mine' : 'other');
});

function addMessage(username, text, time, type) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.innerHTML = `
    <div class="msg-meta">${type === 'mine' ? '' : escapeHtml(username) + ' '}${time}</div>
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
