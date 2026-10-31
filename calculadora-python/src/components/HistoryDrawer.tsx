/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalculationRecord } from './CalculatorGui';
import { pyodideService, PySessionVariable } from '../services/pyodideService';
import { X, Trash2, Download, Copy, Check, Clock, Variable } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationRecord[];
  onClearHistory: () => void;
  onSelectCalculation: (expr: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectCalculation,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'variables'>('history');
  const [variables, setVariables] = useState<PySessionVariable[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'variables') {
      const vars = pyodideService.getDefinedVariables();
      setVariables(vars);
    }
  }, [isOpen, activeTab, history]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportHistory = () => {
    if (history.length === 0) return;
    const content = history
      .map((h, i) => `[${h.timestamp}] (${h.executionTimeMs}ms)\n${h.expression} = ${h.result}\n`)
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_calculadora_python_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#000000] border-l border-[rgba(255,255,255,0.2)] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.2)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-[rgba(255,255,255,0.06)] rounded-lg border border-[rgba(255,255,255,0.2)]">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm'
                  : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Histórico ({history.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('variables');
                setVariables(pyodideService.getDefinedVariables());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === 'variables'
                  ? 'bg-[#C75F71] text-white font-bold keep-white shadow-sm'
                  : 'text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)]'
              }`}
            >
              <Variable className="w-3.5 h-3.5" />
              <span>Variáveis Python</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === 'history' ? (
            history.length === 0 ? (
              <div className="text-center py-12 text-[var(--theme-text-secondary)] text-xs">
                Nenhum cálculo realizado nesta sessão ainda.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] group transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)] font-mono">
                    <span>{item.timestamp}</span>
                    <span className="tabular-nums">{item.executionTimeMs}ms</span>
                  </div>

                  <div
                    onClick={() => {
                      onSelectCalculation(item.expression);
                      onClose();
                    }}
                    className="font-mono text-xs text-[var(--theme-text-main)] mt-2 cursor-pointer hover:underline transition-colors"
                    title="Clique para carregar esta expressão"
                  >
                    {item.expression}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[rgba(255,255,255,0.2)]">
                    <span className="font-mono text-sm font-bold text-[var(--theme-text-main)] tabular-nums">
                      = {item.result}
                    </span>

                    <button
                      onClick={() => handleCopy(item.result, item.id)}
                      className="p-1 text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] rounded transition-colors cursor-pointer"
                      title="Copiar resultado"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Variables View */
            <div className="space-y-3">
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Variáveis registradas na sessão ativa do interpretador CPython:
              </p>
              {variables.length === 0 ? (
                <div className="text-center py-8 text-[var(--theme-text-secondary)] text-xs">
                  Nenhuma variável personalizada definida.
                </div>
              ) : (
                variables.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] flex items-center justify-between font-mono text-xs text-[var(--theme-text-main)]"
                  >
                    <div>
                      <span className="text-[var(--theme-text-main)] font-bold">{v.name}</span>
                      <span className="text-[var(--theme-text-secondary)] text-[10px] ml-2">({v.type})</span>
                    </div>
                    <span className="text-[var(--theme-text-main)] tabular-nums font-semibold">{v.value}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === 'history' && history.length > 0 && (
          <div className="p-4 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.2)] flex items-center justify-between gap-3">
            <button
              onClick={onClearHistory}
              className="flex-1 py-2 px-3 text-xs font-bold text-white keep-white bg-[#C75F71] rounded-xl hover:bg-[#b34f60] transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-[#C75F71]/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              <span>Limpar Histórico</span>
            </button>

            <button
              onClick={handleExportHistory}
              className="flex-1 py-2 px-3 text-xs font-bold text-[var(--theme-text-main)] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.2)] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
              <span>Exportar .txt</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
