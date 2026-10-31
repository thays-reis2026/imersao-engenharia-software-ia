/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { pyodideService, PyResult } from '../services/pyodideService';
import { Terminal, CornerDownLeft, Trash2, Copy, Check } from 'lucide-react';

interface ReplEntry {
  id: string;
  command: string;
  stdout: string;
  result: string;
  error?: string;
  timeMs: number;
}

interface PythonReplProps {
  initialCommand?: string;
}

export const PythonRepl: React.FC<PythonReplProps> = ({ initialCommand }) => {
  const [history, setHistory] = useState<ReplEntry[]>([
    {
      id: 'welcome',
      command: '# Interpretador Interativo Python 3.12 (CPython WASM)',
      stdout: 'Ambiente pronto! Digite cálculos ou comandos Python e pressione Enter.\nExemplo: math.sqrt(144) + 2**5',
      result: '',
      timeMs: 0,
    },
  ]);
  const [currentInput, setCurrentInput] = useState<string>(initialCommand || '');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCommand) {
      setCurrentInput(initialCommand);
      inputRef.current?.focus();
    }
  }, [initialCommand]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun !== undefined ? cmdToRun : currentInput).trim();
    if (!cmd) return;

    setIsRunning(true);
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    try {
      const res: PyResult = await pyodideService.execute(cmd);

      const newEntry: ReplEntry = {
        id: Math.random().toString(36).substring(2, 9),
        command: cmd,
        stdout: res.stdout,
        result: res.result,
        error: res.error,
        timeMs: res.executionTimeMs,
      };

      setHistory((prev) => [...prev, newEntry]);
      setCurrentInput('');
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: cmd,
          stdout: '',
          result: '',
          error: err?.message || 'Erro na execução',
          timeMs: 0,
        },
      ]);
    } finally {
      setIsRunning(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex =
        historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCurrentInput(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const handleClearTerminal = () => {
    setHistory([]);
    setCurrentInput('');
  };

  const handleCopyEntry = (entry: ReplEntry) => {
    const text = `>>> ${entry.command}\n${entry.stdout ? entry.stdout + '\n' : ''}${entry.result ? entry.result : ''}${entry.error ? entry.error : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const quickSnippets = [
    { label: 'Raiz quadrada', code: 'math.sqrt(256)' },
    { label: 'Fatorial de 10', code: 'math.factorial(10)' },
    { label: 'Lista ao quadrado', code: '[x**2 for x in range(1, 11)]' },
    { label: 'Média de notas', code: 'statistics.mean([7.5, 8.8, 9.2, 6.0])' },
    { label: 'Definir função IMC', code: 'def imc(peso, alt): return round(peso / (alt**2), 2)\nimc(72, 1.75)' },
  ];

  return (
    <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
      {/* Terminal Title Bar */}
      <div className="px-5 py-3 bg-[rgba(255,255,255,0.08)] border-b border-[rgba(255,255,255,0.2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#C75F71]"></div>
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.4)]"></div>
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.2)]"></div>
          </div>
          <Terminal className="w-4 h-4 text-[var(--theme-text-main)]" />
          <span className="text-xs font-mono font-medium text-[var(--theme-text-main)]">
            terminal-python ~ cpython-repl
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearTerminal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] rounded-md transition-colors cursor-pointer"
            title="Limpar terminal"
          >
            <Trash2 className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {/* Quick Snippet Chips */}
      <div className="px-4 py-2 bg-[rgba(255,255,255,0.06)] border-b border-[rgba(255,255,255,0.2)] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[var(--theme-text-secondary)] text-[11px] font-mono whitespace-nowrap">Comandos rápidos:</span>
        {quickSnippets.map((snip, idx) => (
          <button
            key={idx}
            onClick={() => handleRunCommand(snip.code)}
            className="px-2.5 py-1 rounded bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer"
          >
            {snip.label}
          </button>
        ))}
      </div>

      {/* Terminal Content Body (bloco de código com rgba(255,255,255,0.03)) */}
      <div
        className="flex-1 p-4 sm:p-6 overflow-y-auto font-mono text-xs sm:text-sm space-y-4 bg-[rgba(255,255,255,0.03)] text-[var(--theme-text-main)]"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry) => (
          <div key={entry.id} className="group relative">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 text-[var(--theme-text-main)]">
                <span className="text-[var(--theme-text-main)] select-none font-bold">&gt;&gt;&gt;</span>
                <span className="font-semibold text-[var(--theme-text-main)] whitespace-pre-wrap">{entry.command}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyEntry(entry);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] rounded transition-opacity cursor-pointer"
                title="Copiar linha"
              >
                {copiedId === entry.id ? (
                  <Check className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                )}
              </button>
            </div>

            {/* stdout (from print calls) */}
            {entry.stdout && (
              <div className="mt-1 pl-6 text-[var(--theme-text-secondary)] whitespace-pre-wrap leading-relaxed">
                {entry.stdout}
              </div>
            )}

            {/* evaluated return value */}
            {entry.result && (
              <div className="mt-1 pl-6 text-[var(--theme-text-main)] font-bold tabular-nums">
                {entry.result}
              </div>
            )}

            {/* error traceback */}
            {entry.error && (
              <div className="mt-1 pl-6 text-rose-700 dark:text-rose-200 whitespace-pre-wrap bg-rose-500/15 p-2 rounded border border-rose-500/40">
                {entry.error}
              </div>
            )}
          </div>
        ))}

        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input Line */}
      <div className="p-3 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.2)] flex items-center gap-2">
        <span className="text-[var(--theme-text-main)] font-mono font-bold pl-2 select-none">&gt;&gt;&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite um cálculo ou código Python (ex: sum([x**2 for x in range(5)]))"
          disabled={isRunning}
          className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-[var(--theme-text-main)] placeholder-[var(--theme-text-muted)] focus:outline-none"
        />
        <button
          onClick={() => handleRunCommand()}
          disabled={isRunning || !currentInput.trim()}
          className="px-4 py-2 bg-[#C75F71] hover:bg-[#b34f60] disabled:opacity-40 text-white keep-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-[#C75F71]/30 cursor-pointer"
        >
          <span className="text-white keep-white">Executar</span>
          <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5] text-white keep-white" />
        </button>
      </div>
    </div>
  );
};
