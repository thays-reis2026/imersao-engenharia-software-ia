/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { pyodideService, PyResult } from '../services/pyodideService';
import { explainCalculationSteps, StepExplanationResult } from '../services/stepExplainer';
import { 
  Delete, 
  Copy, 
  Check, 
  Terminal, 
  FlaskConical,
  HelpCircle,
  ListOrdered,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
  executionTimeMs: number;
}

interface CalculatorGuiProps {
  onAddHistory: (record: CalculationRecord) => void;
  onNavigateToRepl: (code?: string) => void;
}

export const CalculatorGui: React.FC<CalculatorGuiProps> = ({
  onAddHistory,
  onNavigateToRepl,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [lastExpression, setLastExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [isDegreeMode, setIsDegreeMode] = useState<boolean>(true);
  const [isScientific, setIsScientific] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memory, setMemory] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'steps'>('code');
  const [isOperatorsOpen, setIsOperatorsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const stepExplanation: StepExplanationResult = explainCalculationSteps(
    expression.trim() || lastExpression.trim(),
    isDegreeMode
  );

  useEffect(() => {
    pyodideService.setDegMode(isDegreeMode);
  }, [isDegreeMode]);

  const handleAppend = (token: string) => {
    setError(null);
    setExpression((prev) => prev + token);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = () => {
    setExpression('');
    setError(null);
    setResult('0');
    setExecutionTime(null);
  };

  const handleBackspace = () => {
    setError(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = async () => {
    const exprToRun = expression.trim();
    if (!exprToRun) return;

    setIsCalculating(true);
    setError(null);

    try {
      const res: PyResult = await pyodideService.execute(exprToRun, isDegreeMode);

      setExecutionTime(res.executionTimeMs);
      setLastExpression(exprToRun);

      if (res.success && res.result !== undefined && res.result !== '') {
        setResult(res.result);
        setError(null);

        onAddHistory({
          id: Math.random().toString(36).substring(2, 9),
          expression: exprToRun,
          result: res.result,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          executionTimeMs: res.executionTimeMs,
        });
      } else if (res.error) {
        setError(res.error);
        setResult('Erro');
      } else if (res.stdout) {
        setResult(res.stdout);
        setError(null);
      } else {
        setResult('None');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado');
      setResult('Erro');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCopyResult = () => {
    if (!result || result === 'Erro') return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleMemoryAdd = () => {
    const num = parseFloat(result) || 0;
    const newMem = memory + num;
    setMemory(newMem);
    pyodideService.setMemory(newMem);
  };

  const handleMemorySub = () => {
    const num = parseFloat(result) || 0;
    const newMem = memory - num;
    setMemory(newMem);
    pyodideService.setMemory(newMem);
  };

  const handleMemoryRecall = () => {
    handleAppend(String(memory));
  };

  const handleMemoryClear = () => {
    setMemory(0);
    pyodideService.setMemory(0);
  };

  const getPythonCodeSnippet = () => {
    if (!expression) return '# Digite uma expressão ou clique nos botões acima\nimport math\nresultado = 0';
    return `# Expressão calculada em Python CPython\nimport math\n\nexpressao = "${expression.replace(/"/g, '\\"')}"\nresultado = ${expression}`;
  };

  return (
    <div className="grid grid-cols-1 min-[1101px]:grid-cols-12 gap-6 min-[1101px]:gap-8 items-start w-full">
      {/* Left Column: Calculator Interface */}
      <div className="w-full min-[1101px]:col-span-7 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Top Controls Toolbar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/20 gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20 shrink-0">
            <button
              onClick={() => setIsDegreeMode(true)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                isDegreeMode ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
              }`}
            >
              DEG
            </button>
            <button
              onClick={() => setIsDegreeMode(false)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                !isDegreeMode ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
              }`}
            >
              RAD
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20 shrink-0">
              <button
                type="button"
                onClick={() => setIsScientific(false)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  !isScientific ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
                }`}
              >
                Básica
              </button>
              <button
                type="button"
                onClick={() => setIsScientific(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${
                  isScientific ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isScientific ? 'text-black' : 'text-zinc-300'}`} />
                <span>Científica</span>
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors shadow-sm shrink-0"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/20 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-mono tracking-wide">
            <div className="truncate max-w-[80%] text-zinc-300">
              {lastExpression ? `${lastExpression} =` : 'Python Math Ready'}
            </div>
            {executionTime !== null && (
              <span className="text-[11px] text-white font-medium tabular-nums">{executionTime}ms</span>
            )}
          </div>

          <div className="my-2">
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={(e) => {
                setError(null);
                setExpression(e.target.value);
              }}
              placeholder="0"
              className="w-full bg-transparent font-mono text-xl sm:text-2xl text-white text-right focus:outline-none placeholder-zinc-500 tabular-nums"
            />
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-white/20">
            <div className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Resultado</span>
              {memory !== 0 && (
                <span className="px-1.5 py-0.5 rounded bg-white/20 border border-white/30 text-white text-[10px] font-bold">
                  M = {memory}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${error ? 'text-rose-400' : 'text-white'}`}>
                {result}
              </span>
              <button
                onClick={handleCopyResult}
                className="p-1.5 text-zinc-300 hover:text-white rounded-md bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
                title="Copiar resultado"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-white text-xs font-mono">
            <strong className="text-white">Erro em Python:</strong> {error}
          </div>
        )}

        {/* Memory Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button onClick={handleMemoryClear} className="py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/15 transition-colors">MC</button>
          <button onClick={handleMemoryRecall} className="py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/15 transition-colors">MR</button>
          <button onClick={handleMemoryAdd} className="py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/15 transition-colors">M+</button>
          <button onClick={handleMemorySub} className="py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/15 transition-colors">M-</button>
        </div>

        {/* Scientific Keys */}
        {isScientific && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/20">
            <button onClick={() => handleAppend('math.sqrt(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">√ (sqrt)</button>
            <button onClick={() => handleAppend('**')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">xʸ (**)</button>
            <button onClick={() => handleAppend('//')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">// (int)</button>
            <button onClick={() => handleAppend('%')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">% (mod)</button>
            <button onClick={() => handleAppend('math.pi')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">π (pi)</button>
            <button onClick={() => handleAppend('math.e')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">e</button>
            <button onClick={() => handleAppend('math.sin(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">sin</button>
            <button onClick={() => handleAppend('math.cos(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">cos</button>
            <button onClick={() => handleAppend('math.tan(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">tan</button>
            <button onClick={() => handleAppend('math.log(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">ln</button>
            <button onClick={() => handleAppend('math.log10(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">log₁₀</button>
            <button onClick={() => handleAppend('math.factorial(')} className="py-2 px-2 text-xs font-mono rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors">n!</button>
          </div>
        )}

        {/* Primary Keypad */}
        <div className="grid grid-cols-4 gap-2.5 mt-4">
          <button onClick={handleClear} className="py-3 text-sm rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all">C</button>
          <button onClick={() => handleAppend('(')} className="py-3 text-sm font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">(</button>
          <button onClick={() => handleAppend(')')} className="py-3 text-sm font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">)</button>
          <button onClick={() => handleAppend('/')} className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 transition-all">/</button>

          <button onClick={() => handleAppend('7')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">7</button>
          <button onClick={() => handleAppend('8')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">8</button>
          <button onClick={() => handleAppend('9')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">9</button>
          <button onClick={() => handleAppend('*')} className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 transition-all">*</button>

          <button onClick={() => handleAppend('4')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">4</button>
          <button onClick={() => handleAppend('5')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">5</button>
          <button onClick={() => handleAppend('6')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">6</button>
          <button onClick={() => handleAppend('-')} className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 transition-all">-</button>

          <button onClick={() => handleAppend('1')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">1</button>
          <button onClick={() => handleAppend('2')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">2</button>
          <button onClick={() => handleAppend('3')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">3</button>
          <button onClick={() => handleAppend('+')} className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 transition-all">+</button>

          <button onClick={() => handleAppend('0')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">0</button>
          <button onClick={() => handleAppend('.')} className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">.</button>
          <button onClick={handleBackspace} className="py-3 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/20 transition-all"><Delete className="w-5 h-5" /></button>
          <button onClick={handleCalculate} disabled={isCalculating} className="py-3 flex items-center justify-center font-bold text-xl font-mono rounded-xl bg-white text-black hover:bg-zinc-200 shadow-lg transition-all">=</button>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full min-[1101px]:col-span-5 flex flex-col gap-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/20 gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  activeRightTab === 'code' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 inline mr-1" /> Código Python
              </button>
              <button
                onClick={() => setActiveRightTab('steps')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  activeRightTab === 'steps' ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5 inline mr-1" /> Passo a passo
              </button>
            </div>

            {activeRightTab === 'code' && (
              <button
                onClick={() => navigator.clipboard.writeText(getPythonCodeSnippet())}
                className="px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/15 border border-white/20 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5 inline mr-1" /> Copiar
              </button>
            )}
          </div>

          {activeRightTab === 'code' && (
            <div className="mt-4 flex flex-col gap-3">
              <span className="text-xs text-zinc-300 font-mono">
                Veja como este cálculo é executado em Python real com a biblioteca nativa <code className="text-white font-bold">math</code>:
              </span>
              <div className="p-3.5 rounded-xl bg-black/60 border border-white/20 font-mono text-xs text-white overflow-x-auto whitespace-pre leading-relaxed">
                {getPythonCodeSnippet()}
                {result !== '0' && result !== 'Erro' && !error && (
                  <span className="text-zinc-400 block mt-2"># Output: {result}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400 font-mono">Deseja rodar no Terminal REPL?</span>
                <button
                  onClick={() => onNavigateToRepl(expression)}
                  className="text-xs text-white font-bold hover:underline flex items-center gap-1"
                >
                  <span>Abrir no Terminal</span> →
                </button>
              </div>
            </div>
          )}

          {activeRightTab === 'steps' && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-mono">Análise da expressão:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono border border-white/20">
                  {isDegreeMode ? 'Modo DEG' : 'Modo RAD'}
                </span>
              </div>

              {stepExplanation.steps.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs font-mono bg-white/5 rounded-xl border border-white/20">
                  Digite uma expressão na calculadora para ver o passo a passo.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/20 text-xs font-mono text-white flex items-center justify-between">
                    <span>Expressão base:</span>
                    <strong className="text-white">{stepExplanation.cleanExpression}</strong>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                    {stepExplanation.steps.map((st, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono flex flex-col gap-1">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="font-bold text-white">Passo {idx + 1}: {st.title}</span>
                        </div>
                        <div className="text-white text-[11px] bg-black/40 p-1.5 rounded border border-white/10">
                          {st.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Python Operators Help Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-xl flex flex-col">
          <button
            onClick={() => setIsOperatorsOpen(!isOperatorsOpen)}
            className="flex items-center justify-between w-full text-left text-xs font-mono text-white focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-white" />
              <span className="font-bold">Operadores Matemáticos em Python</span>
            </div>
            {isOperatorsOpen ? <ChevronUp className="w-4 h-4 text-zinc-300" /> : <ChevronDown className="w-4 h-4 text-zinc-300" />}
          </button>

          {isOperatorsOpen && (
            <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-1 gap-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                <span>Exponenciação</span>
                <code className="text-white font-bold">2 ** 3</code>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                <span>Divisão Inteira</span>
                <code className="text-white font-bold">7 // 2</code>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/10">
                <span>Módulo / Resto</span>
                <code className="text-white font-bold">7 % 3</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
