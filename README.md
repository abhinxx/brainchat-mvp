# 🧠 BrainChat

**1:1 Chat Application with Brainfuck-powered Business Logic**

Live: https://brainchat-two.vercel.app/

## Prerequisites
- OpenRouter API key ([Get one here](https://openrouter.ai/settings/keys))

---

## Brainfuck Capabilities

This project uses **Brainfuck (BF)** for core business logic. Four BF programs handle real functionality:

### 1. Model Router (`bf/model_router.bf`)
Intelligent LLM selection based on query keywords.

| Input | Detection | Output |
|-------|-----------|--------|
| `news`, `latest`, `search` | First 3 chars pattern match | `P` → Perplexity |
| `should`, `why`, `how`, `analyze` | First 3 chars pattern match | `C` → ChatGPT |
| Everything else | Default | `M` → Mistral |

### 2. Confidence Scorer (`bf/confidence_scorer.bf`)
Analyzes LLM response uncertainty.

- Scans for `?` marks and hedge word patterns (`b`elieve, `l`ikely, `u`ncertain, `m`aybe)
- Starts at confidence 9, decrements per uncertainty marker
- Output: Single digit `0-9`

### 3. Token Counter (`bf/token_counter.bf`)
Estimates token count from response text.

- Counts spaces as word/token boundaries
- Outputs count as digits

### 4. Cost Calculator (`bf/cost_calculator.bf`)
Categorizes API cost tier.

| Tokens | Output |
|--------|--------|
| 0-99 | `$` |
| 100-999 | `$$` |
| 1000+ | `$$$` |

### Usage in Code (`api/chat.js`)

```javascript
// BF Router - scans each query word
const result = runBF(ROUTER_CODE, wordInput);

// BF Scorer - analyzes response text
const scorerResult = runBF(SCORER_CODE, response.slice(0, 100));

// BF Token Counter
const tokenResult = runBF(TOKEN_COUNTER_CODE, response.slice(0, 200));

// BF Cost Calculator
const costResult = runBF(COST_CALC_CODE, tokenCountString);
```

---

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS + TailwindCSS CDN
- **Backend:** Vercel Serverless Functions
- **LLM:** OpenRouter API (Perplexity, ChatGPT, Mistral)
- **Logic:** Brainfuck interpreter

## EWOR Technical Case Study
Demonstrates creative problem-solving by using an esoteric language (Brainfuck) for meaningful business logic in a real application.
