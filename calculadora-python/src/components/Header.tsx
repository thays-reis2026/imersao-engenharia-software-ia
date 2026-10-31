/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, Code, Download, Calculator, CheckCircle2, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab = 'calculator' | 'repl' | 'scripts' | 'download';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isEngineReady: boolean;
  isEngineLoading: boolean;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isEngineReady,
  isEngineLoading,
  onOpenHistory,
  historyCount,
}) => {
  const { toggleTheme, isDark } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.2)] bg-black/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-[1101px]:px-8 py-2 min-[1101px]:py-0 min-[1101px]:h-16 flex flex-wrap min-[1101px]:flex-nowrap items-center justify-between gap-y-2 gap-x-3 min-[1101px]:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#C75F71] flex items-center justify-center text-white font-bold keep-white shadow-lg shadow-[#C75F71]/30">
            <span className="font-mono text-lg font-black text-white keep-white">Py</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--theme-text-main)] whitespace-nowrap">
              Calculadora Python
            </h1>
          </div>
        </div>

        {/* Zone 2: Navigation Links (wrap on tablet or desktop single-row) */}
        <nav className="hidden sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3 min-[1101px]:gap-2 w-full min-[1101px]:w-auto order-3 min-[1101px]:order-2 py-1 min-[1101px]:py-0">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm shadow-[#C75F71]/30'
                : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('repl')}
            className={`hidden min-[1101px]:flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'repl'
                ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm shadow-[#C75F71]/30'
                : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Terminal Python</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`hidden min-[1101px]:flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'scripts'
                ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm shadow-[#C75F71]/30'
                : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Editor de Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'download'
                ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm shadow-[#C75F71]/30'
                : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivos .py</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Runtime Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 order-2 min-[1101px]:order-3">
          {/* Status of Python Engine */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[11px] text-[var(--theme-text-main)] font-mono">
            {isEngineLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--theme-text-main)]" />
                <span>Carregando Python...</span>
              </>
            ) : isEngineReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                <span className="font-medium">CPython WASM Ativo</span>
              </>
            ) : (
              <span>Motor Matemático Rápido</span>
            )}
          </div>

          {/* Theme Toggle Button (Dark / Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[var(--theme-text-main)] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.14)] rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[var(--theme-text-main)]" />
                <span className="hidden sm:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[var(--theme-text-main)]" />
                <span className="hidden sm:inline">Escuro</span>
              </>
            )}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[var(--theme-text-main)] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.14)] rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71] cursor-pointer"
            title="Ver histórico de cálculos"
          >
            <span>Histórico</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#C75F71] text-white rounded-full font-mono font-bold keep-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip (balanced 50/50 without Terminal and Editor) */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 gap-2 border-t border-[rgba(255,255,255,0.2)] bg-black/85 text-xs">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-center cursor-pointer ${
            activeTab === 'calculator' ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm' : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculadora Visual</span>
        </button>
        <button
          onClick={() => setActiveTab('download')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-center cursor-pointer ${
            activeTab === 'download' ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm' : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Arquivos .py</span>
        </button>
      </div>
    </header>
  );
};
