const brainfuck = require('brainfuck-interpreter');
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

// Run BF and capture output
function runBF(code, input) {
  let output = '';
  const tape = new Array(30000).fill(0);
  let pointer = 0;
  
  try {
    // Use npm brainfuck-interpreter
    output = brainfuck.execute(code, input);
  } catch (e) {
    output = 'M'; // Default on error
  }
  
  return {
    output: output || 'M',
    tape: tape.slice(0, 20),
    pointer: 0,
    code: code.slice(0, 60)
  };
}

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
    // Step 1: Run BF Router - pass first char of query
    const firstChar = query.toLowerCase().charAt(0);
    const routerResult = runBF(ROUTER_CODE, firstChar);
    const modelKey = (routerResult.output || 'M').trim().charAt(0) || 'M';
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
1. EMOJI: Your answer using only emoji
2. TEXT: The same answer in plain text

Format:
EMOJI: [emojis]
TEXT: [text]`
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
    const parserResult = runBF(PARSER_CODE, rawResponse.slice(0, 50));
    
    // Extract emoji and text
    let emoji = '';
    let text = rawResponse;
    
    const emojiMatch = rawResponse.match(/EMOJI:\s*(.+)/i);
    const textMatch = rawResponse.match(/TEXT:\s*(.+)/is);
    
    if (emojiMatch) emoji = emojiMatch[1].trim();
    if (textMatch) text = textMatch[1].trim();

    // Step 4: Run BF Confidence Scorer
    const scorerResult = runBF(SCORER_CODE, text.slice(0, 50));
    
    // Calculate confidence from hedge words
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
          code: ROUTER_CODE,
          input: firstChar,
          output: routerResult.output
        },
        parser: {
          code: PARSER_CODE,
          output: parserResult.output
        },
        scorer: {
          code: SCORER_CODE,
          output: scorerResult.output
        }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
