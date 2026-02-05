const chat = document.getElementById('chat');
const form = document.getElementById('chat-form');
const input = document.getElementById('message');

const history = [];

function renderMessage(role, content) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = content;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage(message) {
  renderMessage('user', message);
  history.push({ role: 'user', content: message });

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  const data = await response.json();
  renderMessage('assistant', data.reply);
  history.push({ role: 'assistant', content: data.reply });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  await sendMessage(message);
});

renderMessage('assistant', 'Hello! Ask me about your product idea or architecture.');
