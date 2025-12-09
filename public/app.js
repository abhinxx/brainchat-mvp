const chatBox = document.getElementById('chatBox');
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  // Add user message
  addMessage('user', query);
  queryInput.value = '';
  queryInput.disabled = true;
  document.querySelector('button').disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    if (data.error) {
      addMessage('assistant', `Error: ${data.error}`);
    } else {
      // Update BF visualizations
      renderTape('routerTape', data.bf.router.tape, data.bf.router.pointer);
      document.getElementById('routerOutput').textContent = `→ ${data.model}`;

      renderTape('parserTape', data.bf.parser.tape, data.bf.parser.pointer);
      document.getElementById('parserOutput').textContent = `Parsed`;

      renderTape('scorerTape', data.bf.scorer.tape, data.bf.scorer.pointer);
      document.getElementById('scorerOutput').textContent = `${data.confidence}% confidence`;

      // Add assistant message
      addMessage('assistant', data.text, data.emoji, data.model, data.confidence);
    }
  } catch (err) {
    addMessage('assistant', `Error: ${err.message}`);
  }

  queryInput.disabled = false;
  document.querySelector('button').disabled = false;
  queryInput.focus();
});

function addMessage(role, text, emoji = '', model = '', confidence = '') {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  
  if (role === 'user') {
    div.innerHTML = `<div class="content">${text}</div>`;
  } else {
    div.innerHTML = `
      ${model ? `<div class="meta">Model: ${model}</div>` : ''}
      ${emoji ? `<div class="emoji">${emoji}</div>` : ''}
      <div class="content">${text}</div>
      ${confidence ? `<div class="confidence">${confidence}% confidence</div>` : ''}
    `;
  }
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderTape(elementId, tape, pointer) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  
  const displayTape = tape.slice(0, 20); // Show first 20 cells
  displayTape.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = `cell ${i === pointer ? 'active' : ''}`;
    cell.textContent = val;
    container.appendChild(cell);
  });
}

