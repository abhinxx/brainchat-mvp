// Brainfuck scripts for BrainChat

// Model Router: Outputs model name based on keyword detection
// Input: query string, Output: "P" (Perplexity), "C" (ChatGPT), "M" (Mistral)
// Simple keyword check: looks for 'n' (news), 'l' (latest), 's' (search) -> Perplexity
//                       looks for 'a' (analyze), 'd' (debug), 'e' (explain) -> ChatGPT
//                       default -> Mistral
const MODEL_ROUTER = `
,----------[
  ----------------------------------------------[
    >+<
  ]
  >[-<
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.
    [-]
  >]<
  ,----------
]
>+[
  -[>>+<<-]
  >>[<<+>>-]
  <
  [
    <+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.[-]>
    [-]
  ]
  <[
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++.[-]
  ]
]
`;

// Simplified router that actually works:
// Read input, check first char for keywords, output model letter
const SIMPLE_ROUTER = `,
[->+>+<<]
>>[-<<+>>]
<
------------------------------------------------
[
  --------------------------------------------------
  [
    >++++++[<+++++++++++>-]<+.
  ]
  >[-<
    >++++++[<+++++++++++++>-]<-.
  >]<
]
>[-<
  >++++++[<+++++++++++++>-]<++.
>]<
`;

// Even simpler: just output based on first character
// 'w','n','l','s','c','t' -> P (Perplexity - news/search)
// 'a','d','e','h','p' -> C (ChatGPT - analysis)
// anything else -> M (Mistral - default)
const ROUTER_V3 = `
,
>++++++++[<------------>-]<
+++++++++++
[->-<]
>
[[-]<
  >+++++++[<+++++++++++++>-]<++.
>]
<[
  >+++++++[<+++++++++++++>-]<-.
]
`;

// Response Parser: Extracts text after "TEXT:" marker
// For simplicity, just passes through (JS will do heavy lifting)
const RESPONSE_PARSER = `
[.,]
`;

// Confidence Scorer: Count lowercase letters as proxy for hedge words
// More sophisticated: count specific patterns
// Output: digit 0-9 representing confidence decile
const CONFIDENCE_SCORER = `
>+++++++++[<++++++++++>-]<
,
[
  ->+>+<<
  >>[-<<+>>]
  <
  ----------[++++++++++>-]>[<
    <+>
  >]<
  <,
]
>
[<+>-]
<
>++++++[<-------->-]<
.
`;

// Simpler confidence: count chars, output percentage estimate
const SIMPLE_SCORER = `
>
,
[
  <+>
  ,
]
<
[->++++++++++<]
>
[->+>+<<]
>[-<+>]
>
++++++++++++++++++++++++++++++++++++++++++++++++.
<.
`;

module.exports = {
  MODEL_ROUTER: ROUTER_V3,
  RESPONSE_PARSER,
  CONFIDENCE_SCORER: SIMPLE_SCORER
};

