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
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F0B8B8]">
          Scripts Prontos de Calculadora em Python
        </h2>
        <p className="text-sm text-[#A2AE9D] mt-1 max-w-3xl">
          Baixe os arquivos <code className="text-[#F0B8B8] font-mono">.py</code> prontos para executar diretamente na sua máquina local ou use como base para estudos, trabalhos e projetos.
        </p>
      </div>

      {/* Grid of Available Python Scripts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PYTHON_TEMPLATES.map((tpl) => {
          const isExpanded = expandedId === tpl.id;

          return (
            <div
              key={tpl.id}
              className="bg-[#45392F] border border-[#A2AE9D]/30 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#F0B8B8]">
                      {tpl.category} · {tpl.badge}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {tpl.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#2D231B] border border-[#A2AE9D]/30 text-[11px] font-mono text-[#A2AE9D] shrink-0">
                    {tpl.filename}
                  </span>
                </div>

                <p className="text-xs text-[#A2AE9D] mt-2.5 leading-relaxed">
                  {tpl.description}
                </p>

                {/* Code Preview / Expandable */}
                <div className="mt-4">
                  <div className="flex items-center justify-between pb-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                      className="text-xs font-bold text-[#F0B8B8] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>{isExpanded ? 'Recolher código' : 'Ver código fonte'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-[#A2AE9D]">
                      {tpl.code.split('\n').length} linhas
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-3.5 rounded-xl bg-[#2D231B] border border-[#A2AE9D]/30 max-h-60 overflow-y-auto font-mono text-xs text-[#F7EDE8]">
                      <pre className="whitespace-pre">{tpl.code}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#352B23] border-t border-[#A2AE9D]/30 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleCopy(tpl)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#45392F] border border-[#A2AE9D]/40 text-[#FFF5F5] hover:text-white hover:bg-[#C75F71]/25 transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#A2AE9D]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(tpl)}
                  className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#C75F71] hover:bg-[#b34f60] text-white shadow-md shadow-[#C75F71]/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar .py</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide: How to run on your local machine */}
      <div className="bg-[#45392F] border border-[#A2AE9D]/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 pb-4 border-b border-[#A2AE9D]/20">
          <Terminal className="w-5 h-5 text-[#F0B8B8]" />
          <h3 className="text-base font-bold text-[#F0B8B8]">Como Executar o Arquivo no Seu Computador</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
          <div className="p-4 rounded-xl bg-[#2D231B] border border-[#A2AE9D]/30">
            <span className="text-xs font-bold text-[#F0B8B8] font-mono">Passo 1</span>
            <h4 className="text-sm font-bold text-white mt-1">Verifique o Python</h4>
            <p className="text-xs text-[#A2AE9D] mt-2">
              Abra o Terminal (Mac/Linux) ou Prompt de Comando (Windows) e execute:
            </p>
            <div className="mt-2.5 p-2 rounded bg-[#352B23] font-mono text-xs text-[#F0B8B8] font-bold select-all">
              python --version
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2D231B] border border-[#A2AE9D]/30">
            <span className="text-xs font-bold text-[#F0B8B8] font-mono">Passo 2</span>
            <h4 className="text-sm font-bold text-white mt-1">Navegue até o Arquivo</h4>
            <p className="text-xs text-[#A2AE9D] mt-2">
              Vá até a pasta onde você baixou o arquivo (geralmente Downloads):
            </p>
            <div className="mt-2.5 p-2 rounded bg-[#352B23] font-mono text-xs text-[#F0B8B8] font-bold select-all">
              cd Downloads
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#2D231B] border border-[#A2AE9D]/30">
            <span className="text-xs font-bold text-[#F0B8B8] font-mono">Passo 3</span>
            <h4 className="text-sm font-bold text-white mt-1">Execute a Calculadora</h4>
            <p className="text-xs text-[#A2AE9D] mt-2">
              Rode o script baixado com o comando:
            </p>
            <div className="mt-2.5 p-2 rounded bg-[#352B23] font-mono text-xs text-[#F0B8B8] font-bold select-all">
              python calculadora_terminal.py
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[#C75F71]/15 border border-[#C75F71]/30 text-xs text-[#F7EDE8] leading-relaxed">
          <strong className="text-[#F0B8B8]">Dica para a Calculadora Gráfica (<code className="font-mono text-white">calculadora_gui.py</code>):</strong> Ela utiliza a biblioteca padrão <code className="font-mono text-white">tkinter</code>, que já vem pré-instalada com o Python em 99% dos casos no Windows e Mac. No Linux Ubuntu/Debian, caso necessário, instale com <code className="font-mono text-white">sudo apt install python3-tk</code>.
        </div>
      </div>
    </div>
  );
};
