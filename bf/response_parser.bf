BRAINFUCK RESPONSE PARSER
=========================
Parses LLM response to extract EMOJI and TEXT sections
Input: Raw response string
Output: Parsed indicator

This parser scans for the TEXT: marker and outputs chars after it

Memory layout:
[0] = current input char
[1] = T detector (84)
[2] = E detector (69)
[3] = X detector (88)
[4] = T detector (84)
[5] = colon detector (58)
[6] = state flag (0=scanning 1=found TEXT:)
[7] = output buffer
[8+] = temp

=============== SCAN FOR TEXT: MARKER ===============
Read chars until we find T E X T :

Start scanning loop
,

Main parsing loop - read until end of input
[
  Check if current char is T (84)
  [->+>+<<]>>[-<<+>>]<
  [-]++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  [->-<]>
  [[-]<+>]<
  
  If matched T read next and check E
  [
    [-],
    Check for E (69)
    [->+>+<<]>>[-<<+>>]<
    [-]+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    [->-<]>
    [[-]<+>]<
    
    If matched E read next and check X
    [
      [-],
      Check for X (88)
      [->+>+<<]>>[-<<+>>]<
      [-]+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
      [->-<]>
      [[-]<+>]<
      
      If matched X read next and check T
      [
        [-],
        Check for T (84)
        [->+>+<<]>>[-<<+>>]<
        [-]++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        [->-<]>
        [[-]<+>]<
        
        If matched T read next and check colon
        [
          [-],
          Check for colon (58)
          [->+>+<<]>>[-<<+>>]<
          [-]+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
          [->-<]>
          [[-]<+>]<
          
          If matched colon - found TEXT: marker!
          [
            Set found flag
            >>>>>>+<<<<<<
            Output success marker
            ++++++++++[>++++++++++<-]>++.[-]<
          ]
        ]
      ]
    ]
  ]
  
  Continue reading
  ,
]

=============== OUTPUT RESULT ===============
Check if we found the marker
>>>>>>
[[-]
  Found TEXT: marker output P for parsed
  >[-]++++++++++[<++++++++>-]<.[-]<
]
[
  Did not find marker output N for not found  
  >[-]++++++++++++[<++++++++>-]<--.[-]<
]

=============== END ===============
