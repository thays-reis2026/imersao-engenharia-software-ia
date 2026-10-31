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
  Sparkles, 
  CornerDownLeft, 
  RotateCcw, 
  Terminal, 
  FlaskConical,
  HelpCircle,
  ListOrdered,
  Info,
  AlertCircle,
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
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);
  const [isOperatorsOpen, setIsOperatorsOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const stepExplanation: StepExplanationResult = explainCalculationSteps(
    expression.trim() || lastExpression.trim(),
    isDegreeMode
  );

  useEffect(() => {
    pyodideService.setDegMode(isDegreeMode);
  }, [isDegreeMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' &&
        document.activeElement !== inputRef.current
      ) {
        return;
      }
      if (document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Backspace' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, isDegreeMode]);

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
        {/* Top Controls Toolbar - Mobile */}
        <div className="flex sm:hidden flex-col pb-4 border-b border-white/20 gap-2.5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20 shrink-0">
              <button
                onClick={() => setIsDegreeMode(true)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  isDegreeMode
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                DEG
              </button>
              <button
                onClick={() => setIsDegreeMode(false)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  !isDegreeMode
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                RAD
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-3.5 py-1.5 text-xs font-bold text-black bg-white hover:bg-zinc-200 rounded-lg transition-colors shadow-sm shrink-0"
            >
              Limpar
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Modo da calculadora"
            className="flex items-center p-1 bg-white/5 rounded-lg border border-white/20 w-full gap-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isScientific}
              onClick={() => setIsScientific(false)}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none cursor-pointer ${
                !isScientific
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Básica
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isScientific}
              onClick={() => setIsScientific(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none cursor-pointer ${
                isScientific
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <FlaskConical className={`w-3.5 h-3.5 ${isScientific ? 'text-black' : 'text-zinc-300'}`} />
              <span>Científica</span>
            </button>
          </div>
        </div>

        {/* Top Controls Toolbar - Tablet & Desktop */}
        <div className="hidden sm:flex items-center justify-between pb-4 border-b border-white/20 gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20 shrink-0">
            <button
              onClick={() => setIsDegreeMode(true)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                isDegreeMode
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              DEG
            </button>
            <button
              onClick={() => setIsDegreeMode(false)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                !isDegreeMode
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              RAD
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              role="radiogroup"
              aria-label="Modo da calculadora"
              className="flex items-center gap-1.5 p-1 bg-white/5 rounded-lg border border-white/20 shrink-0"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!isScientific}
                onClick={() => setIsScientific(false)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none cursor-pointer ${
                  !isScientific
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                Básica
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isScientific}
                onClick={() => setIsScientific(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none cursor-pointer ${
                  isScientific
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-300 hover:text-white'
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
              <span className="text-[11px] text-white font-medium tabular-nums">
                {executionTime}ms
              </span>
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
              <span
                className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                  error ? 'text-rose-400' : 'text-white'
                }`}
              >
                {result}
              </span>
              <button
                onClick={handleCopyResult}
                className="p-1.5 text-zinc-300 hover:text-white rounded-md bg-white/10 hover:bg-white/25 border border-white/20 transition-colors"
                title="Copiar resultado"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
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
          <button
            onClick={handleMemoryClear}
            className="py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/15 transition-colors"
          >
            MC
          </button>
          <button
            onClick={handleMemoryRecall}
            className="py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/15 transition-colors"
          >
            MR
          </button>
          <button
            onClick={handleMemoryAdd}
            className="py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/15 transition-colors"
          >
            M+
          </button>
          <button
            onClick={handleMemorySub}
            className="py-1.5 text-xs font-bold rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/15 transition-colors"
          >
            M-
          </button>
        </div>

        {/* Scientific Keys */}
        {isScientific && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/20">
            <button
              onClick={() => handleAppend('math.sqrt(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Raiz Quadrada (math.sqrt)"
            >
              <span className="sm:hidden">√</span>
              <span className="hidden sm:inline">√ (sqrt)</span>
            </button>
            <button
              onClick={() => handleAppend('**')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Potência em Python (ex: 2**3)"
            >
              <span className="sm:hidden">xʸ</span>
              <span className="hidden sm:inline">xʸ (**)</span>
            </button>
            <button
              onClick={() => handleAppend('//')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Divisão inteira em Python (//)"
            >
              <span className="sm:hidden">//</span>
              <span className="hidden sm:inline">// (int)</span>
            </button>
            <button
              onClick={() => handleAppend('%')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Resto da divisão (%)"
            >
              <span className="sm:hidden">%</span>
              <span className="hidden sm:inline">% (mod)</span>
            </button>
            <button
              onClick={() => handleAppend('math.pi')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Número Pi (3.14159...)"
            >
              <span className="sm:hidden">π</span>
              <span className="hidden sm:inline">π (pi)</span>
            </button>
            <button
              onClick={() => handleAppend('math.e')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Constante de Euler (e)"
            >
              e
            </button>

            <button
              onClick={() => handleAppend('math.sin(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Seno (math.sin)"
            >
              sin
            </button>
            <button
              onClick={() => handleAppend('math.cos(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Cosseno (math.cos)"
            >
              cos
            </button>
            <button
              onClick={() => handleAppend('math.tan(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Tangente (math.tan)"
            >
              tan
            </button>
            <button
              onClick={() => handleAppend('math.log(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Logaritmo Natural (ln)"
            >
              ln
            </button>
            <button
              onClick={() => handleAppend('math.log10(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Logaritmo na Base 10"
            >
              log₁₀
            </button>
            <button
              onClick={() => handleAppend('math.factorial(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Fatorial"
            >
              n!
            </button>
          </div>
        )}

        {/* Primary Keypad */}
        <div className="grid grid-cols-4 gap-2.5 mt-4">
          <button
            onClick={handleClear}
            className="py-3 text-sm rounded-xl bg-white text-black font-bold hover:bg-zinc-200 active:scale-98 transition-all shadow-sm"
          >
            C
          </button>
          <button
            onClick={() => handleAppend('(')}
            className="py-3 text-sm font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all"
          >
            (
          </button>
          <button
            onClick={() => handleAppend(')')}
            className="py-3 text-sm font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all"
          >
            )
          </button>
          <button
            onClick={() => handleAppend('/')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 active:scale-98 transition-all"
          >
            /
          </button>

          <button
            onClick={() => handleAppend('7')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            7
          </button>
          <button
            onClick={() => handleAppend('8')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            8
          </button>
          <button
            onClick={() => handleAppend('9')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            9
          </button>
          <button
            onClick={() => handleAppend('*')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 active:scale-98 transition-all"
          >
            *
          </button>

          <button
            onClick={() => handleAppend('4')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            4
          </button>
          <button
            onClick={() => handleAppend('5')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            5
          </button>
          <button
            onClick={() => handleAppend('6')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            6
          </button>
          <button
            onClick={() => handleAppend('-')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 active:scale-98 transition-all"
          >
            -
          </button>

          <button
            onClick={() => handleAppend('1')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            1
          </button>
          <button
            onClick={() => handleAppend('2')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            2
          </button>
          <button
            onClick={() => handleAppend('3')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            3
          </button>
          <button
            onClick={() => handleAppend('+')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-white/20 border border-white/40 text-white hover:bg-white/30 active:scale-98 transition-all"
          >
            +
          </button>

          <button
            onClick={() => handleAppend('0')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all tabular-nums"
          >
            0
          </button>
          <button
            onClick={() => handleAppend('.')}
            className="py-3 text-base font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-98 transition-all"
          >
            .
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-zinc-300 hover:text-white hover:bg-white/20 active:scale-98 transition-all"
            title="Apagar último caractere"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="py-3 flex items-center justify-center font-bold text-xl font-mono rounded-xl bg-white text-black hover:bg-zinc-200 shadow-lg active:scale-98 transition-all"
            title="Igual (=)"
          >
            =
          </button>
        </div>

        {/* Quick Python Math Snippets Bar */}
        <div className="hidden min-[1101px]:flex mt-4 pt-3 border-t border-white/20 flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-400 text-[11px] font-mono mr-1">Atalhos Python:</span>
          <button
            onClick={() => handleAppend('abs(')}
            className="px-2 py-1 rounded bg-white/5 border border-white/20 text-zinc-300 hover:text-white text-[11px] font-mono"
          >
            abs()
          </button>
          <button
            onClick
