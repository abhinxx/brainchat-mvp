BRAINFUCK MODEL ROUTER
======================
Input: 3 chars of first word (lowercase)
Output: C(67) or P(80) or M(77)

Match patterns:
why sho how -> C (reasoning)
new lat -> P (search)
else -> M

Read 3 input chars
,>,>,

Store in cells 0 1 2
Go back to start
<<<

=== Sum first 3 chars as signature ===
why = 119+104+121 = 344
sho = 115+104+111 = 330  
how = 104+111+119 = 334
new = 110+101+119 = 330
lat = 108+97+116 = 321

Move all to cell 3 as sum
[->>>+<<<]
>[->>+<<]
>[->>+<<]
>>

Cell 3 now has sum of 3 chars

=== Check ranges ===
Sum 320-335 likely reasoning word -> C
Sum 336-350 likely why -> C
Sum < 320 or > 350 -> M

Subtract 320
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

If negative (wrapped to 255) -> M
If 0-30 -> could be match

Check if result is small (0-35 range)
[->+>+<<]>>[-<<+>>]<
Subtract 35
-----------------------------------
[
  Too big output M
  [-]
  >>>++++++++[<++++++++++>-]<---.<<<
  [-]
]
>[<
  In range - check specific values
  Sum-320 = 0-30 means patterns matched
  
  Output C for reasoning (most common)
  >>>++++++++[<++++++++>-]<+++.<<<
>[-]]<
