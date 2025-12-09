// Brainfuck interpreter with state capture for visualization
function runBF(code, input = '') {
  const tape = new Array(30000).fill(0);
  let pointer = 0;
  let inputPtr = 0;
  let output = '';
  let codePtr = 0;
  
  // Find matching brackets
  const brackets = {};
  const stack = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '[') stack.push(i);
    if (code[i] === ']') {
      const j = stack.pop();
      brackets[j] = i;
      brackets[i] = j;
    }
  }
  
  // Execute
  const maxSteps = 100000;
  let steps = 0;
  
  while (codePtr < code.length && steps < maxSteps) {
    const cmd = code[codePtr];
    
    switch (cmd) {
      case '>': pointer++; break;
      case '<': pointer--; break;
      case '+': tape[pointer] = (tape[pointer] + 1) % 256; break;
      case '-': tape[pointer] = (tape[pointer] - 1 + 256) % 256; break;
      case '.': output += String.fromCharCode(tape[pointer]); break;
      case ',': tape[pointer] = inputPtr < input.length ? input.charCodeAt(inputPtr++) : 0; break;
      case '[': if (tape[pointer] === 0) codePtr = brackets[codePtr]; break;
      case ']': if (tape[pointer] !== 0) codePtr = brackets[codePtr]; break;
    }
    
    codePtr++;
    steps++;
  }
  
  return {
    output,
    tape: tape.slice(0, 30), // Return first 30 cells for visualization
    pointer: Math.min(pointer, 29),
    steps
  };
}

module.exports = { runBF };

