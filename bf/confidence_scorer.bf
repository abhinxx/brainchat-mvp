Confidence Scorer - Counts characters and outputs confidence digit
Fewer hedge words = higher confidence
Input: text string
Output: single digit 0-9 representing confidence

Count input length into cell 0
>
,
[<+>,]
<

Divide by 10 to get rough score (inverted - longer = more hedgy = lower confidence)
[->++++++++++<]

Subtract from 9 to invert (high count = low confidence)
>[-<->]<
>+++++++++<
[->-<]
>

Add 48 to convert to ASCII digit
++++++[<++++++++>-]<

Output the digit
.

