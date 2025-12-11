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
  'auto': null,
  'perplexity': { id: 'perplexity/sonar-pro', name: 'Perplexity' },
  'chatgpt': { id: 'openai/gpt-4o-mini', name: 'ChatGPT' },
  'mistral': { id: 'mistralai/mistral-medium-3.1', name: 'Mistral' }
};

const SYSTEM_PROMPT = `You are a critical thinking assistant. Be precise and analytical.
When uncertain, explicitly state your confidence level.
Use phrases like "I believe", "It's likely", "I'm uncertain" when appropriate.
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

    // === BF MODEL ROUTER ===
    if (selectedModel === 'auto') {
      const words = query.toLowerCase().split(/\s+/);
      let routerOutput = '';
      let allScans = [];

      for (const word of words) {
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

      if (!routerOutput) routerOutput = 'M';
      
      const modelMap = { 'P': 'perplexity', 'C': 'chatgpt', 'M': 'mistral' };
      const selected = MODELS[modelMap[routerOutput] || 'mistral'];
      modelId = selected.id;
      modelName = selected.name;
      
      routerResult = { scans: allScans, output: routerOutput, matchedKeyword };
    } else {
      const selected = MODELS[selectedModel] || MODELS['mistral'];
      modelId = selected.id;
      modelName = selected.name;
    }

    // === CALL OPENROUTER WITH STREAMING ===
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
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query }
        ]
      })
    });

    if (!llmRes.ok) {
      const errorText = await llmRes.text();
      return res.status(500).json({ 
        error: `API error: ${errorText.slice(0, 200)}`,
        bf: { router: routerResult }  // Include BF analysis even on API error
      });
    }

    // === STREAMING: Measure REAL Time To First Token ===
    const reader = llmRes.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let timeToFirstToken = null;
    let usage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            // Capture TTFT when first content arrives
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta && timeToFirstToken === null) {
              timeToFirstToken = Date.now() - startTime;
            }
            if (delta) {
              fullContent += delta;
            }

            // Capture usage from final chunk
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
            // Skip invalid JSON chunks
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;

    // === BF TOKEN COUNTER ===
    const tokenResult = runBF(TOKEN_COUNTER_CODE, fullContent.slice(0, 200));
    
    // === BF COST CALCULATOR ===
    const costInput = String(usage?.total_tokens || 0).slice(0, 10);
    const costResult = runBF(COST_CALC_CODE, costInput);

    // === BF CONFIDENCE SCORER ===
    const scorerResult = runBF(SCORER_CODE, fullContent.slice(0, 100));
    
    // Calculate confidence from hedge words
    const hedgeWords = ['believe', 'likely', 'uncertain', 'perhaps', 'maybe', 'possibly', 'might', 'could', 'probably', 'seems'];
    const hedgeCount = hedgeWords.filter(w => fullContent.toLowerCase().includes(w)).length;
    const confidence = Math.max(10, 100 - hedgeCount * 12);

    // === CALCULATE REAL METRICS ===
    const completionTokens = usage?.completion_tokens || 0;
    const tokensPerSecond = totalTime > 0 ? (completionTokens / (totalTime / 1000)).toFixed(1) : 0;
    
    // Use REAL cost from OpenRouter if available, otherwise estimate
    const realCost = usage?.total_cost || usage?.cost;
    const estimatedCost = realCost 
      ? `$${realCost.toFixed(6)}` 
      : `~$${((usage?.total_tokens || 0) * 0.000002).toFixed(6)}`;

    return res.status(200).json({
      response: fullContent,
      model: modelName,
      modelId,
      stats: {
        timeToFirstToken: timeToFirstToken || totalTime,
        totalTime,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: completionTokens,
        totalTokens: usage?.total_tokens || 0,
        tokensPerSecond: parseFloat(tokensPerSecond),
        cost: estimatedCost,
        realCost: realCost || null
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
