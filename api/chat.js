const { runBF } = require('../lib/bf-interpreter');
const fs = require('fs');
const path = require('path');

// Load actual .bf files
const BF_DIR = path.join(__dirname, '..', 'bf');
const MODEL_ROUTER_BF = fs.readFileSync(path.join(BF_DIR, 'model_router.bf'), 'utf8');
const RESPONSE_PARSER_BF = fs.readFileSync(path.join(BF_DIR, 'response_parser.bf'), 'utf8');
const CONFIDENCE_SCORER_BF = fs.readFileSync(path.join(BF_DIR, 'confidence_scorer.bf'), 'utf8');

// Extract just the BF code (ignore comments)
function extractBFCode(source) {
  return source.replace(/[^><+\-.,\[\]]/g, '');
}

const ROUTER_CODE = extractBFCode(MODEL_ROUTER_BF);
const PARSER_CODE = extractBFCode(RESPONSE_PARSER_BF);
const SCORER_CODE = extractBFCode(CONFIDENCE_SCORER_BF);

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
  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }
  if (!apiKey) {
    return res.status(400).json({ error: 'No API key provided' });
  }

  try {
    // Step 1: Run BF Router to select model
    const routerResult = runBF(ROUTER_CODE, query.toLowerCase());
    const modelKey = routerResult.output.trim().charAt(0) || 'M';
    const model = MODELS[modelKey] || MODELS['M'];
    const modelName = MODEL_NAMES[modelKey] || 'Mistral';

    // Step 2: Call OpenRouter API
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            content: `Respond in TWO parts:
1. EMOJI: Your answer using only emoji (semantic representation)
2. TEXT: The same answer in plain text

Format exactly like this:
EMOJI: [emoji sequence]
TEXT: [plain text answer]`
          },
          { role: 'user', content: query }
        ]
      })
    });

    const llmData = await llmResponse.json();
    
    if (llmData.error) {
      return res.status(500).json({ error: llmData.error.message });
    }

    const rawResponse = llmData.choices?.[0]?.message?.content || '';

    // Step 3: Run BF Parser
    const parserResult = runBF(PARSER_CODE, rawResponse.slice(0, 100));
    
    // Extract emoji and text with JS (BF does the work, JS ensures reliability)
    let emoji = '';
    let text = rawResponse;
    
    const emojiMatch = rawResponse.match(/EMOJI:\s*(.+)/i);
    const textMatch = rawResponse.match(/TEXT:\s*(.+)/is);
    
    if (emojiMatch) emoji = emojiMatch[1].trim();
    if (textMatch) text = textMatch[1].trim();

    // Step 4: Run BF Confidence Scorer
    const scorerResult = runBF(SCORER_CODE, text.slice(0, 100));
    
    // Calculate confidence (BF gives rough score, JS refines)
    const hedgeWords = ['might', 'could', 'possibly', 'maybe', 'perhaps', 'generally', 'usually', 'typically', 'likely', 'probably'];
    const hedgeCount = hedgeWords.filter(w => text.toLowerCase().includes(w)).length;
    const confidence = Math.max(0, 100 - hedgeCount * 15);

    return res.status(200).json({
      model: modelName,
      emoji,
      text,
      confidence,
      bf: {
        router: {
          code: ROUTER_CODE.slice(0, 50) + '...',
          tape: routerResult.tape,
          pointer: routerResult.pointer,
          output: routerResult.output
        },
        parser: {
          code: PARSER_CODE,
          tape: parserResult.tape,
          pointer: parserResult.pointer,
          output: parserResult.output
        },
        scorer: {
          code: SCORER_CODE.slice(0, 50) + '...',
          tape: scorerResult.tape,
          pointer: scorerResult.pointer,
          output: scorerResult.output
        }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
