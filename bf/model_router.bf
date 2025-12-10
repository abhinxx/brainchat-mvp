BRAINFUCK MODEL ROUTER v2
=========================
Full word pattern matching
Input: 5 characters of a word
Output: P (Perplexity) C (ChatGPT) M (Mistral)

REASONING WORDS (output C=67):
shoul (115 104 111 117 108) = 555
why__ (119 104 121 32 32) = 408  
how__ (104 111 119 32 32) = 398
analy (97 110 97 108 121) = 533
expla (101 120 112 108 97) = 538
compa (99 111 109 112 97) = 528
think (116 104 105 110 107) = 542
reaso (114 101 97 115 111) = 538
advis (97 100 118 105 115) = 535
recom (114 101 99 111 109) = 534
decid (100 101 99 105 100) = 505
bette (98 101 116 116 101) = 532

SEARCH WORDS (output P=80):
news_ (110 101 119 115 32) = 477
lates (108 97 116 101 115) = 537
curre (99 117 114 114 101) = 545
today (116 111 100 97 121) = 545
recen (114 101 99 101 110) = 525
updat (117 112 100 97 116) = 542
trend (116 114 101 110 100) = 541
searc (115 101 97 114 99) = 526

Memory layout:
[0-4] = 5 input characters
[5] = sum accumulator
[6] = result flag
[7+] = temp working space

=============== READ 5 CHARACTERS ===============
,>,>,>,>,

=============== COMPUTE SUM INTO CELL 5 ===============
Move all values to cell 5
<<<<< go to cell 0
[->>>>+>+<<<<<] copy cell0 to cell4 and cell5
>>>>[-<<<<+>>>>]<<<< restore cell0

> go to cell 1
[->>>+>+<<<<] copy cell1 to cell4 and cell5
>>>[-<<<+>>>]<<<

> go to cell 2
[->>+>+<<<] copy cell2 to cell4 and cell5
>>[-<<+>>]<<

> go to cell 3
[->+>+<<] copy cell3 to cell4 and cell5
>[-<+>]<

> go to cell 4
[->+<] add cell4 to cell5
>

Cell 5 now has sum of all 5 chars

=============== CHECK REASONING PATTERNS ===============
Sum ranges for reasoning words: 398-555
Subtract 390 first
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

If result is 0-170 we might have a match
Check if in range by subtracting 170
Copy to temp first
[->+>+<<]>>[-<<+>>]<
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

If positive (>170) not a reasoning word
[>+<[-]]
>[<
  Not in range check search patterns
  >>+<<
>[-]]<

If in range (0-170) could be reasoning
[[-]
  Now narrow down
  Check if sum-390 is in 0-20 range (how/why patterns sum 398-410)
  Restore and check
  <[->+<]>
  --------------------
  [>+<[-]]>[<
    Reasoning word with higher sum output C
    >>>>[-]++++++++[<++++++++>-]<+++.[-]<<<<
  >[-]]<
  [[-]
    Lower sum reasoning word output C
    >>>>[-]++++++++[<++++++++>-]<+++.[-]<<<<
  ]
]

=============== CHECK SEARCH PATTERNS ===============
Check flag in cell 7 if we need to check search
>>
[[-]<<
  Search words sum range: 477-545
  Need to check original sum
  Restore from cell 5 area
  <<<<< go back to start
  
  For search patterns output P
  >>>>>
  >>[-]>++++++++++[<++++++++>-]<.[-]<
>>]<<

=============== DEFAULT OUTPUT M ===============
Check if anything was output if not output M
>>>>>>>>[-]+<<<<<<<<
[>>>>>>>>-<<<<<<<<[-]]
>>>>>>>>
[[-]
  ++++++++[<++++++++++>-]<---.[-]
]

=============== END ===============
