const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const saveKeyBtn = document.getElementById('saveKeyBtn');
const keyStatus = document.getElementById('keyStatus');

// Load saved state
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
  const selectedModel = modelSelect.value;
  
  if (!apiKey) {
    alert('Please enter your OpenRouter API key');
    return;
  }
  if (!query) return;

  addMessage('user', query);
  queryInput.value = '';
  setLoading(true);
  updatePanels('processing');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey, selectedModel })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('error', data.error);
      updatePanels('error');
    } else {
      // Update BF panels
      updateRouterPanel(data.bf?.router, data.model);
      updateTokenPanel(data.bf?.tokenCounter, data.stats);
      updateCostPanel(data.bf?.costCalc, data.stats);
      updateScorerPanel(data.bf?.scorer, data.confidence);
      updateStats(data.stats, data.confidence);

      addMessage('assistant', data.response, data.model, data.confidence);
    }
  } catch (err) {
    addMessage('error', err.message);
    updatePanels('error');
  }

  setLoading(false);
});

function setLoading(loading) {
  queryInput.disabled = loading;
  document.querySelector('button[type="submit"]').disabled = loading;
}

function updatePanels(status) {
  const panels = ['router', 'token', 'cost', 'scorer'];
  panels.forEach(p => {
    document.getElementById(`${p}Status`).textContent = status;
    if (status === 'processing') {
      document.getElementById(`${p}Code`).textContent = 'executing...';
    }
  });
}

function updateRouterPanel(router, model) {
  if (!router) {
    document.getElementById('routerStatus').textContent = 'manual';
    document.getElementById('routerResult').textContent = `Model: ${model} (manually selected)`;
    return;
  }
  
  document.getElementById('routerStatus').textContent = `→ ${router.output || 'M'}`;
  
  // Show scanned words
  let html = '';
  if (router.scans) {
    router.scans.forEach(s => {
      const isMatch = s.word === router.matchedKeyword;
      const cls = isMatch ? 'text-accent font-bold' : 'text-dim';
      html += `<span class="${cls}">${s.word}</span> `;
    });
  }
  
  if (router.matchedKeyword) {
    html += `<br><span class="text-accent">✓ Matched "${router.matchedKeyword}" → ${model}</span>`;
  } else {
    html += `<br><span class="text-dim">No keyword match → ${model} (default)</span>`;
  }
  
  document.getElementById('routerResult').innerHTML = html;
  document.getElementById('routerCode').textContent = ',>,>,...[->>>>+>+<<<<<]...';
}

function updateTokenPanel(tokenCounter, stats) {
  document.getElementById('tokenStatus').textContent = `${stats?.totalTokens || 0} tokens`;
  document.getElementById('tokenResult').textContent = `Prompt: ${stats?.promptTokens || 0} | Completion: ${stats?.completionTokens || 0}`;
  document.getElementById('tokenCode').textContent = ',[->>+<<]>>[->+<]...';
}

function updateCostPanel(costCalc, stats) {
  const costStr = stats?.cost || '$0.000000';
  const tier = stats?.realCost > 0.01 ? '$$$' : stats?.realCost > 0.001 ? '$$' : '$';
  document.getElementById('costStatus').textContent = tier;
  document.getElementById('costResult').textContent = stats?.realCost 
    ? `${costStr} (from API)` 
    : `${costStr} (estimated)`;
  document.getElementById('costCode').textContent = ',[->+>+<<]>>[-<<+>>]...';
}

function updateScorerPanel(scorer, confidence) {
  document.getElementById('scorerStatus').textContent = `${confidence}%`;
  
  let color = 'text-green-400';
  if (confidence < 50) color = 'text-red-400';
  else if (confidence < 75) color = 'text-yellow-400';
  
  document.getElementById('scorerResult').innerHTML = `<span class="${color}">Confidence: ${confidence}%</span>`;
  document.getElementById('scorerCode').textContent = '>>+++++++++<<,[[->>--<<]...]';
}

function updateStats(stats, confidence) {
  // Real TTFT from streaming
  document.getElementById('statTTFT').textContent = `${stats?.timeToFirstToken || 0}ms`;
  document.getElementById('statTime').textContent = `${stats?.totalTime || 0}ms`;
  document.getElementById('statTokens').textContent = stats?.totalTokens || 0;
  // Tokens per second
  document.getElementById('statSpeed').textContent = `${stats?.tokensPerSecond || 0} tok/s`;
  // Real cost from OpenRouter API
  document.getElementById('statCost').textContent = stats?.cost || '$0';
  document.getElementById('statConfidence').textContent = `${confidence}%`;
}

function addMessage(role, text, model = '', confidence = '') {
  const div = document.createElement('div');
  
  if (role === 'user') {
    div.className = 'p-3 bg-card border-l-2 border-accent rounded';
    div.innerHTML = `<p class="text-gray-200">${escapeHtml(text)}</p>`;
  } else if (role === 'error') {
    div.className = 'p-3 bg-red-900/30 border-l-2 border-red-500 rounded';
    div.innerHTML = `<p class="text-red-400">Error: ${escapeHtml(text)}</p>`;
  } else {
    div.className = 'p-3 bg-surface border-l-2 border-dim rounded';
    
    let confidenceColor = 'text-green-400';
    if (confidence < 50) confidenceColor = 'text-red-400';
    else if (confidence < 75) confidenceColor = 'text-yellow-400';
    
    div.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs text-accent">${model}</span>
        <span class="text-xs ${confidenceColor}">${confidence}% confidence</span>
      </div>
      <p class="text-gray-200 whitespace-pre-wrap">${escapeHtml(text)}</p>
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
