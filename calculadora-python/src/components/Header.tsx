/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Code, Download, Calculator, CheckCircle2, Loader2, Sun, Moon, ChevronDown } from 'lucide-react';
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

const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'calculator', label: 'Calculadora Visual', icon: Calculator },
  { id: 'repl', label: 'Terminal Python', icon: Terminal },
  { id: 'scripts', label: 'Editor de Scripts', icon: Code },
  { id: 'download', label: 'Baixar Arquivos .py', icon: Download },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isEngineReady,
  isEngineLoading,
  onOpenHistory,
  historyCount,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentItem.icon;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close when pressing Esc globally
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen]);

  // Focus item when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && focusedIndex < navItems.length) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      const activeIdx = navItems.findIndex((item) => item.id === activeTab);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(navItems.length - 1);
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number, tabId: ActiveTab) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % navItems.length;
      setFocusedIndex(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + navItems.length) % navItems.length;
      setFocusedIndex(prevIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(navItems.length - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectTab(tabId);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.2)] bg-black/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-[1101px]:px-8 py-2 min-[1101px]:py-0 min-[1101px]:h-16 flex flex-wrap min-[1101px]:flex-nowrap items-center justify-between gap-y-2 gap-x-3 min-[1101px]:gap-6">
        {/* Zone 1: Brand Wordmark & Desktop Dropdown Menu (only screens > 1100px) */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 order-1">
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

          {/* Desktop Dropdown Menu (only screens > 1100px, hidden on <= 1100px) */}
          <div className="desktop-only-menu relative" ref={dropdownRef}>
            <button
              ref={buttonRef}
              type="button"
              id="desktop-nav-menu-button"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-controls="desktop-nav-menu"
              onClick={() => {
                setIsOpen((prev) => !prev);
                if (!isOpen) {
                  const activeIdx = navItems.findIndex((item) => item.id === activeTab);
                  setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
                }
              }}
              onKeyDown={handleButtonKeyDown}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-[var(--theme-text-main)] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.14)] rounded-lg transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75F71]"
            >
              <CurrentIcon className="w-4 h-4 text-[var(--theme-text-main)]" />
              <span>{currentItem.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--theme-text-main)] transition-transform duration-200 ease-in-out ${
                  isOpen ? 'rotate-180' : 'rotate-0'
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Floating Dropdown Panel */}
            {isOpen && (
              <div
                id="desktop-nav-menu"
                role="menu"
                aria-labelledby="desktop-nav-menu-button"
                className="absolute top-full left-0 mt-2 w-56 p-1.5 rounded-xl bg-[var(--theme-header-bg)] backdrop-blur-md border border-[rgba(255,255,255,0.2)] shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="absolute inset-0 rounded-xl bg-[rgba(255,255,255,0.06)] pointer-events-none -z-10" />
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        itemRefs.current[index] = el;
                      }}
                      role="menuitem"
                      type="button"
                      tabIndex={focusedIndex === index ? 0 : -1}
                      onClick={() => handleSelectTab(item.id)}
                      onKeyDown={(e) => handleItemKeyDown(e, index, item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors w-full text-left cursor-pointer focus:outline-none ${
                        isActive
                          ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm shadow-[#C75F71]/30'
                          : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] focus:bg-[rgba(255,255,255,0.14)] font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white keep-white' : 'text-[var(--theme-text-main)]'
                        }`}
                      />
                      <span
                        className={`whitespace-nowrap ${
                          isActive ? 'text-white font-bold keep-white' : 'text-[var(--theme-text-main)]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2 (Tablet: 641px - 1100px): Navigation Links (hidden on > 1100px) */}
        <nav className="tablet-mobile-nav hidden sm:flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full order-3 py-1">
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 order-2">
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
