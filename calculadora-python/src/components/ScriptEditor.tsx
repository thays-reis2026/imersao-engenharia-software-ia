/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { pyodideService, PyResult } from '../services/pyodideService';
import { RUNNABLE_SNIPPETS } from '../data/pythonTemplates';
import { Play, RotateCcw, Copy, Check, Download, Terminal, Loader2 } from 'lucide-react';

export const ScriptEditor: React.FC = () => {
  const [selectedSnippetIdx, setSelectedSnippetIdx] = useState<number>(0);
  const [code, setCode] = useState<string>(RUNNABLE_SNIPPETS[0].code);
  const [stdout, setStdout] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectSnippet = (idx: number) => {
    setSelectedSnippetIdx(idx);
    setCode(RUNNABLE_SNIPPETS[idx].code);
    setStdout('');
    setError(null);
    setExecutionTime(null);
  };

  const handleRunScript = async () => {
    if (!code.trim()) return;

    setIsRunning(true);
    setStdout('');
    setError(null);

    try {
      const res: PyResult = await pyodideService.runScript(code);
      setExecutionTime(res.executionTimeMs);

      if (res.success) {
        setStdout(res.stdout || '# Script executado com sucesso (sem saída no console).');
      } else {
        setError(res.error || 'Erro na execução do script');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao executar script');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode(RUNNABLE_SNIPPETS[selectedSnippetIdx].code);
    setStdout('');
    setError(null);
    setExecutionTime(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meu_script_calculadora.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Template Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-[var(--theme-text-main)] whitespace-nowrap">Modelos Prontos:</span>
        {RUNNABLE_SNIPPETS.map((snippet, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectSnippet(idx)}
            className={`px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
              selectedSnippetIdx === idx
                ? 'bg-[#C75F71] text-white font-bold keep-white border-[#C75F71] shadow-sm shadow-[#C75F71]/30'
                : 'bg-[rgba(255,255,255,0.08)] text-[var(--theme-text-main)] border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.14)]'
            }`}
          >
            {snippet.title}
          </button>
        ))}
      </div>

      {/* Editor & Console Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Code Editor Pane */}
        <div className="lg:col-span-7 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[560px]">
          {/* Header */}
          <div className="px-5 py-3 bg-[rgba(255,255,255,0.08)] border-b border-[rgba(255,255,255,0.2)] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[var(--theme-text-main)]">
              editor ~ {RUNNABLE_SNIPPETS[selectedSnippetIdx].title.toLowerCase().replace(/\s+/g, '_')}.py
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--theme-text-main)] rounded-md hover:bg-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--theme-text-main)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />}
                <span className="hidden sm:inline">Copiar</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-[var(--theme-text-main)] rounded-md hover:bg-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                title="Baixar como .py"
              >
                <Download className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                <span className="hidden sm:inline">Baixar .py</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-[var(--theme-text-main)] rounded-md hover:bg-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                title="Restaurar código original"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                <span className="hidden sm:inline">Resetar</span>
              </button>
            </div>
          </div>

          {/* Textarea Code Input */}
          <div className="flex-1 relative bg-[rgba(255,255,255,0.03)]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full p-4 font-mono text-xs sm:text-sm text-[var(--theme-text-main)] bg-transparent resize-none focus:outline-none leading-relaxed placeholder-[var(--theme-text-muted)]"
              placeholder="# Escreva seu script Python aqui..."
            />
          </div>

          {/* Action Bar */}
          <div className="p-3 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.2)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--theme-text-secondary)] font-mono">
              Python 3.12 · Suporta módulos math, statistics, cmath
            </span>

            <button
              onClick={handleRunScript}
              disabled={isRunning || !code.trim()}
              className="px-4 py-2 bg-[#C75F71] hover:bg-[#b34f60] disabled:opacity-50 text-white keep-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#C75F71]/30 flex items-center gap-2 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white keep-white" />
                  <span className="text-white keep-white">Executando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white keep-white" />
                  <span className="text-white keep-white">Executar Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Console Pane */}
        <div className="lg:col-span-5 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[560px]">
          {/* Header */}
          <div className="px-5 py-3 bg-[rgba(255,255,255,0.08)] border-b border-[rgba(255,255,255,0.2)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--theme-text-main)]" />
              <span className="text-xs font-mono font-bold text-[var(--theme-text-main)]">Saída do Console (stdout)</span>
            </div>
            {executionTime !== null && (
              <span className="text-[11px] font-mono text-[var(--theme-text-secondary)] font-medium tabular-nums">
                {executionTime}ms
              </span>
            )}
          </div>

          {/* Output Content */}
          <div className="flex-1 p-4 bg-[rgba(255,255,255,0.03)] font-mono text-xs sm:text-sm overflow-y-auto space-y-2">
            {!stdout && !error && (
              <div className="text-[var(--theme-text-secondary)] italic py-8 text-center text-xs">
                Clique em &quot;Executar Script&quot; para visualizar a saída do console.
              </div>
            )}

            {stdout && (
              <pre className="text-[var(--theme-text-main)] whitespace-pre-wrap leading-relaxed">
                {stdout}
              </pre>
            )}

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-700 dark:text-rose-200 whitespace-pre-wrap text-xs">
                <strong className="font-bold">Erro na Execução:</strong>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.2)] text-[11px] text-[var(--theme-text-secondary)] flex items-center justify-between">
            <span>Terminal CPython integrado</span>
            {stdout && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(stdout);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="text-[var(--theme-text-main)] font-semibold hover:underline transition-colors cursor-pointer"
              >
                Copiar saída
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
