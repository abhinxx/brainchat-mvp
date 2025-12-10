const { runBF } = require('../lib/bf-interpreter');
const fs = require('fs');
const path = require('path');

// Load BF files
const BF_DIR = path.join(__dirname, '..', 'bf');

function extractBF(source) {
  return source.replace(/[^><+\-.,\[\]]/g, '');
}

let ROUTER_CODE = '', PARSER_CODE = '', SCORER_CODE = '';
let initError = null;

try {
  ROUTER_CODE = extractBF(fs.readFileSync(path.join(BF_DIR, 'model_router.bf'), 'utf8'));
  PARSER_CODE = extractBF(fs.readFileSync(path.join(BF_DIR, 'response_parser.bf'), 'utf8'));
  SCORER_CODE = extractBF(fs.readFileSync(path.join(BF_DIR, 'confidence_scorer.bf'), 'utf8'));
} catch (e) {
  initError = 'Failed to load BF files: ' + e.message;
}

const MODELS = {
  'P': 'perplexity/sonar-pro',
  'C': 'openai/gpt-4o-mini',
  'M': 'mistralai/mistral-large-latest'
};

const MODEL_NAMES = {
  'P': 'Perplexity',
  'C': 'ChatGPT', 
  'M': 'Mistral'
};

module.exports = async function handler(req, res) {
  if (initError) {
    return res.status(500).json({ error: initError });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, apiKey } = req.body || {};
  if (!query) return res.status(400).json({ error: 'No query' });
  if (!apiKey) return res.status(400).json({ error: 'No API key' });

  try {
    // BF Router - scan each word
    const words = query.toLowerCase().split(/\s+/);
    let matchedWord = null;
    let modelKey = 'M';
    let routerOutput = '';
    let allScans = [];

    for (const word of words) {
      const wordChars = (word + '     ').slice(0, 5);
      const result = runBF(ROUTER_CODE, wordChars);
      const output = result.output || 'M';
      allScans.push({ word, output: output.trim() });
      
      if (output.includes('C') && !matchedWord) {
        matchedWord = word;
        modelKey = 'C';
        routerOutput = output;
      } else if (output.includes('P') && !matchedWord) {
        matchedWord = word;
        modelKey = 'P';
        routerOutput = output;
      }
    }

    if (!routerOutput) routerOutput = 'M';
    const model = MODELS[modelKey] || MODELS['M'];
    const modelName = MODEL_NAMES[modelKey] || 'Mistral';

    // Call OpenRouter API
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

    const responseText = await llmRes.text();
    
    let llmData;
    try {
      llmData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ 
        error: 'API error',
        status: llmRes.status,
        response: responseText.slice(0, 200)
      });
    }

    if (llmData.error) {
      return res.status(500).json({ error: llmData.error.message || JSON.stringify(llmData.error) });
    }

    const raw = llmData.choices?.[0]?.message?.content || '';

    // BF Parser
    const parserResult = runBF(PARSER_CODE, raw.slice(0, 50));

    // Extract emoji/text
    let emoji = '', text = raw;
    const em = raw.match(/EMOJI:\s*(.+)/i);
    const tx = raw.match(/TEXT:\s*(.+)/is);
    if (em) emoji = em[1].trim();
    if (tx) text = tx[1].trim();

    // BF Scorer
    const scorerResult = runBF(SCORER_CODE, text.slice(0, 50));

    // Confidence
    const hedges = ['might', 'could', 'possibly', 'maybe', 'perhaps', 'generally', 'usually', 'typically', 'likely', 'probably'];
    const hedgeCount = hedges.filter(w => text.toLowerCase().includes(w)).length;
    const confidence = Math.max(0, 100 - hedgeCount * 15);

    return res.status(200).json({
      model: modelName,
      emoji,
      text,
      confidence,
      matchedWord,
      bf: {
        router: { 
          code: ROUTER_CODE.slice(0, 100), 
          scans: allScans, 
          output: routerOutput,
          tape: allScans[0]?.tape
        },
        parser: { code: PARSER_CODE.slice(0, 100), output: parserResult.output },
        scorer: { code: SCORER_CODE.slice(0, 100), output: scorerResult.output }
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
