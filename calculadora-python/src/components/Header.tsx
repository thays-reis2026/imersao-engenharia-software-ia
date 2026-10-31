/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Terminal, Code, Download, Calculator, CheckCircle2, Loader2 } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-40 border-b border-[#A2AE9D]/30 bg-[#54463A]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-[1101px]:px-8 py-2 min-[1101px]:py-0 min-[1101px]:h-16 flex flex-wrap min-[1101px]:flex-nowrap items-center justify-between gap-y-2 gap-x-3 min-[1101px]:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#C75F71] flex items-center justify-center text-white font-bold shadow-lg shadow-[#C75F71]/30">
            <span className="font-mono text-lg font-black">Py</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#F0B8B8] whitespace-nowrap">
              Calculadora Python
            </h1>
          </div>
        </div>

        {/* Zone 2: Navigation Links (wrap on tablet or desktop single-row) */}
        <nav className="hidden sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3 min-[1101px]:gap-2 w-full min-[1101px]:w-auto order-3 min-[1101px]:order-2 py-1 min-[1101px]:py-0">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'calculator'
                ? 'bg-[#C75F71] text-white font-bold shadow-sm shadow-[#C75F71]/30'
                : 'text-[#A2AE9D] hover:text-[#F0B8B8] hover:bg-[#43372E]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora Visual</span>
          </button>

          <button
            onClick={() => setActiveTab('repl')}
            className={`hidden min-[1101px]:flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'repl'
                ? 'bg-[#C75F71] text-white font-bold shadow-sm shadow-[#C75F71]/30'
                : 'text-[#A2AE9D] hover:text-[#F0B8B8] hover:bg-[#43372E]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Terminal Python</span>
          </button>

          <button
            onClick={() => setActiveTab('scripts')}
            className={`hidden min-[1101px]:flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'scripts'
                ? 'bg-[#C75F71] text-white font-bold shadow-sm shadow-[#C75F71]/30'
                : 'text-[#A2AE9D] hover:text-[#F0B8B8] hover:bg-[#43372E]'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Editor de Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'download'
                ? 'bg-[#C75F71] text-white font-bold shadow-sm shadow-[#C75F71]/30'
                : 'text-[#A2AE9D] hover:text-[#F0B8B8] hover:bg-[#43372E]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivos .py</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Runtime Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 order-2 min-[1101px]:order-3">
          {/* Status of Python Engine */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#43372E] border border-[#A2AE9D]/30 text-[11px] text-[#A2AE9D] font-mono">
            {isEngineLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F0B8B8]" />
                <span>Carregando Python...</span>
              </>
            ) : isEngineReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A2AE9D]" />
                <span className="text-[#F0B8B8] font-medium">CPython WASM Ativo</span>
              </>
            ) : (
              <span>Motor Matemático Rápido</span>
            )}
          </div>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-[#43372E] border border-[#A2AE9D]/40 rounded-lg hover:border-[#C75F71] hover:bg-[#C75F71]/20 transition-colors whitespace-nowrap shrink-0"
            title="Ver histórico de cálculos"
          >
            <span className="text-[#F0B8B8]">Histórico</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#C75F71] text-white rounded-full font-mono font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tab Strip (balanced 50/50 without Terminal and Editor) */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 gap-2 border-t border-[#A2AE9D]/20 bg-[#4A3E34] text-xs">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-center ${
            activeTab === 'calculator' ? 'bg-[#C75F71] text-white font-bold shadow-sm' : 'text-[#A2AE9D] hover:text-[#FFF5F5]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculadora Visual</span>
        </button>
        <button
          onClick={() => setActiveTab('download')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-center ${
            activeTab === 'download' ? 'bg-[#C75F71] text-white font-bold shadow-sm' : 'text-[#A2AE9D] hover:text-[#FFF5F5]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Arquivos .py</span>
        </button>
      </div>
    </header>
  );
};
