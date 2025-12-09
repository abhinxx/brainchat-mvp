MODEL ROUTER
Input: First char of query  
Output: P(80) C(67) M(77)

w(119) h(104) y(121) a(97) s(115)h -> C (reasoning)
n(110) l(108) t(116) c(99) -> P (search)
else -> M (default)

,  read first char

Check for w (119) -> probably why/what reasoning -> C
--------------------------------------------------- subtract 119
[  if not zero check next
  +++++++++++++  add back 9 to get 110 (n)
  [  if not n
    --  subtract 2 to get 108 (l for latest)
    [  if not l
      --------  subtract 8 to get 100 close to s and a
      +++++++++++++++  add 15 to get 115 (s)
      [  if not s
        ------------------  subtract 18 to get 97 (a)
        [  if not a -> default M
          [-]  clear
          >++++++++++[<++++++++>-]<---  M = 77
          .[-]
        ]
        >[-<  was a -> C
          >++++++++[<++++++++>-]<+++  C = 67
          .[-]
        >]<
      ]
      >[-<  was s -> check if should (reasoning) -> C
        >++++++++[<++++++++>-]<+++  C = 67
        .[-]
      >]<
    ]
    >[-<  was l (latest) -> P
      >++++++++++[<++++++++>-]<  P = 80
      .[-]
    >]<
  ]
  >[-<  was n (news) -> P
    >++++++++++[<++++++++>-]<  P = 80
    .[-]
  >]<
]
>[-<  was w (why/what) -> C
  >++++++++[<++++++++>-]<+++  C = 67
  .[-]
>]<
