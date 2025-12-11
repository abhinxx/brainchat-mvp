BRAINFUCK TOKEN COUNTER
=======================
Input: Text string
Output: Approximate token count (spaces = word boundaries)

Counts spaces as token separators
Outputs count as digits

Memory: [0] char [1] space flag [2] count [3+] temp

Initialize count to 1 (first word)
>>+<<

Read chars
,
[
  Check if space (32)
  [->+>+<<]>>[-<<+>>]<
  >[-]<[->+<]>
  --------------------------------
  [[-]>+<]
  >[<
    Found space - increment count
    >>+<<
  >-]<
  
  Read next
  <[-],
]

Output count as digit (mod 10 for single digit display)
>>

Divide by 10 to get tens digit
[->+>+<<]>>[-<<+>>]<
[----------[->+<]>[-<+>]<]

Output ones digit
>[-]<
[->+<]>
++++++[<++++++++>-]<
.

