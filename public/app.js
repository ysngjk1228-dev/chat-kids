const socket = io();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const roomField = document.getElementById('room-field');
const joinBtn = document.getElementById('join-btn');
const loginError = document.getElementById('login-error');
const invitedNotice = document.getElementById('invited-notice');
const invitedRoomName = document.getElementById('invited-room-name');
const roomLabel = document.getElementById('room-label');
const userList = document.getElementById('user-list');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const copyLinkBtn = document.getElementById('copy-link-btn');
const copyMsg = document.getElementById('copy-msg');

let myUsername = '';
let currentRoom = '';

// URLから ?room=xxx を読み込む
const urlParams = new URLSearchParams(location.search);
const presetRoom = urlParams.get('room');
if (presetRoom) {
  roomField.classList.add('hidden');
  invitedNotice.classList.remove('hidden');
  invitedRoomName.textContent = presetRoom;
}

joinBtn.addEventListener('click', join);
usernameInput.addEventListener('keydown', (e) => e.key === 'Enter' && join());
roomInput.addEventListener('keydown', (e) => e.key === 'Enter' && join());

function join() {
  const username = usernameInput.value.trim();
  const room = presetRoom || roomInput.value.trim();
  if (!username) { loginError.textContent = '名前を入力してください'; return; }
  if (!room) { loginError.textContent = 'ルーム名を入力してください'; return; }

  myUsername = username;
  currentRoom = room;
  socket.emit('join', { room, username });

  // URLをルーム名入りに更新（ブラウザ履歴は汚さない）
  const url = new URL(location.href);
  url.searchParams.set('room', room);
  history.replaceState(null, '', url.toString());

  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  roomLabel.textContent = '# ' + room;
  messageInput.focus();
}

// 招待リンクコピー
copyLinkBtn.addEventListener('click', () => {
  const link = location.href;
  navigator.clipboard.writeText(link).then(() => {
    copyMsg.textContent = 'コピーしました！';
    setTimeout(() => { copyMsg.textContent = ''; }, 2500);
  }).catch(() => {
    // fallback
    prompt('このリンクをコピーして送ってね', link);
  });
});

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
