Model Router - Selects LLM based on first character of query
Input: query string
Output: P (Perplexity for news/search) C (ChatGPT for analysis) M (Mistral default)

Check for n/l/s/w/c/t -> Perplexity (news latest search what current today)
Check for a/d/e/h/p -> ChatGPT (analyze debug explain how plan)  
Default -> Mistral

Read first char into cell 0
,

Store copy in cell 1
[->+>+<<]>>[-<<+>>]<

Subtract 110 (ASCII n) to check for n
>+++++++[<--------------->-]<

If zero output P (80)
[[-]>]<[>++++++++++[<++++++++>-]<.[-]<]

Reset and check for w (119)
>[-]<[-]
,
[->+>+<<]>>[-<<+>>]<
>++++++++[<--------------->-]<
[[-]>]<[>++++++++++[<++++++++>-]<.[-]<]

Default to M (77) if nothing matched
>[-]+[>++++++++++[<++++++++>-]<-.[-]<[-]]

