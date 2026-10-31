/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PYTHON_TEMPLATES, PythonScriptTemplate } from '../data/pythonTemplates';
import { Download, Copy, Check, ChevronDown, ChevronUp, Code2, Terminal, Monitor, Laptop } from 'lucide-react';

export const DownloadScriptsTab: React.FC = () => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(PYTHON_TEMPLATES[0].id);
  const [expandedId, setExpandedId] = useState<string | null>(PYTHON_TEMPLATES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDownload = (script: PythonScriptTemplate) => {
    const blob = new Blob([script.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = script.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (script: PythonScriptTemplate) => {
    navigator.clipboard.writeText(script.code);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--theme-text-main)]">
          Scripts Prontos de Calculadora em Python
        </h2>
        <p className="text-sm text-[var(--theme-text-secondary)] mt-1 max-w-3xl">
          Baixe os arquivos <code className="text-[var(--theme-text-main)] font-mono font-bold">.py</code> prontos para executar diretamente na sua máquina local ou use como base para estudos, trabalhos e projetos.
        </p>
      </div>

      {/* Grid of Available Python Scripts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PYTHON_TEMPLATES.map((tpl) => {
          const isExpanded = expandedId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[var(--theme-text-secondary)]">
                      {tpl.category} · {tpl.badge}
                    </span>
                    <h3 className="text-base font-bold text-[var(--theme-text-main)] mt-1">
                      {tpl.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[11px] font-mono text-[var(--theme-text-secondary)] shrink-0">
                    {tpl.filename}
                  </span>
                </div>

                <p className="text-xs text-[var(--theme-text-secondary)] mt-2.5 leading-relaxed">
                  {tpl.description}
                </p>

                {/* Code Preview / Expandable */}
                <div className="mt-4">
                  <div className="flex items-center justify-between pb-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                      className="text-xs font-bold text-[var(--theme-text-main)] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Recolher código' : 'Ver código fonte'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-[var(--theme-text-secondary)]">
                      {tpl.code.split('\n').length} linhas
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-3.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] max-h-60 overflow-y-auto font-mono text-xs text-[var(--theme-text-main)]">
                      <pre className="whitespace-pre">{tpl.code}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.2)] flex items-center justify-between gap-3">
                <button
                  onClick={() => handleCopy(tpl)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.2)] text-[var(--theme-text-main)] hover:bg-[rgba(255,255,255,0.14)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[var(--theme-text-main)]" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(tpl)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white keep-white shadow-md shadow-[#C75F71]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-white keep-white" />
                  <span>Baixar .py</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide: How to run on your local machine */}
      <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[rgba(255,255,255,0.2)]">
          <Terminal className="w-5 h-5 text-[var(--theme-text-main)]" />
          <h3 className="text-base font-bold text-[var(--theme-text-main)]">Como Executar o Arquivo no Seu Computador</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)]">
            <span className="text-xs font-bold text-[var(--theme-text-secondary)] font-mono">Passo 1</span>
            <h4 className="text-sm font-bold text-[var(--theme-text-main)] mt-1">Verifique o Python</h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-2">
              Abra o Terminal (Mac/Linux) ou Prompt de Comando (Windows) e execute:
            </p>
            <div className="mt-2.5 p-2 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] font-mono text-xs text-[var(--theme-text-main)] font-bold select-all">
              python --version
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)]">
            <span className="text-xs font-bold text-[var(--theme-text-secondary)] font-mono">Passo 2</span>
            <h4 className="text-sm font-bold text-[var(--theme-text-main)] mt-1">Navegue até o Arquivo</h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-2">
              Vá até a pasta onde você baixou o arquivo (geralmente Downloads):
            </p>
            <div className="mt-2.5 p-2 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] font-mono text-xs text-[var(--theme-text-main)] font-bold select-all">
              cd Downloads
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)]">
            <span className="text-xs font-bold text-[var(--theme-text-secondary)] font-mono">Passo 3</span>
            <h4 className="text-sm font-bold text-[var(--theme-text-main)] mt-1">Execute a Calculadora</h4>
            <p className="text-xs text-[var(--theme-text-secondary)] mt-2">
              Rode o script baixado com o comando:
            </p>
            <div className="mt-2.5 p-2 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] font-mono text-xs text-[var(--theme-text-main)] font-bold select-all">
              python calculadora_terminal.py
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.2)] text-xs text-[var(--theme-text-secondary)] leading-relaxed">
          <strong className="text-[var(--theme-text-main)]">Dica para a Calculadora Gráfica (<code className="font-mono text-[var(--theme-text-main)] font-semibold">calculadora_gui.py</code>):</strong> Ela utiliza a biblioteca padrão <code className="font-mono text-[var(--theme-text-main)] font-semibold">tkinter</code>, que já vem pré-instalada com o Python em 99% dos casos no Windows e Mac. No Linux Ubuntu/Debian, caso necessário, instale com <code className="font-mono text-[var(--theme-text-main)] font-semibold">sudo apt install python3-tk</code>.
        </div>
      </div>
    </div>
  );
};
