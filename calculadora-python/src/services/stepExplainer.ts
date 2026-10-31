/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CalculationStep {
  stepNumber: number;
  description: string;
  subExpression: string;
  stepResult: string;
  explanation?: string;
  resultingExpression: string;
}

export interface StepExplanationResult {
  status: 'success' | 'empty' | 'incomplete' | 'invalid';
  message?: string;
  steps: CalculationStep[];
  finalResult?: string;
}

/**
 * Formats a number cleanly, removing floating point artifacts like 0.30000000000000004
 */
function formatNumber(num: number): string {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  const rounded = Math.round(num * 1e10) / 1e10;
  return rounded.toString();
}

/**
 * Explains scientific functions with a simple Portuguese description
 */
function getFunctionExplanation(
  funcName: string,
  argVal: number,
  resultVal: number,
  isDegreeMode: boolean,
  hasOtherOperations: boolean
): string {
  const argStr = formatNumber(argVal);
  const resStr = formatNumber(resultVal);
  const reason = hasOtherOperations ? ' (As funções são resolvidas antes das operações básicas)' : '';

  switch (funcName) {
    case 'sqrt':
    case 'math.sqrt': {
      if (argVal < 0) return 'Não existe raiz quadrada real de número negativo.';
      if (Number.isInteger(resultVal)) {
        return `Calculamos a raiz quadrada de ${argStr} e chegamos a ${resStr}, pois ${resStr} × ${resStr} = ${argStr}.${reason}`;
      }
      return `Calculamos a raiz quadrada de ${argStr} e chegamos a aproximadamente ${resStr}, pois ${resStr} × ${resStr} ≈ ${argStr}.${reason}`;
    }
    case 'sin':
    case 'math.sin': {
      const mode = isDegreeMode ? 'graus (DEG)' : 'radianos (RAD)';
      return `Calculamos o seno de ${argStr} em ${mode} e chegamos a ${resStr}.${reason}`;
    }
    case 'cos':
    case 'math.cos': {
      const mode = isDegreeMode ? 'graus (DEG)' : 'radianos (RAD)';
      return `Calculamos o cosseno de ${argStr} em ${mode} e chegamos a ${resStr}.${reason}`;
    }
    case 'tan':
    case 'math.tan': {
      const mode = isDegreeMode ? 'graus (DEG)' : 'radianos (RAD)';
      return `Calculamos a tangente de ${argStr} em ${mode} e chegamos a ${resStr}.${reason}`;
    }
    case 'log10':
    case 'math.log10': {
      if (argVal <= 0) return 'Logaritmo não é definido para números menores ou iguais a zero.';
      return `Calculamos o logaritmo na base 10 de ${argStr} e chegamos a ${resStr}, pois 10 elevado a ${resStr} é ${argStr}.${reason}`;
    }
    case 'log':
    case 'math.log': {
      if (argVal <= 0) return 'Logaritmo natural não é definido para números menores ou iguais a zero.';
      return `Calculamos o logaritmo natural (ln) de ${argStr} e chegamos a aproximadamente ${resStr} (com base de Euler e ≈ 2.718).${reason}`;
    }
    case 'factorial':
    case 'math.factorial': {
      if (argVal < 0 || !Number.isInteger(argVal)) return 'Fatorial só é definido para números inteiros não-negativos.';
      if (argVal === 0 || argVal === 1) return `Calculamos o fatorial de ${argStr}! e chegamos a 1 por definição.${reason}`;
      return `Calculamos o fatorial de ${argStr}! e chegamos a ${resStr}.${reason}`;
    }
    case 'abs': {
      return `Calculamos o valor absoluto (módulo) de ${argStr} e chegamos a ${resStr}.${reason}`;
    }
    default:
      return `Calculamos ${funcName} de ${argStr} e chegamos a ${resStr}.${reason}`;
  }
}

/**
 * Computes a single scientific function
 */
