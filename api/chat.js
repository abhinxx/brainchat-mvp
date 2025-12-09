const brainfuck = require('brainfuck-interpreter');
const fs = require('fs');
const path = require('path');

// Load .bf files
const BF_DIR = path.join(__dirname, '..', 'bf');
const MODEL_ROUTER_BF = fs.readFileSync(path.join(BF_DIR, 'model_router.bf'), 'utf8');
const RESPONSE_PARSER_BF = fs.readFileSync(path.join(BF_DIR, 'response_parser.bf'), 'utf8');
const CONFIDENCE_SCORER_BF = fs.readFileSync(path.join(BF_DIR, 'confidence_scorer.bf'), 'utf8');

// Extract BF code only
function extractBF(source) {
  return source.replace(/[^><+\-.,\[\]]/g, '');
}

const ROUTER_CODE = extractBF(MODEL_ROUTER_BF);
const PARSER_CODE = extractBF(RESPONSE_PARSER_BF);
const SCORER_CODE = extractBF(CONFIDENCE_SCORER_BF);

// Model mapping
const MODELS = {
  'P': 'perplexity/sonar-pro',
  'C': 'openai/gpt-4o',
  'M': 'mistralai/mistral-large-latest'
};

const MODEL_NAMES = {
  'P': 'Perplexity',
  'C': 'ChatGPT', 
  'M': 'Mistral'
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, apiKey } = req.body;
  if (!query) return res.status(400).json({ error: 'No query' });
  if (!apiKey) return res.status(400).json({ error: 'No API key' });

  try {
    // Extract first word, first 3 chars for BF router
    const firstWord = query.toLowerCase().split(/\s+/)[0] || '';
    const chars3 = (firstWord + '   ').slice(0, 3); // pad to 3 chars
    
    // Run BF Router
    let routerOutput = 'M';
    try {
      routerOutput = brainfuck.execute(ROUTER_CODE, chars3) || 'M';
    } catch (e) {
      routerOutput = 'M';
    }
    
    const modelKey = routerOutput.replace(/[^PCM]/g, '').charAt(0) || 'M';
    const model = MODELS[modelKey] || MODELS['M'];
    const modelName = MODEL_NAMES[modelKey] || 'Mistral';

    // Call OpenRouter
    const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://brainchat.vercel.app',
        'X-Title': 'BrainChat'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Respond in TWO parts:\n1. EMOJI: Answer in emoji only\n2. TEXT: Same answer in plain text\n\nFormat:\nEMOJI: [emojis]\nTEXT: [text]'
          },
          { role: 'user', content: query }
        ]
      })
    });

    const llmData = await llmRes.json();
    if (llmData.error) return res.status(500).json({ error: llmData.error.message });

    const raw = llmData.choices?.[0]?.message?.content || '';

    // Run BF Parser
    let parserOutput = '';
    try {
      parserOutput = brainfuck.execute(PARSER_CODE, raw.slice(0, 50)) || '';
    } catch (e) {}

    // Extract emoji/text
    let emoji = '', text = raw;
    const em = raw.match(/EMOJI:\s*(.+)/i);
    const tx = raw.match(/TEXT:\s*(.+)/is);
    if (em) emoji = em[1].trim();
    if (tx) text = tx[1].trim();

    // Run BF Scorer
    let scorerOutput = '';
    try {
      scorerOutput = brainfuck.execute(SCORER_CODE, text.slice(0, 50)) || '';
    } catch (e) {}

    // Calculate confidence
    const hedges = ['might', 'could', 'possibly', 'maybe', 'perhaps', 'generally', 'usually', 'typically', 'likely', 'probably'];
    const hedgeCount = hedges.filter(w => text.toLowerCase().includes(w)).length;
    const confidence = Math.max(0, 100 - hedgeCount * 15);

    return res.status(200).json({
      model: modelName,
      emoji,
      text,
      confidence,
      bf: {
        router: { code: ROUTER_CODE, input: chars3, output: routerOutput },
        parser: { code: PARSER_CODE, output: parserOutput },
        scorer: { code: SCORER_CODE, output: scorerOutput }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
