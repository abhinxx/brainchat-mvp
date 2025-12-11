const { runBF } = require('../lib/bf-interpreter');
const fs = require('fs');
const path = require('path');

// Load BF files
const BF_DIR = path.join(__dirname, '..', 'bf');

function loadBF(filename) {
  try {
    const source = fs.readFileSync(path.join(BF_DIR, filename), 'utf8');
    return source.replace(/[^><+\-.,\[\]]/g, '');
  } catch (e) {
    return '';
  }
}

const ROUTER_CODE = loadBF('model_router.bf');
const SCORER_CODE = loadBF('confidence_scorer.bf');
const TOKEN_COUNTER_CODE = loadBF('token_counter.bf');
const COST_CALC_CODE = loadBF('cost_calculator.bf');

const MODELS = {
  'auto': null, // BF decides
  'perplexity': { id: 'perplexity/sonar-pro', name: 'Perplexity' },
  'chatgpt': { id: 'openai/gpt-4o-mini', name: 'ChatGPT' },
  'mistral': { id: 'mistralai/mistral-large-latest', name: 'Mistral' }
};

// Critical thinking system prompt
const SYSTEM_PROMPT = `You are a critical thinking assistant. Be precise and analytical.
When uncertain, explicitly state your confidence level.
Use phrases like "I believe", "It's likely", "I'm uncertain" when appropriate.
Provide balanced perspectives when topics are debatable.
Be concise but thorough.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, apiKey, selectedModel = 'auto' } = req.body || {};
  if (!query) return res.status(400).json({ error: 'No query' });
  if (!apiKey) return res.status(400).json({ error: 'No API key' });

  const startTime = Date.now();

  try {
    let modelId, modelName, routerResult = null, matchedKeyword = null;

    if (selectedModel === 'auto') {
      // BF Router decides - scan each word
      const words = query.toLowerCase().split(/\s+/);
      let routerOutput = '';
      let allScans = [];

      for (const word of words) {
        // Pass first 6 chars of each word to BF
        const input = (word + '      ').slice(0, 6);
        const result = runBF(ROUTER_CODE, input);
        allScans.push({ word, output: result.output, steps: result.steps });
        
        if (result.output.includes('P') && !matchedKeyword) {
          matchedKeyword = word;
          routerOutput = 'P';
        } else if (result.output.includes('C') && !matchedKeyword) {
          matchedKeyword = word;
          routerOutput = 'C';
        }
      }

      // Default to Mistral if no match
      if (!routerOutput) routerOutput = 'M';
      
      const modelMap = { 'P': 'perplexity', 'C': 'chatgpt', 'M': 'mistral' };
      const selected = MODELS[modelMap[routerOutput] || 'mistral'];
      modelId = selected.id;
      modelName = selected.name;
      
      routerResult = { scans: allScans, output: routerOutput, matchedKeyword };
    } else {
      // Manual selection
      const selected = MODELS[selectedModel] || MODELS['mistral'];
      modelId = selected.id;
      modelName = selected.name;
    }

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
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query }
        ]
      })
    });

    const timeToFirstToken = Date.now() - startTime;
    const responseText = await llmRes.text();
    
    let llmData;
    try {
      llmData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ 
        error: 'API error',
        details: responseText.slice(0, 200)
      });
    }

    if (llmData.error) {
      return res.status(500).json({ error: llmData.error.message });
    }

    const response = llmData.choices?.[0]?.message?.content || '';
    const usage = llmData.usage || {};
    const totalTime = Date.now() - startTime;

    // BF Token Counter - count words in response
    const tokenResult = runBF(TOKEN_COUNTER_CODE, response.slice(0, 200));
    
    // BF Cost Calculator - estimate based on token count
    const costInput = String(usage.total_tokens || 0).slice(0, 10);
    const costResult = runBF(COST_CALC_CODE, costInput);

    // BF Confidence Scorer
    const scorerResult = runBF(SCORER_CODE, response.slice(0, 100));
    
    // Calculate confidence from hedge words + BF output
    const hedgeWords = ['believe', 'likely', 'uncertain', 'perhaps', 'maybe', 'possibly', 'might', 'could', 'probably', 'seems'];
    const hedgeCount = hedgeWords.filter(w => response.toLowerCase().includes(w)).length;
    const confidence = Math.max(10, 100 - hedgeCount * 12);

    return res.status(200).json({
      response,
      model: modelName,
      modelId,
      stats: {
        timeToFirstToken,
        totalTime,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        estimatedCost: (usage.total_tokens || 0) * 0.00001 // rough estimate
      },
      confidence,
      bf: {
        router: routerResult,
        tokenCounter: { output: tokenResult.output, steps: tokenResult.steps },
        costCalc: { output: costResult.output, steps: costResult.steps },
        scorer: { output: scorerResult.output, steps: scorerResult.steps }
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
