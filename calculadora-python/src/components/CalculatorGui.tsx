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

  // Detect touch devices (pointer: coarse) or narrow viewports (<= 1100px)
  const [isTouchOrNarrow, setIsTouchOrNarrow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isNarrow = window.matchMedia('(max-width: 1100px)').matches;
    return isCoarse || isNarrow;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqlCoarse = window.matchMedia('(pointer: coarse)');
    const mqlNarrow = window.matchMedia('(max-width: 1100px)');

    const handleMediaChange = () => {
      setIsTouchOrNarrow(mqlCoarse.matches || mqlNarrow.matches);
    };

    handleMediaChange();

    if (mqlCoarse.addEventListener) {
      mqlCoarse.addEventListener('change', handleMediaChange);
      mqlNarrow.addEventListener('change', handleMediaChange);
      return () => {
        mqlCoarse.removeEventListener('change', handleMediaChange);
        mqlNarrow.removeEventListener('change', handleMediaChange);
      };
    } else {
      mqlCoarse.addListener(handleMediaChange);
      mqlNarrow.addListener(handleMediaChange);
      return () => {
        mqlCoarse.removeListener(handleMediaChange);
        mqlNarrow.removeListener(handleMediaChange);
      };
    }
  }, []);

  // Compute step-by-step breakdown using current or last expression
  const stepExplanation: StepExplanationResult = explainCalculationSteps(
    expression.trim() || lastExpression.trim(),
    isDegreeMode
  );

  // Sync angle mode with Python service
  useEffect(() => {
    pyodideService.setDegMode(isDegreeMode);
  }, [isDegreeMode]);

  // Keyboard navigation & typing handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in another input/textarea
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
    // On touch/tablet devices, avoid calling focus() to prevent virtual keyboard from opening
    if (!isTouchOrNarrow && inputRef.current) {
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

        // Record history
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
        // In case code ran as statement and printed
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

  // Memory operations
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

  // Generate clean Python code representation for the user
  const getPythonCodeSnippet = () => {
    if (!expression) return '# Digite uma expressão ou clique nos botões acima\nimport math\nresultado = 0';
    return `# Expressão calculada em Python CPython\nimport math\n\nexpressao = "${expression.replace(/"/g, '\\"')}"\nresultado = ${expression}`;
  };

  return (
    <div className="grid grid-cols-1 min-[1101px]:grid-cols-12 gap-6 min-[1101px]:gap-8 items-start w-full">
      {/* Left/Main Column: The Calculator Visual Interface */}
      <div className="w-full min-[1101px]:col-span-7 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Top Controls Toolbar - Mobile (< 640px): 2 rows */}
        <div className="flex sm:hidden flex-col pb-4 border-b border-[rgba(255,255,255,0.2)] gap-2.5">
          {/* Row 1: DEG/RAD on left, Limpar on right */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.08)] rounded-lg border border-[rgba(255,255,255,0.2)] shrink-0">
              <button
                onClick={() => setIsDegreeMode(true)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  isDegreeMode
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                DEG
              </button>
              <button
                onClick={() => setIsDegreeMode(false)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  !isDegreeMode
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                RAD
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#C75F71] hover:bg-[#b34f60] rounded-lg transition-colors shadow-sm shadow-[#C75F71]/20 shrink-0 keep-white"
            >
              Limpar
            </button>
          </div>

          {/* Row 2: Básica | Científica full width, equal size, centered text */}
          <div
            role="radiogroup"
            aria-label="Modo da calculadora"
            className="flex items-center p-1 bg-[rgba(255,255,255,0.08)] rounded-lg border border-[rgba(255,255,255,0.2)] w-full gap-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={!isScientific}
              onClick={() => setIsScientific(false)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setIsScientific(true);
                }
              }}
              className={`flex-1 flex items-center justify-center py-1.5 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer ${
                !isScientific
                  ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              Básica
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isScientific}
              onClick={() => setIsScientific(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setIsScientific(false);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer ${
                isScientific
                  ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              <FlaskConical className={`w-3.5 h-3.5 ${isScientific ? 'text-white keep-white' : 'text-[var(--theme-text-secondary)]'}`} />
              <span>Científica</span>
            </button>
          </div>
        </div>

        {/* Top Controls Toolbar - Tablet & Desktop (>= 640px) */}
        <div className="hidden sm:flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.2)] gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.08)] rounded-lg border border-[rgba(255,255,255,0.2)] shrink-0">
            <button
              onClick={() => setIsDegreeMode(true)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                isDegreeMode
                  ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              DEG
            </button>
            <button
              onClick={() => setIsDegreeMode(false)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                !isDegreeMode
                  ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                  : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              RAD
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Segmented Mode Selector (Básica / Científica) */}
            <div
              role="radiogroup"
              aria-label="Modo da calculadora"
              className="flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.08)] rounded-lg border border-[rgba(255,255,255,0.2)] shrink-0"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!isScientific}
                onClick={() => setIsScientific(false)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setIsScientific(true);
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer ${
                  !isScientific
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                Básica
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isScientific}
                onClick={() => setIsScientific(true)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setIsScientific(false);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer ${
                  isScientific
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isScientific ? 'text-white keep-white' : 'text-[var(--theme-text-secondary)]'}`} />
                <span>Científica</span>
              </button>
            </div>

            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#C75F71] hover:bg-[#b34f60] rounded-lg transition-colors shadow-sm shadow-[#C75F71]/20 shrink-0 keep-white"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Display Screen (Visor com rgba(255,255,255,0.03)) */}
        <div className="mt-4 p-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] flex flex-col justify-between min-h-[140px]">
          {/* Previous Expression & Meta */}
          <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)] font-mono tracking-wide">
            <div className="truncate max-w-[80%] text-[var(--theme-text-secondary)]">
              {lastExpression ? `${lastExpression} =` : 'Python Math Ready'}
            </div>
            {executionTime !== null && (
              <span className="text-[11px] text-[var(--theme-text-secondary)] font-medium tabular-nums">
                {executionTime}ms
              </span>
            )}
          </div>

          {/* Current Input Field */}
          <div className="my-2">
            <input
              ref={inputRef}
              type="text"
              inputMode={isTouchOrNarrow ? 'none' : undefined}
              value={expression}
              onChange={(e) => {
                setError(null);
                setExpression(e.target.value);
              }}
              placeholder="0"
              className="w-full bg-transparent font-mono text-xl sm:text-2xl text-[var(--theme-text-main)] text-right focus:outline-none placeholder-[var(--theme-text-muted)] tabular-nums"
            />
          </div>

          {/* Computed Result Display with Copy */}
          <div className="flex items-end justify-between pt-2 border-t border-[rgba(255,255,255,0.2)]">
            <div className="text-[11px] font-mono text-[var(--theme-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Resultado</span>
              {memory !== 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[#C75F71] text-white text-[10px] font-bold keep-white shadow-sm">
                  M = {memory}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                  error ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--theme-text-main)]'
                }`}
              >
                {result}
              </span>
              <button
                onClick={handleCopyResult}
                className="p-1.5 text-[var(--theme-text-main)] hover:text-[var(--theme-text-main)] rounded-md bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] transition-colors cursor-pointer"
                title="Copiar resultado"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-[var(--theme-text-main)]" />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--theme-text-main)]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-3 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-200 text-xs font-mono">
            <strong className="font-bold">Erro em Python:</strong> {error}
          </div>
        )}

        {/* Memory Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button
            onClick={handleMemoryClear}
            className="py-1.5 text-xs font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
          >
            MC
          </button>
          <button
            onClick={handleMemoryRecall}
            className="py-1.5 text-xs font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
          >
            MR
          </button>
          <button
            onClick={handleMemoryAdd}
            className="py-1.5 text-xs font-bold rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
          >
            M+
          </button>
          <button
            onClick={handleMemorySub}
            className="py-1.5 text-xs font-bold rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
          >
            M-
          </button>
        </div>

        {/* Scientific Keys (Conditional / Accordion) */}
        {isScientific && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.2)]">
            <button
              onClick={() => handleAppend('math.sqrt(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Raiz Quadrada (math.sqrt)"
              aria-label="Raiz Quadrada (math.sqrt)"
            >
              <span className="sm:hidden">√</span>
              <span className="hidden sm:inline">√ (sqrt)</span>
            </button>
            <button
              onClick={() => handleAppend('**')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Potência em Python (ex: 2**3)"
              aria-label="Potência em Python (xʸ ou **)"
            >
              <span className="sm:hidden">xʸ</span>
              <span className="hidden sm:inline">xʸ (**)</span>
            </button>
            <button
              onClick={() => handleAppend('//')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Divisão inteira em Python (//)"
              aria-label="Divisão inteira em Python (//)"
            >
              <span className="sm:hidden">//</span>
              <span className="hidden sm:inline">// (int)</span>
            </button>
            <button
              onClick={() => handleAppend('%')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Resto da divisão (%)"
              aria-label="Resto da divisão (%)"
            >
              <span className="sm:hidden">%</span>
              <span className="hidden sm:inline">% (mod)</span>
            </button>
            <button
              onClick={() => handleAppend('math.pi')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Número Pi (3.14159...)"
              aria-label="Número Pi (math.pi)"
            >
              <span className="sm:hidden">π</span>
              <span className="hidden sm:inline">π (pi)</span>
            </button>
            <button
              onClick={() => handleAppend('math.e')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Constante de Euler (e)"
              aria-label="Constante de Euler (math.e)"
            >
              e
            </button>

            <button
              onClick={() => handleAppend('math.sin(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Seno (math.sin)"
              aria-label="Seno (math.sin)"
            >
              sin
            </button>
            <button
              onClick={() => handleAppend('math.cos(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Cosseno (math.cos)"
              aria-label="Cosseno (math.cos)"
            >
              cos
            </button>
            <button
              onClick={() => handleAppend('math.tan(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Tangente (math.tan)"
              aria-label="Tangente (math.tan)"
            >
              tan
            </button>
            <button
              onClick={() => handleAppend('math.log(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Logaritmo Natural (ln)"
              aria-label="Logaritmo Natural (math.log)"
            >
              ln
            </button>
            <button
              onClick={() => handleAppend('math.log10(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Logaritmo na Base 10"
              aria-label="Logaritmo na Base 10 (math.log10)"
            >
              log₁₀
            </button>
            <button
              onClick={() => handleAppend('math.factorial(')}
              className="py-2 px-2 text-xs font-mono font-medium rounded-lg bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors"
              title="Fatorial"
              aria-label="Fatorial (math.factorial)"
            >
              n!
            </button>
          </div>
        )}

        {/* Primary Keypad (Numbers & Basic Operators) */}
        <div className="grid grid-cols-4 gap-2.5 mt-4">
          <button
            onClick={handleClear}
            className="py-3 text-sm rounded-xl bg-[#C75F71] text-white font-bold hover:bg-[#b34f60] active:scale-98 transition-all shadow-sm keep-white"
          >
            C
          </button>
          <button
            onClick={() => handleAppend('(')}
            className="py-3 text-sm font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all"
          >
            (
          </button>
          <button
            onClick={() => handleAppend(')')}
            className="py-3 text-sm font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all"
          >
            )
          </button>
          <button
            onClick={() => handleAppend('/')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white active:scale-98 transition-all shadow-sm keep-white"
          >
            /
          </button>

          <button
            onClick={() => handleAppend('7')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            7
          </button>
          <button
            onClick={() => handleAppend('8')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            8
          </button>
          <button
            onClick={() => handleAppend('9')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            9
          </button>
          <button
            onClick={() => handleAppend('*')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white active:scale-98 transition-all shadow-sm keep-white"
          >
            *
          </button>

          <button
            onClick={() => handleAppend('4')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            4
          </button>
          <button
            onClick={() => handleAppend('5')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            5
          </button>
          <button
            onClick={() => handleAppend('6')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            6
          </button>
          <button
            onClick={() => handleAppend('-')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white active:scale-98 transition-all shadow-sm keep-white"
          >
            -
          </button>

          <button
            onClick={() => handleAppend('1')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            1
          </button>
          <button
            onClick={() => handleAppend('2')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            2
          </button>
          <button
            onClick={() => handleAppend('3')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            3
          </button>
          <button
            onClick={() => handleAppend('+')}
            className="py-3 text-lg font-mono font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white active:scale-98 transition-all shadow-sm keep-white"
          >
            +
          </button>

          <button
            onClick={() => handleAppend('0')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all tabular-nums"
          >
            0
          </button>
          <button
            onClick={() => handleAppend('.')}
            className="py-3 text-base font-semibold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all"
          >
            .
          </button>
          <button
            onClick={handleBackspace}
            className="py-3 flex items-center justify-center rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] active:scale-98 transition-all"
            title="Apagar último caractere"
          >
            <Delete className="w-5 h-5 text-[var(--theme-text-main)]" />
          </button>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="py-3 flex items-center justify-center font-bold text-xl font-mono rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white shadow-lg shadow-[#C75F71]/30 active:scale-98 transition-all keep-white"
            title="Igual (=)"
          >
            =
          </button>
        </div>

        {/* Quick Python Math Snippets Bar */}
        <div className="hidden min-[1101px]:flex mt-4 pt-3 border-t border-[rgba(255,255,255,0.2)] flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[var(--theme-text-secondary)] text-[11px] font-mono mr-1">Atalhos Python:</span>
          <button
            onClick={() => handleAppend('abs(')}
            className="px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] text-[11px] font-mono transition-colors"
          >
            abs()
          </button>
          <button
            onClick={() => handleAppend('round(')}
            className="px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] text-[11px] font-mono transition-colors"
          >
            round()
          </button>
          <button
            onClick={() => handleAppend('_ans')}
            className="px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] text-[11px] font-mono transition-colors"
          >
            _ans
          </button>
          <button
            onClick={() => handleAppend('sum([')}
            className="px-2 py-1 rounded bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] text-[11px] font-mono transition-colors"
          >
            sum([])
          </button>
        </div>
      </div>

      {/* Right Column: Real-time Python Code Representation & Education */}
      <div className="w-full min-[1101px]:col-span-5 flex flex-col gap-6">
        {/* Tabbed Card: Python Code & Step-by-step */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-5 shadow-xl flex flex-col">
          {/* Tabs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[rgba(255,255,255,0.2)] gap-2">
            <div className="w-full sm:w-auto flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.08)] rounded-lg border border-[rgba(255,255,255,0.2)]">
              <button
                onClick={() => setActiveRightTab('code')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  activeRightTab === 'code'
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Código Python</span>
              </button>
              <button
                onClick={() => setActiveRightTab('steps')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
                  activeRightTab === 'steps'
                    ? 'bg-[#C75F71] text-white font-bold shadow-sm keep-white'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Passo a passo</span>
              </button>
            </div>

            <div className="w-full sm:w-auto flex justify-end items-center pt-0.5 sm:pt-0">
              {activeRightTab === 'code' ? (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPythonCodeSnippet());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[var(--theme-text-main)] hover:underline transition-colors cursor-pointer"
                  title="Copiar código Python"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--theme-text-main)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />}
                  <span>Copiar</span>
                </button>
              ) : (
                <span className="text-[11px] font-mono font-semibold text-[var(--theme-text-secondary)]">
                  {isDegreeMode ? 'Graus (DEG)' : 'Radianos (RAD)'}
                </span>
              )}
            </div>
          </div>

          {/* Tab 1: Código Python */}
          {activeRightTab === 'code' && (
            <div className="pt-2">
              <p className="text-xs text-[var(--theme-text-secondary)] mb-3 leading-relaxed">
                Veja como este cálculo é executado em Python real com a biblioteca nativa <code className="text-[var(--theme-text-main)] font-mono font-bold">math</code>:
              </p>

              {/* Bloco de código com rgba(255,255,255,0.03) */}
              <div className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] font-mono text-xs text-[var(--theme-text-main)] overflow-x-auto">
                <pre className="text-[var(--theme-text-main)] font-medium">import math</pre>
                <pre className="text-[var(--theme-text-secondary)] font-medium mt-1"># Expressão ativa:</pre>
                <pre className="text-[var(--theme-text-main)] font-bold mt-0.5">
                  resultado = {expression || lastExpression || '0'}
                </pre>
                <pre className="text-[var(--theme-text-main)] mt-2">print(f"Resultado: {'{resultado}'}")</pre>
                <pre className="text-[var(--theme-text-secondary)] font-medium mt-1"># Output: {result}</pre>
              </div>

              <div className="hidden min-[1101px]:flex mt-3 pt-3 border-t border-[rgba(255,255,255,0.2)] items-center justify-between">
                <span className="text-[11px] text-[var(--theme-text-secondary)]">Deseja rodar no Terminal REPL?</span>
                <button
                  onClick={() => onNavigateToRepl(expression || lastExpression)}
                  className="text-xs font-bold text-[var(--theme-text-main)] hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir no Terminal</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Passo a passo */}
          {activeRightTab === 'steps' && (
            <div className="py-2">
              {stepExplanation.status === 'empty' && (
                <div className="p-4 my-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                  Digite ou monte uma conta na calculadora para visualizar a resolução passo a passo seguindo a ordem das operações (parênteses, funções, potências, multiplicação/divisão e soma/subtração).
                </div>
              )}

              {stepExplanation.status === 'incomplete' && (
                <div className="p-4 my-2 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-xs text-[var(--theme-text-main)] leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[var(--theme-text-main)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[var(--theme-text-main)]">Expressão em edição</p>
                    <p className="text-[var(--theme-text-secondary)] mt-1">{stepExplanation.message || 'Complete os números ou feche os parênteses para visualizar o passo a passo.'}</p>
                  </div>
                </div>
              )}

              {stepExplanation.status === 'invalid' && (
                <div className="p-4 my-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[var(--theme-text-main)]">Aviso sobre o cálculo</p>
                    <p className="text-[var(--theme-text-secondary)] mt-1">{stepExplanation.message || 'Verifique a expressão para detalhar os passos.'}</p>
                  </div>
                </div>
              )}

              {stepExplanation.status === 'success' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--theme-text-secondary)]">
                    <span>Ordem de resolução matemática:</span>
                    <span className="font-mono text-[11px] text-[var(--theme-text-main)] font-bold">
                      {stepExplanation.steps.length} {stepExplanation.steps.length === 1 ? 'passo' : 'passos'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {(showAllSteps
                      ? stepExplanation.steps
                      : stepExplanation.steps.slice(0, 8)
                    ).map((s) => (
                      <div
                        key={s.stepNumber}
                        className="p-3 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] flex flex-col gap-1 text-xs text-[var(--theme-text-main)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--theme-text-main)] text-[11px] font-mono">
                            Passo {s.stepNumber}
                          </span>
                          <span className="text-[var(--theme-text-secondary)] text-[11px] truncate max-w-[70%] text-right">
                            {s.description}
                          </span>
                        </div>

                        <div className="flex items-center justify-between font-mono mt-1 pt-1 border-t border-[rgba(255,255,255,0.2)]">
                          <span className="text-[var(--theme-text-main)] font-semibold">{s.subExpression}</span>
                          <span className="text-[var(--theme-text-main)] font-bold text-sm tabular-nums">
                            = {s.stepResult}
                          </span>
                        </div>

                        {s.explanation && (
                          <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1 leading-relaxed">
                            {s.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {stepExplanation.steps.length > 8 && (
                    <div className="pt-1 text-center">
                      <button
                        onClick={() => setShowAllSteps(!showAllSteps)}
                        className="px-3 py-1.5 text-xs font-bold text-[var(--theme-text-main)] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {showAllSteps ? (
                          <>
                            <span>Mostrar menos</span>
                            <ChevronUp className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                          </>
                        ) : (
                          <>
                            <span>Ver todos os {stepExplanation.steps.length} passos</span>
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {stepExplanation.finalResult !== undefined && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] flex items-center justify-between font-mono text-xs text-[var(--theme-text-main)]">
                      <span className="text-[var(--theme-text-main)] font-bold">Resultado Final:</span>
                      <span className="text-base font-bold text-[var(--theme-text-main)] tabular-nums">
                        {stepExplanation.finalResult}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Python Operators Quick Guide - Accordion */}
        <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
          <button
            type="button"
            id="python-operators-header"
            aria-expanded={isOperatorsOpen}
            aria-controls="python-operators-content"
            onClick={() => setIsOperatorsOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOperatorsOpen((prev) => !prev);
              }
            }}
            className="w-full flex items-center justify-between text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] rounded-lg cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[var(--theme-text-main)]" />
              <h3 className="text-sm font-bold text-[var(--theme-text-main)] transition-colors">
                Operadores Matemáticos em Python
              </h3>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--theme-text-main)] transition-transform duration-300 ease-in-out ${
                isOperatorsOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          <div
            id="python-operators-content"
            role="region"
            aria-labelledby="python-operators-header"
            className={`grid transition-all duration-300 ease-in-out ${
              isOperatorsOpen
                ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-[rgba(255,255,255,0.2)]'
                : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="divide-y divide-[rgba(255,255,255,0.2)] text-xs text-[var(--theme-text-secondary)]">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[var(--theme-text-main)] font-mono font-bold">**</span>
                  <span className="text-[var(--theme-text-secondary)]">Potência (ex: <code className="font-mono text-[var(--theme-text-main)] font-semibold">2**3 = 8</code>)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[var(--theme-text-main)] font-mono font-bold">//</span>
                  <span className="text-[var(--theme-text-secondary)]">Divisão inteira (<code className="font-mono text-[var(--theme-text-main)] font-semibold">7//2 = 3</code>)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[var(--theme-text-main)] font-mono font-bold">%</span>
                  <span className="text-[var(--theme-text-secondary)]">Resto da divisão (<code className="font-mono text-[var(--theme-text-main)] font-semibold">7%2 = 1</code>)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[var(--theme-text-main)] font-mono font-bold">math.sqrt(x)</span>
                  <span className="text-[var(--theme-text-secondary)]">Raiz quadrada (<code className="font-mono text-[var(--theme-text-main)] font-semibold">sqrt(16) = 4.0</code>)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[var(--theme-text-main)] font-mono font-bold">math.pi</span>
                  <span className="text-[var(--theme-text-secondary)]">Constante Pi (<code className="font-mono text-[var(--theme-text-main)] font-semibold">3.14159265...</code>)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