function evalSingleFunction(funcName: string, arg: number, isDegreeMode: boolean): number {
  switch (funcName) {
    case 'sqrt':
    case 'math.sqrt':
      if (arg < 0) throw new Error('Raiz quadrada de número negativo');
      return Math.sqrt(arg);
    case 'sin':
    case 'math.sin': {
      const rad = isDegreeMode ? (arg * Math.PI) / 180 : arg;
      const res = Math.sin(rad);
      return Math.abs(res) < 1e-15 ? 0 : res;
    }
    case 'cos':
    case 'math.cos': {
      const rad = isDegreeMode ? (arg * Math.PI) / 180 : arg;
      const res = Math.cos(rad);
      return Math.abs(res) < 1e-15 ? 0 : res;
    }
    case 'tan':
    case 'math.tan': {
      const rad = isDegreeMode ? (arg * Math.PI) / 180 : arg;
      const cosVal = Math.cos(rad);
      if (Math.abs(cosVal) < 1e-15) throw new Error('Tangente indefinida (divisão por zero)');
      const res = Math.tan(rad);
      return Math.abs(res) < 1e-15 ? 0 : res;
    }
    case 'log10':
    case 'math.log10':
      if (arg <= 0) throw new Error('Logaritmo de número não positivo');
      return Math.log10(arg);
    case 'log':
    case 'math.log':
      if (arg <= 0) throw new Error('Logaritmo de número não positivo');
      return Math.log(arg);
    case 'factorial':
    case 'math.factorial': {
      if (arg < 0 || !Number.isInteger(arg)) throw new Error('Fatorial de número inválido');
      if (arg > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= arg; i++) r *= i;
      return r;
    }
    case 'abs':
      return Math.abs(arg);
    default:
      throw new Error(`Função ${funcName} não suportada`);
  }
}

/**
 * Resolves a simple expression containing no parentheses and no functions,
 * strictly following:
 * 1. Potência (**)
 * 2. Multiplicação e Divisão (*, /, //, %)
 * 3. Soma e Subtração (+, -)
 */
function solveFlatExpression(
  expr: string,
  addStep: (description: string, subExpr: string, result: string, explanation?: string) => void,
  isInsideParentheses: boolean = false
): string {
  let current = expr.trim();

  // Helper to check if lower priority operators exist in the remaining expression
  const hasAddOrSub = (s: string) => /[0-9]\s*[+\-]\s*[0-9]/.test(s);
  const hasMulOrDiv = (s: string) => /[0-9]\s*(\*|\/|\/\/|%)\s*[0-9]/.test(s);

  // 1. Potências (**)
  const powRegex = /(-?\b\d+(?:\.\d+)?)\s*\*\*\s*(-?\d+(?:\.\d+)?)/;
  while (true) {
    const match = current.match(powRegex);
    if (!match) break;
    const [full, baseStr, expStr] = match;
    const base = parseFloat(baseStr);
    const exp = parseFloat(expStr);
    const res = Math.pow(base, exp);
    const resStr = formatNumber(res);

    let reason = '';
    if (isInsideParentheses) {
      reason = ' (Os parênteses e potências são resolvidos antes das operações externas)';
    } else if (hasMulOrDiv(current) || hasAddOrSub(current)) {
      reason = ' (A potência é resolvida antes da multiplicação, divisão e soma)';
    }

    addStep(
      `Potência: ${baseStr} elevado a ${expStr}`,
      `${baseStr} ** ${expStr}`,
      resStr,
      `Elevamos ${baseStr} à potência ${expStr} e chegamos a ${resStr}.${reason}`
    );
    current = current.replace(full, resStr);
  }

  // 2. Multiplicação, divisão, divisão inteira, módulo (*, /, //, %)
  const multDivRegex = /(-?\b\d+(?:\.\d+)?)\s*(\/\/|%|\*|\/)\s*(-?\d+(?:\.\d+)?)/;
  while (true) {
    const match = current.match(multDivRegex);
    if (!match) break;
    const [full, leftStr, op, rightStr] = match;
    const left = parseFloat(leftStr);
    const right = parseFloat(rightStr);

    let res = 0;
    let desc = '';
    let expl = '';

    const hasAddSubNow = hasAddOrSub(current);
    let reason = '';
    if (isInsideParentheses) {
      reason = ' (Os parênteses têm prioridade sobre as operações externas)';
    } else if (hasAddSubNow) {
      if (op === '*') {
        reason = ' (A multiplicação é resolvida antes da soma)';
      } else {
        reason = ' (A divisão é resolvida antes da soma)';
      }
    }

    if (op === '*') {
      res = left * right;
      desc = `Multiplicação: ${leftStr} × ${rightStr}`;
      expl = `Multiplicamos ${leftStr} por ${rightStr} e chegamos a ${formatNumber(res)}.${reason}`;
    } else if (op === '/') {
      if (right === 0) throw new Error('DIV_BY_ZERO');
      res = left / right;
      desc = `Divisão: ${leftStr} ÷ ${rightStr}`;
      expl = `Dividimos ${leftStr} por ${rightStr} e chegamos a ${formatNumber(res)}.${reason}`;
    } else if (op === '//') {
      if (right === 0) throw new Error('DIV_BY_ZERO');
      res = Math.floor(left / right);
      desc = `Divisão inteira: ${leftStr} // ${rightStr}`;
      expl = `Dividimos ${leftStr} por ${rightStr} de forma inteira e chegamos a ${formatNumber(res)} (desconsiderando a parte decimal).${reason}`;
    } else if (op === '%') {
      if (right === 0) throw new Error('DIV_BY_ZERO');
      res = left % right;
      desc = `Resto da divisão (módulo): ${leftStr} % ${rightStr}`;
      expl = `Calculamos o resto da divisão de ${leftStr} por ${rightStr} e encontramos ${formatNumber(res)}.${reason}`;
    }

    const resStr = formatNumber(res);
    addStep(desc, `${leftStr} ${op} ${rightStr}`, resStr, expl);
    current = current.replace(full, resStr);
  }

  // 3. Soma e Subtração (+, -)
  const addSubRegex = /(-?\b\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)/;
  while (true) {
    const match = current.match(addSubRegex);
    if (!match) break;
    const [full, leftStr, op, rightStr] = match;

    const left = parseFloat(leftStr);
    const right = parseFloat(rightStr);

    let res = 0;
    let desc = '';
    let expl = '';

    const parenReason = isInsideParentheses ? ' (Os parênteses são resolvidos antes das operações externas)' : '';

    if (op === '+') {
      res = left + right;
      desc = `Adição: ${leftStr} + ${rightStr}`;
      expl = `Somamos ${leftStr} e ${rightStr} e chegamos a ${formatNumber(res)}.${parenReason}`;
    } else {
      res = left - right;
      desc = `Subtração: ${leftStr} - ${rightStr}`;
      expl = `Subtraímos ${rightStr} de ${leftStr} e chegamos a ${formatNumber(res)}.${parenReason}`;
    }

    const resStr = formatNumber(res);
    addStep(desc, `${leftStr} ${op} ${rightStr}`, resStr, expl);
    current = current.replace(full, resStr);
  }

  return current.trim();
}

