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
  setLoading(true);

  // Set panels to "processing"
  document.getElementById('routerOutput').textContent = 'processing...';
  document.getElementById('parserOutput').textContent = 'processing...';
  document.getElementById('scorerOutput').textContent = 'processing...';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('assistant', `Error: ${data.error}`);
      resetPanels();
    } else {
      // Update BF panels
      document.getElementById('routerCode').textContent = data.bf.router.code;
      document.getElementById('parserCode').textContent = data.bf.parser.code;
      document.getElementById('scorerCode').textContent = data.bf.scorer.code;

      renderTape('routerTape', data.bf.router.tape, data.bf.router.pointer);
      document.getElementById('routerOutput').innerHTML = `<span class="text-accent">→ ${data.model}</span>`;

      renderTape('parserTape', data.bf.parser.tape, data.bf.parser.pointer);
      document.getElementById('parserOutput').innerHTML = `<span class="text-accent">✓ parsed</span>`;

      renderTape('scorerTape', data.bf.scorer.tape, data.bf.scorer.pointer);
      document.getElementById('scorerOutput').innerHTML = `<span class="text-accent">${data.confidence}%</span>`;

      addMessage('assistant', data.text, data.emoji, data.model, data.confidence);
    }
  } catch (err) {
    addMessage('assistant', `Error: ${err.message}`);
    resetPanels();
  }

  setLoading(false);
  queryInput.focus();
});

function setLoading(loading) {
  queryInput.disabled = loading;
  document.querySelector('button[type="submit"]').disabled = loading;
}

function resetPanels() {
  document.getElementById('routerOutput').textContent = 'error';
  document.getElementById('parserOutput').textContent = 'error';
  document.getElementById('scorerOutput').textContent = 'error';
}

function addMessage(role, text, emoji = '', model = '', confidence = '') {
  const div = document.createElement('div');
  
  if (role === 'user') {
    div.className = 'p-3 bg-surface border-l-2 border-accent rounded';
    div.innerHTML = `<p class="text-gray-200">${escapeHtml(text)}</p>`;
  } else {
    div.className = 'p-3 bg-bg border-l-2 border-gray-600 rounded';
    div.innerHTML = `
      ${model ? `<p class="text-xs text-gray-500 mb-1">Model: ${model}</p>` : ''}
      ${emoji ? `<p class="text-2xl mb-2">${emoji}</p>` : ''}
      <p class="text-gray-200">${escapeHtml(text)}</p>
      ${confidence ? `<p class="text-xs text-accent mt-2">${confidence}% confidence</p>` : ''}
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
  
  const displayTape = tape.slice(0, 16);
  displayTape.forEach((val, i) => {
    const cell = document.createElement('div');
    const isActive = i === pointer;
    cell.className = `tape-cell h-7 flex items-center justify-center text-xs rounded ${isActive ? 'bg-accent text-bg font-bold' : 'bg-surface text-gray-400 border border-border'}`;
    cell.textContent = val;
    container.appendChild(cell);
  });
}
