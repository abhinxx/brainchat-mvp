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
  keyStatus.textContent = '✓ saved';
}

saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem('openrouter_key', key);
    keyStatus.textContent = '✓ saved';
  }
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  const apiKey = localStorage.getItem('openrouter_key');
  
  if (!apiKey) {
    alert('Enter your OpenRouter API key first');
    return;
  }
  if (!query) return;

  addMessage('user', query);
  queryInput.value = '';
  setLoading(true);

  // Update panels
  setPanel('router', 'processing...', '-', []);
  setPanel('parser', 'processing...', '-', []);
  setPanel('scorer', 'processing...', '-', []);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('error', data.error);
      setPanel('router', 'error', '-', []);
      setPanel('parser', 'error', '-', []);
      setPanel('scorer', 'error', '-', []);
    } else {
      // Update BF panels with results
      setPanel('router', `→ ${data.model}`, data.bf.router.code, data.bf.router.tape, data.bf.router.pointer);
      setPanel('parser', '✓ parsed', data.bf.parser.code, data.bf.parser.tape, data.bf.parser.pointer);
      setPanel('scorer', `${data.confidence}%`, data.bf.scorer.code, data.bf.scorer.tape, data.bf.scorer.pointer);

      addMessage('assistant', data.text, data.emoji, data.model, data.confidence);
    }
  } catch (err) {
    addMessage('error', err.message);
  }

  setLoading(false);
  queryInput.focus();
});

function setLoading(loading) {
  queryInput.disabled = loading;
  document.querySelector('button[type="submit"]').disabled = loading;
}

function setPanel(name, status, code, tape, pointer = 0) {
  const statusClass = status.includes('error') ? 'text-red-400' : 'text-accent';
  document.getElementById(`${name}Output`).innerHTML = `<span class="${statusClass}">${status}</span>`;
  document.getElementById(`${name}Code`).textContent = code;
  renderTape(`${name}Tape`, tape, pointer);
}

function addMessage(role, text, emoji = '', model = '', confidence = '') {
  const div = document.createElement('div');
  
  if (role === 'user') {
    div.className = 'p-2 bg-bg border-l-2 border-accent rounded text-sm';
    div.innerHTML = `<span class="text-gray-300">${escapeHtml(text)}</span>`;
  } else if (role === 'error') {
    div.className = 'p-2 bg-red-900/20 border-l-2 border-red-500 rounded text-sm';
    div.innerHTML = `<span class="text-red-400">Error: ${escapeHtml(text)}</span>`;
  } else {
    div.className = 'p-2 bg-bg border-l-2 border-gray-600 rounded text-sm';
    div.innerHTML = `
      <div class="text-[10px] text-gray-500 mb-1">via ${model}</div>
      ${emoji ? `<div class="text-xl mb-1">${emoji}</div>` : ''}
      <div class="text-gray-300">${escapeHtml(text)}</div>
      <div class="text-[10px] text-accent mt-1">${confidence}% confidence</div>
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
  if (!tape || !tape.length) return;
  
  tape.slice(0, 12).forEach((val, i) => {
    const cell = document.createElement('div');
    const isActive = i === pointer;
    cell.className = `w-6 h-5 flex items-center justify-center text-[9px] rounded ${isActive ? 'bg-accent text-bg font-bold' : 'bg-bg text-gray-500'}`;
    cell.textContent = val;
    container.appendChild(cell);
  });
}
