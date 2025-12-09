const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatus = document.getElementById('keyStatus');

// Load saved API key
const savedKey = localStorage.getItem('openrouter_key');
if (savedKey) {
  apiKeyInput.value = savedKey;
  keyStatus.textContent = '✓ Key saved';
}

saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem('openrouter_key', key);
    keyStatus.textContent = '✓ Key saved';
  }
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  const apiKey = localStorage.getItem('openrouter_key');
  
  if (!apiKey) {
    alert('Please enter your OpenRouter API key first');
    return;
  }
  if (!query) return;

  addMessage('user', query);
  queryInput.value = '';
  queryInput.disabled = true;
  document.querySelector('button[type="submit"]').disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('assistant', `Error: ${data.error}`);
    } else {
      // Show BF code that was executed
      document.getElementById('routerCode').textContent = data.bf.router.code;
      document.getElementById('parserCode').textContent = data.bf.parser.code;
      document.getElementById('scorerCode').textContent = data.bf.scorer.code;

      // Update BF visualizations
      renderTape('routerTape', data.bf.router.tape, data.bf.router.pointer);
      document.getElementById('routerOutput').textContent = `→ ${data.model}`;

      renderTape('parserTape', data.bf.parser.tape, data.bf.parser.pointer);
      document.getElementById('parserOutput').textContent = `Parsed`;

      renderTape('scorerTape', data.bf.scorer.tape, data.bf.scorer.pointer);
      document.getElementById('scorerOutput').textContent = `${data.confidence}% confidence`;

      addMessage('assistant', data.text, data.emoji, data.model, data.confidence);
    }
  } catch (err) {
    addMessage('assistant', `Error: ${err.message}`);
  }

  queryInput.disabled = false;
  document.querySelector('button[type="submit"]').disabled = false;
  queryInput.focus();
});

function addMessage(role, text, emoji = '', model = '', confidence = '') {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  
  if (role === 'user') {
    div.innerHTML = `<div class="content">${escapeHtml(text)}</div>`;
  } else {
    div.innerHTML = `
      ${model ? `<div class="meta">Model: ${model}</div>` : ''}
      ${emoji ? `<div class="emoji">${emoji}</div>` : ''}
      <div class="content">${escapeHtml(text)}</div>
      ${confidence ? `<div class="confidence">${confidence}% confidence</div>` : ''}
    `;
  }
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderTape(elementId, tape, pointer) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  
  const displayTape = tape.slice(0, 20);
  displayTape.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = `cell ${i === pointer ? 'active' : ''}`;
    cell.textContent = val;
    container.appendChild(cell);
  });
}