/**
 * Main function that analyzes an expression and returns step-by-step resolution
 */
export function explainCalculationSteps(
  rawExpression: string,
  isDegreeMode: boolean = true
): StepExplanationResult {
  const trimmed = rawExpression.trim();

  // 1. Empty check
  if (!trimmed) {
    return {
      status: 'empty',
      message: 'Digite ou monte uma conta na calculadora para visualizar a resolução passo a passo.',
      steps: [],
    };
  }

  // 2. Incomplete check
  const incompleteEnds = /[+\-*/%^,]$|math\.\w+$|\b\w+\($|\($|\*\*$/;
  if (incompleteEnds.test(trimmed)) {
    return {
      status: 'incomplete',
      message: 'A expressão está incompleta. Finalize os números ou feche os parênteses para ver o passo a passo.',
      steps: [],
    };
  }

  // Check balanced parentheses
  let openCount = 0;
  for (const char of trimmed) {
    if (char === '(') openCount++;
    if (char === ')') openCount--;
    if (openCount < 0) {
      return {
        status: 'incomplete',
        message: 'Existe um parêntese de fechamento ")" sem o parêntese de abertura correspondente.',
        steps: [],
      };
    }
  }
  if (openCount > 0) {
    return {
      status: 'incomplete',
      message: `A expressão possui ${openCount} parêntese(s) aberto(s). Feche todos os parênteses para ver o passo a passo.`,
      steps: [],
    };
  }

  // Check division by zero explicitly in text
  if (/\/\s*0(?![.\d])|\/\/\s*0(?![.\d])|%\s*0(?![.\d])/.test(trimmed)) {
    return {
      status: 'invalid',
      message: 'Divisão por zero detectada: divisão por 0 não é permitida na matemática.',
      steps: [],
    };
  }

  // Check single constant or simple number
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return {
      status: 'success',
      message: `O valor informado (${trimmed}) é um número direto, sem operações a resolver.`,
      steps: [
        {
          stepNumber: 1,
          description: 'Valor direto',
          subExpression: trimmed,
          stepResult: trimmed,
          explanation: `O valor ${trimmed} já é o resultado final, sem operações pendentes.`,
          resultingExpression: trimmed,
        },
      ],
      finalResult: trimmed,
    };
  }

  const steps: CalculationStep[] = [];
  let currentExpr = trimmed;

  const addStep = (description: string, subExpr: string, result: string, explanation?: string) => {
    steps.push({
      stepNumber: steps.length + 1,
      description,
      subExpression: subExpr,
      stepResult: result,
      explanation,
      resultingExpression: currentExpr,
    });
  };

  try {
    // Replace constants like math.pi and math.e first
    if (/math\.pi\b/i.test(currentExpr)) {
      const piVal = formatNumber(Math.PI);
      addStep(
        'Constante: π (math.pi)',
        'math.pi',
        piVal,
        `Substituímos a constante π pelo seu valor numérico aproximado de ${piVal}.`
      );
      currentExpr = currentExpr.replace(/math\.pi/gi, piVal);
    }
    if (/math\.e\b/i.test(currentExpr)) {
      const eVal = formatNumber(Math.E);
      addStep(
        'Constante: e (math.e)',
        'math.e',
        eVal,
        `Substituímos a constante de Euler e pelo seu valor numérico aproximado de ${eVal}.`
      );
      currentExpr = currentExpr.replace(/math\.e/gi, eVal);
    }

    let iterations = 0;
    const maxIterations = 50;

    // Loop until expression is reduced to a single number
    while (iterations < maxIterations && !/^-?\d+(?:\.\d+)?$/.test(currentExpr.trim())) {
      iterations++;
      const prevExpr = currentExpr;

      // 1. Innermost parentheses
      const innerParenRegex = /\(([^()]+)\)/;
      const parenMatch = currentExpr.match(innerParenRegex);

      if (parenMatch) {
        const fullParen = parenMatch[0]; // e.g. (5 + 3)
        const inside = parenMatch[1].trim(); // e.g. 5 + 3

        // Check if inside is preceded by a function name: e.g. math.sqrt(...) or sin(...)
        const beforeParenIdx = parenMatch.index || 0;
        const textBefore = currentExpr.slice(0, beforeParenIdx);
        const funcMatch = textBefore.match(/(math\.[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)$/);

        if (funcMatch) {
          const funcName = funcMatch[1];
          // Check if argument inside is already a single number
          if (/^-?\d+(?:\.\d+)?$/.test(inside)) {
            const arg = parseFloat(inside);
            const res = evalSingleFunction(funcName, arg, isDegreeMode);
            const resStr = formatNumber(res);
            const hasOtherOps = currentExpr.trim() !== `${funcName}(${inside})`;
            const explanation = getFunctionExplanation(funcName, arg, res, isDegreeMode, hasOtherOps);

            const funcCallStr = `${funcName}(${inside})`;
            addStep(`Função científica: ${funcCallStr}`, funcCallStr, resStr, explanation);

            // Replace funcName(inside) with resStr
            currentExpr = currentExpr.replace(funcCallStr, resStr);
          } else {
            // Must evaluate the inside of function arguments first
            const resolvedInside = solveFlatExpression(inside, addStep, true);
            currentExpr = currentExpr.replace(fullParen, `(${resolvedInside})`);
          }
        } else {
          // It's a standard grouping parenthesis
          if (/^-?\d+(?:\.\d+)?$/.test(inside)) {
            // Just (number), strip the parentheses
            currentExpr = currentExpr.replace(fullParen, inside);
          } else {
            const resolvedInside = solveFlatExpression(inside, addStep, true);
            currentExpr = currentExpr.replace(fullParen, resolvedInside);
          }
        }
      } else {
        // No more parentheses.
        // Check if there are any remaining function calls without parentheses (unlikely) or evaluate flat
        currentExpr = solveFlatExpression(currentExpr, addStep);
      }

      // Safeguard against infinite loop if no changes happened
      if (currentExpr === prevExpr) {
        break;
      }
    }

    const finalVal = currentExpr.trim();

    return {
      status: 'success',
      steps,
      finalResult: finalVal,
    };
  } catch (err: any) {
    if (err?.message === 'DIV_BY_ZERO' || /zero/i.test(err?.message)) {
      return {
        status: 'invalid',
        message: 'Divisão por zero: a divisão por 0 não é permitida na matemática.',
        steps,
      };
    }
    return {
      status: 'invalid',
      message: 'Não foi possível detalhar esta expressão. Verifique se a sintaxe matemática é válida.',
      steps: [],
    };
  }
}
