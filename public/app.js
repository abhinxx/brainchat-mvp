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

  setPanel('router', 'scanning words...', '-', null);
  setPanel('parser', 'waiting...', '-', null);
  setPanel('scorer', 'waiting...', '-', null);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('error', data.error);
      setPanel('router', 'error', '-', null);
      setPanel('parser', 'error', '-', null);
      setPanel('scorer', 'error', '-', null);
    } else {
      // Show word scanning results
      const scans = data.bf.router.scans || [];
      const matchedWord = data.matchedWord;
      
      // Build scan visualization
      let scanHtml = '<div class="text-xs space-y-1">';
      scans.forEach(s => {
        const isMatch = s.word === matchedWord;
        const cls = isMatch ? 'text-accent font-bold bg-accent/20 px-1 rounded' : 'text-gray-500';
        scanHtml += `<span class="${cls}">${s.word}</span> `;
      });
      scanHtml += '</div>';
      
      if (matchedWord) {
        scanHtml += `<div class="mt-2 text-accent text-sm">✓ Matched: "${matchedWord}" → ${data.model}</div>`;
      } else {
        scanHtml += `<div class="mt-2 text-gray-400 text-sm">No keyword match → ${data.model} (default)</div>`;
      }
      
      document.getElementById('routerOutput').innerHTML = `<span class="text-accent">→ ${data.model}</span>`;
      document.getElementById('routerCode').textContent = data.bf.router.code.slice(0, 80) + '...';
      document.getElementById('routerScans').innerHTML = scanHtml;

      setPanel('parser', '✓ parsed', data.bf.parser.code.slice(0, 60) + '...', null);
      setPanel('scorer', `${data.confidence}%`, data.bf.scorer.code.slice(0, 60) + '...', null);

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

function setPanel(name, status, code, tape) {
  const statusEl = document.getElementById(`${name}Output`);
  const codeEl = document.getElementById(`${name}Code`);
  
  if (statusEl) {
    const cls = status.includes('error') ? 'text-red-400' : 'text-accent';
    statusEl.innerHTML = `<span class="${cls}">${status}</span>`;
  }
  if (codeEl && code) {
    codeEl.textContent = code;
  }
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
