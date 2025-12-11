BRAINFUCK COST CALCULATOR
=========================
Input: Token count as string (digits)
Output: Cost tier indicator

Tiers:
0-99 tokens: $ (cheap)
100-999 tokens: $$ (moderate)  
1000+ tokens: $$$ (expensive)

Memory: [0] first digit [1] result

Read first digit
,

Subtract 48 to get numeric value
------------------------------------------------

Check if >= 1 (100+ tokens = $$ or $$$)
[->+>+<<]>>[-<<+>>]<
-
[[-]>+<]
>[<
  Check if >= 2 (200+ tokens)
  <[->+>+<<]>>[-<<+>>]<
  --
  [[-]>+<]
  >[<
    High cost $$$
    ++++++[<++++++>-]<.
    ++++++[<++++++>-]<.
    ++++++[<++++++>-]<.
  >-]<
  [[-]
    Medium cost $$
    ++++++[<++++++>-]<.
    ++++++[<++++++>-]<.
  ]
>-]<

[[-]
  Low cost $
  ++++++[<++++++>-]<.
]

