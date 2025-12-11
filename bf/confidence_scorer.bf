BRAINFUCK CONFIDENCE SCORER
===========================
Input: Response text (first 100 chars)
Output: Confidence digit 0-9

Scans for uncertainty markers:
- Question marks (?)
- Hedge words starting chars: b(believe) l(likely) u(uncertain) p(perhaps) m(maybe)

Higher uncertainty = lower confidence
Start at 9, subtract for each marker found

Memory: [0] current char [1] counter [2] confidence=9 [3+] temp

Initialize confidence to 9
>>+++++++++<<

Read and scan loop
,
[
  Store char
  [->+>+<<]>>[-<<+>>]<
  
  Check for ? (63) - strong uncertainty
  >[-]<[->+<]>
  ---------------------------------------------------------------
  [[-]>+<]>[<
    Decrement confidence twice for ?
    >>--<<
  >-]<
  
  Check for b (98) - believe
  <[->+>+<<]>>[-<<+>>]<
  >[-]<[->+<]>
  ----------------------------------------------------------------------------------------------------------------------------------
  [[-]>+<]>[<>>-<<>-]<
  
  Check for m (109) - maybe might
  <[->+>+<<]>>[-<<+>>]<
  >[-]<[->+<]>
  -------------------------------------------------------------------------------------------------------------
  [[-]>+<]>[<>>-<<>-]<
  
  Check for u (117) - uncertain
  <[->+>+<<]>>[-<<+>>]<
  >[-]<[->+<]>
  ---------------------------------------------------------------------------------------------------------------------
  [[-]>+<]>[<>>-<<>-]<
  
  Check for p (112) - perhaps probably possibly
  <[->+>+<<]>>[-<<+>>]<
  >[-]<[->+<]>
  ----------------------------------------------------------------------------------------------------------------
  [[-]>+<]>[<>>-<<>-]<
  
  Read next char
  <[-]
  ,
]

Ensure confidence is 0-9 (not negative)
>>
[->+>+<<]>>[-<<+>>]<
>[-]<
[->+<]>
[<+>[-]]
<

Add 48 to convert to ASCII digit
++++++[<++++++++>-]<

Output confidence
.
