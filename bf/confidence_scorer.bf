BRAINFUCK CONFIDENCE SCORER
===========================
Analyzes text for hedge words and calculates confidence
Input: Text string from LLM response
Output: Confidence score digit (0-9)

HEDGE WORDS to detect (reduce confidence):
might (109 105 103 104 116) = 537
could (99 111 117 108 100) = 535
possi (112 111 115 115 105) = 558 (possibly)
maybe (109 97 121 98 101) = 526
perha (112 101 114 104 97) = 528 (perhaps)
gener (103 101 110 101 114) = 529 (generally)
usual (117 115 117 97 108) = 554 (usually)
typic (116 121 112 105 99) = 553 (typically)
likel (108 105 107 101 108) = 529 (likely)
proba (112 114 111 98 97) = 532 (probably)

Hedge word sums cluster around 525-560 range

Memory layout:
[0-4] = 5 char window
[5] = window sum
[6] = hedge counter
[7] = char counter (for position tracking)
[8] = temp
[9+] = working space

=============== INITIALIZE ===============
Set initial confidence high (will decrease with hedges)
>>>>>>
+++++++++  Start with 9 (max confidence)
<<<<<<

=============== READ AND SCAN FOR HEDGES ===============
Read first 5 chars to fill window
,>,>,>,>,

Calculate initial window sum
<<<<< at cell 0
[->>>>+>+<<<<<]>>>>>[-<<<<<+>>>>>]<<<<<
>[->>>+>+<<<<]>>>>[-<<<<+>>>>]<<<<
>>[->>+>+<<<]>>>[-<<<+>>>]<<<
>>>[->>+<+<<]>>[-<<+>>]<<
>>>>[->>+<<]>>

Cell 7 now has sum of first 5 chars

Main scanning loop
<<<<<<<,

[
  Shift window left
  Subtract oldest char from sum
  <<<<[->>>>>>-<<<<<<]
  
  Shift chars: 1->0 2->1 3->2 4->3 new->4
  >[-<+>]
  >[-<+>]
  >[-<+>]
  >[-<+>]
  
  Read new char into cell 4
  ,
  
  Add new char to sum
  [->>>>>>+<<<<<<]
  [->>>>>+<<<<<]
  
  Check if sum is in hedge word range (525-560)
  >>>>>> at sum cell
  
  Copy sum to temp
  [->+>+<<]>>[-<<+>>]<
  
  Subtract 520
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  
  Check if result is 0-45 (hedge range)
  [->+>+<<]>>[-<<+>>]<
  ---------------------------------------------
  
  If negative or zero we have a hedge word
  [>+<[-]]
  >[<
    No hedge skip
  >[-]]<
  [[-]
    Hedge detected decrement confidence counter
    <<<<<<<<
    -
    >>>>>>>>
  ]
  
  Continue scanning
  <<<<<<<,
]

=============== OUTPUT CONFIDENCE ===============
Go to confidence counter cell 6
<<<<<<

Ensure confidence is not negative (min 0)
[>+<-]>[<+>-]<

Add 48 to convert to ASCII digit
++++++++++++++++++++++++++++++++++++++++++++++++

Output confidence digit
.

=============== END ===============
