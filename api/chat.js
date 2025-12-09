const { runBF } = require('../lib/bf-interpreter');
const { MODEL_ROUTER, RESPONSE_PARSER, CONFIDENCE_SCORER } = require('../lib/bf-scripts');

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

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'No query provided' });
  }

  try {
    // Step 1: Run BF Router to select model
    const routerResult = runBF(MODEL_ROUTER, query.toLowerCase());
    const modelKey = routerResult.output.trim() || 'M';
    const model = MODELS[modelKey] || MODELS['M'];
    const modelName = MODEL_NAMES[modelKey] || 'Mistral';

    // Step 2: Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

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

    // Step 3: Parse response (JS for reliability, BF for show)
    const parserResult = runBF(RESPONSE_PARSER, rawResponse.slice(0, 50));
    
    // Extract emoji and text with JS
    let emoji = '';
    let text = rawResponse;
    
    const emojiMatch = rawResponse.match(/EMOJI:\s*(.+)/i);
    const textMatch = rawResponse.match(/TEXT:\s*(.+)/is);
    
    if (emojiMatch) emoji = emojiMatch[1].trim();
    if (textMatch) text = textMatch[1].trim();

    // Step 4: Run BF Confidence Scorer
    const scorerResult = runBF(CONFIDENCE_SCORER, text.slice(0, 100));
    
    // Calculate confidence (JS backup)
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
          tape: routerResult.tape,
          pointer: routerResult.pointer,
          output: routerResult.output
        },
        parser: {
          tape: parserResult.tape,
          pointer: parserResult.pointer,
          output: parserResult.output
        },
        scorer: {
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

