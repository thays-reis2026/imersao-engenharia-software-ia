/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { CalculatorGui, CalculationRecord } from './components/CalculatorGui';
import { PythonRepl } from './components/PythonRepl';
import { ScriptEditor } from './components/ScriptEditor';
import { DownloadScriptsTab } from './components/DownloadScriptsTab';
import { HistoryDrawer } from './components/HistoryDrawer';
import { pyodideService } from './services/pyodideService';
import { Terminal, Code, Download, Calculator, Check, Zap, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [isEngineLoading, setIsEngineLoading] = useState<boolean>(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [replInitialCode, setReplInitialCode] = useState<string>('');

  // Persistent calculation history stored in localStorage
  const [history, setHistory] = useState<CalculationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('py_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initialize Pyodide WebAssembly in the background
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await pyodideService.initPyodide();
        if (mounted) {
          setIsEngineReady(pyodideService.isEngineReady());
          setIsEngineLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setIsEngineReady(false);
          setIsEngineLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('py_calc_history', JSON.stringify(history.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [history]);

  const handleAddHistory = (record: CalculationRecord) => {
    setHistory((prev) => [record, ...prev].slice(0, 50));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('py_calc_history');
    } catch {
      // ignore
    }
  };

  const handleNavigateToRepl = (code?: string) => {
    if (code) {
      setReplInitialCode(code);
    }
    setActiveTab('repl');
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg-page)] text-[var(--theme-text-main)] flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Top Bar following design contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEngineReady={isEngineReady}
        isEngineLoading={isEngineLoading}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 min-[1101px]:px-8 pt-4 pb-0 sm:py-8">
        {/* Subtle Breadcrumb / Category Metadata - Mobile: Short single line without breaking */}
        <div className="flex sm:hidden items-center gap-2 text-xs text-[var(--theme-text-secondary)] mb-6 font-mono whitespace-nowrap overflow-x-auto">
          <span>Python 3.12</span>
          <span aria-hidden="true">·</span>
          <span>WASM</span>
        </div>

        {/* Subtle Breadcrumb / Category Metadata - Desktop: Full text line */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--theme-text-secondary)] mb-6 font-mono">
          <span>Python 3.12</span>
          <span aria-hidden="true">·</span>
          <span>Interpretador WebAssembly (WASM)</span>
          <span aria-hidden="true">·</span>
          <span className="text-[var(--theme-text-main)] font-bold">
            {activeTab === 'calculator' && 'Calculadora Científica Visual'}
            {activeTab === 'repl' && 'Terminal Interativo REPL'}
            {activeTab === 'scripts' && 'Editor e Executor de Scripts'}
            {activeTab === 'download' && 'Download de Códigos .py'}
          </span>
        </div>

        {/* Tab Views */}
        {activeTab === 'calculator' && (
          <CalculatorGui
            onAddHistory={handleAddHistory}
            onNavigateToRepl={handleNavigateToRepl}
          />
        )}

        {activeTab === 'repl' && (
          <PythonRepl initialCommand={replInitialCode} />
        )}

        {activeTab === 'scripts' && (
          <ScriptEditor />
        )}

        {activeTab === 'download' && (
          <DownloadScriptsTab />
        )}
      </main>

      {/* History and Variable Inspection Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectCalculation={(expr) => {
          // Can load directly in calculator
          setActiveTab('calculator');
        }}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] py-5 sm:py-6 mt-5 sm:mt-12 text-center text-xs text-[var(--theme-text-secondary)] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 min-[1101px]:px-8">
          {/* Mobile Footer (<= 640px): Stacked, centered lines without dots, only Baixar Scripts .py */}
          <div className="flex sm:hidden flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-[var(--theme-text-main)] font-bold">Python Calculator Engine</span>
            <span>Execução local e segura no navegador</span>
            <div className="flex items-center justify-center pt-1 text-[var(--theme-text-main)]">
              <button
                onClick={() => setActiveTab('download')}
                className="hover:underline transition-colors cursor-pointer"
              >
                Baixar Scripts .py
              </button>
            </div>
          </div>

          {/* Tablet (641px - 1100px) & Desktop (> 1100px) Footer: Horizontal line with left text and right links */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--theme-text-main)] font-bold">Python Calculator Engine</span>
              <span>·</span>
              <span>Execução local e segura no navegador</span>
            </div>

            <div className="flex items-center gap-4 text-[var(--theme-text-main)]">
              <button
                onClick={() => setActiveTab('download')}
                className="hover:underline transition-colors cursor-pointer"
              >
                Baixar Scripts .py
              </button>
              <span className="hidden min-[1101px]:inline text-[var(--theme-text-secondary)]">·</span>
              <button
                onClick={() => setActiveTab('repl')}
                className="hidden min-[1101px]:inline hover:underline transition-colors cursor-pointer"
              >
                Terminal REPL
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
