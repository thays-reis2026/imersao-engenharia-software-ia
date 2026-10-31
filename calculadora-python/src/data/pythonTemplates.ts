/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PythonScriptTemplate {
  id: string;
  name: string;
  filename: string;
  category: string;
  description: string;
  badge: string;
  code: string;
}

export const PYTHON_TEMPLATES: PythonScriptTemplate[] = [
  {
    id: 'terminal',
    name: 'Calculadora Interativa de Terminal',
    filename: 'calculadora_terminal.py',
    category: 'CLI / Terminal',
    badge: 'Iniciante a Intermediário',
    description: 'Menu interativo completo no console com operações aritméticas, potência, raiz, histórico e repetição contínua.',
    code: `"""
Calculadora Interativa em Python
Execução via terminal: python calculadora_terminal.py
"""

import math
import sys

def somar(a, b):
    return a + b

def subtrair(a, b):
    return a - b

def multiplicar(a, b):
    return a * b

def dividir(a, b):
    if b == 0:
        raise ZeroDivisionError("Divisão por zero não é permitida.")
    return a / b

def potencia(base, expoente):
    return base ** expoente

def raiz_quadrada(n):
    if n < 0:
        raise ValueError("Não existe raiz quadrada real de número negativo.")
    return math.sqrt(n)

def divisao_inteira(a, b):
    if b == 0:
        raise ZeroDivisionError("Divisão por zero.")
    return a // b

def resto_divisao(a, b):
    if b == 0:
        raise ZeroDivisionError("Divisão por zero.")
    return a % b

def exibir_menu():
    print("\\n" + "=" * 42)
    print("      CALCULADORA EM PYTHON (TERMINAL)    ")
    print("=" * 42)
    print(" [1] Soma (+)")
    print(" [2] Subtração (-)")
    print(" [3] Multiplicação (*)")
    print(" [4] Divisão (/)")
    print(" [5] Potência (**)")
    print(" [6] Raiz Quadrada (√)")
    print(" [7] Divisão Inteira (//)")
    print(" [8] Resto da Divisão (%)")
    print(" [9] Ver Histórico de Cálculos")
    print(" [0] Sair do Programa")
    print("=" * 42)

def obter_numero(mensagem):
    while True:
        try:
            entrada = input(mensagem).strip().replace(',', '.')
            return float(entrada)
        except ValueError:
            print("❌ Erro: Digite um número válido!")

def main():
    historico = []
    print("Bem-vindo à Calculadora em Python!")
    
    while True:
        exibir_menu()
        opcao = input("Escolha uma opção (0-9): ").strip()
        
        if opcao == '0':
            print("\\nObrigado por usar a calculadora! Encerrando...")
            sys.exit(0)
            
        elif opcao == '9':
            print("\\n--- HISTÓRICO DE CÁLCULOS ---")
            if not historico:
                print("Nenhum cálculo realizado ainda.")
            else:
                for idx, item in enumerate(historico, 1):
                    print(f" {idx}. {item}")
            input("\\nPressione ENTER para voltar ao menu...")
            continue
            
        elif opcao in ['1', '2', '3', '4', '5', '7', '8']:
            n1 = obter_numero("Digite o primeiro número: ")
            n2 = obter_numero("Digite o segundo número: ")
            
            try:
                if opcao == '1':
                    res = somar(n1, n2)
                    op_str = f"{n1} + {n2} = {res}"
                elif opcao == '2':
                    res = subtrair(n1, n2)
                    op_str = f"{n1} - {n2} = {res}"
                elif opcao == '3':
                    res = multiplicar(n1, n2)
                    op_str = f"{n1} * {n2} = {res}"
                elif opcao == '4':
                    res = dividir(n1, n2)
                    op_str = f"{n1} / {n2} = {res}"
                elif opcao == '5':
                    res = potencia(n1, n2)
                    op_str = f"{n1} ** {n2} = {res}"
                elif opcao == '7':
                    res = divisao_inteira(n1, n2)
                    op_str = f"{n1} // {n2} = {res}"
                elif opcao == '8':
                    res = resto_divisao(n1, n2)
                    op_str = f"{n1} % {n2} = {res}"
                    
                print(f"\\n✅ Resultado: {op_str}")
                historico.append(op_str)
            except Exception as erro:
                print(f"\\n❌ Erro ao calcular: {erro}")
                
        elif opcao == '6':
            n = obter_numero("Digite o número para calcular a raiz: ")
            try:
                res = raiz_quadrada(n)
                op_str = f"√{n} = {res}"
                print(f"\\n✅ Resultado: {op_str}")
                historico.append(op_str)
            except Exception as erro:
                print(f"\\n❌ Erro ao calcular: {erro}")
        else:
            print("❌ Opção inválida! Escolha um número de 0 a 9.")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'tkinter_gui',
    name: 'Calculadora Gráfica Desktop (Tkinter)',
    filename: 'calculadora_gui.py',
    category: 'Interface Gráfica (GUI)',
    badge: 'Desktop Nativo',
    description: 'Calculadora com janela visual bonita usando Tkinter (já incluso nativamente no Python). Não precisa instalar nada via pip!',
    code: `"""
Calculadora Gráfica em Python com Tkinter
Não requer instalação externa! Basta rodar:
python calculadora_gui.py
"""

import tkinter as tk
from tkinter import font
import math

class CalculadoraGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Calculadora Python")
        self.root.geometry("360x520")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")

        self.expressao = ""
        self.criar_widgets()

    def criar_widgets(self):
        # Display de visualização
        frame_display = tk.Frame(self.root, bg="#0f172a", padx=15, pady=20)
        frame_display.pack(fill="x")

        self.label_expressao = tk.Label(
            frame_display,
            text="",
            font=("Segoe UI", 12),
            fg="#94a3b8",
            bg="#0f172a",
            anchor="e"
        )
        self.label_expressao.pack(fill="x")

        self.display = tk.Entry(
            frame_display,
            font=("Consolas", 28, "bold"),
            fg="#f8fafc",
            bg="#1e293b",
            bd=0,
            justify="right",
            insertbackground="#38bdf8"
        )
        self.display.insert(0, "0")
        self.display.pack(fill="x", ipady=10, pady=(5, 0))

        # Teclado de botões
        frame_botoes = tk.Frame(self.root, bg="#0f172a", padx=15, pady=10)
        frame_botoes.pack(fill="both", expand=True)

        botoes = [
            ('C', 0, 0, '#ef4444'), ('(', 0, 1, '#334155'), (')', 0, 2, '#334155'), ('/', 0, 3, '#f59e0b'),
            ('7', 1, 0, '#1e293b'), ('8', 1, 1, '#1e293b'), ('9', 1, 2, '#1e293b'), ('*', 1, 3, '#f59e0b'),
            ('4', 2, 0, '#1e293b'), ('5', 2, 1, '#1e293b'), ('6', 2, 2, '#1e293b'), ('-', 2, 3, '#f59e0b'),
            ('1', 3, 0, '#1e293b'), ('2', 3, 1, '#1e293b'), ('3', 3, 2, '#1e293b'), ('+', 3, 3, '#f59e0b'),
            ('0', 4, 0, '#1e293b'), ('.', 4, 1, '#1e293b'), ('⌫', 4, 2, '#475569'), ('=', 4, 3, '#10b981'),
            ('^', 5, 0, '#334155'), ('√', 5, 1, '#334155'), ('%', 5, 2, '#334155'), ('//', 5, 3, '#334155')
        ]

        for i in range(6):
            frame_botoes.rowconfigure(i, weight=1)
        for j in range(4):
            frame_botoes.columnconfigure(j, weight=1)

        for (texto, linha, coluna, cor_fundo) in botoes:
            btn = tk.Button(
                frame_botoes,
                text=texto,
                font=("Segoe UI", 13, "bold"),
                fg="#ffffff",
                bg=cor_fundo,
                activebackground="#0284c7",
                activeforeground="#ffffff",
                bd=0,
                cursor="hand2",
                command=lambda t=texto: self.ao_clicar(t)
            )
            btn.grid(row=linha, column=coluna, padx=4, pady=4, sticky="nsew")

    def ao_clicar(self, tecla):
        if tecla == 'C':
            self.expressao = ""
            self.atualizar_display("0")
            self.label_expressao.config(text="")
        elif tecla == '⌫':
            self.expressao = self.expressao[:-1]
            self.atualizar_display(self.expressao if self.expressao else "0")
        elif tecla == '=':
            self.calcular()
        elif tecla == '√':
            try:
                val = eval(self.expressao) if self.expressao else 0
                res = math.sqrt(val)
                self.label_expressao.config(text=f"√({self.expressao})")
                self.expressao = str(round(res, 8))
                self.atualizar_display(self.expressao)
            except Exception:
                self.atualizar_display("Erro")
                self.expressao = ""
        elif tecla == '^':
            self.expressao += "**"
            self.atualizar_display(self.expressao)
        else:
            self.expressao += str(tecla)
            self.atualizar_display(self.expressao)

    def atualizar_display(self, texto):
        self.display.delete(0, tk.END)
        self.display.insert(0, texto)

    def calcular(self):
        try:
            self.label_expressao.config(text=self.expressao + " =")
            # Avaliação segura com escopo restrito de matemática
            resultado = eval(self.expressao, {"__builtins__": None, "math": math}, {})
            if isinstance(resultado, float):
                resultado = round(resultado, 10)
                if resultado.is_integer():
                    resultado = int(resultado)
            self.expressao = str(resultado)
            self.atualizar_display(self.expressao)
        except ZeroDivisionError:
            self.atualizar_display("Divisão por 0")
            self.expressao = ""
        except Exception:
            self.atualizar_display("Erro de Sintaxe")
            self.expressao = ""

if __name__ == "__main__":
    janela = tk.Tk()
    app = CalculadoraGUI(janela)
    janela.mainloop()
`,
  },
  {
    id: 'poo',
    name: 'Calculadora Orientada a Objetos (POO)',
    filename: 'calculadora_poo.py',
    category: 'Arquitetura / POO',
    badge: 'Boas Práticas',
    description: 'Estruturada em classes, com histórico de operações, métodos encapsulados e suporte a encadeamento de métodos.',
    code: `"""
Calculadora Orientada a Objetos em Python
Demonstra encapsulamento, histórico, tratamento de exceções e type hints.
"""

from typing import List, Union
import math

Numero = Union[int, float]

class Calculadora:
    """
    Classe para operações matemáticas com suporte a histórico e encadeamento.
    """
    def __init__(self, valor_inicial: Numero = 0):
        self._valor_atual: float = float(valor_inicial)
        self._historico: List[str] = []

    @property
    def resultado(self) -> float:
        return self._valor_atual

    @property
    def historico(self) -> List[str]:
        return self._historico.copy()

    def zerar(self) -> 'Calculadora':
        self._valor_atual = 0.0
        self._historico.append("Zerar -> 0.0")
        return self

    def somar(self, n: Numero) -> 'Calculadora':
        anterior = self._valor_atual
        self._valor_atual += n
        self._historico.append(f"{anterior} + {n} = {self._valor_atual}")
        return self

    def subtrair(self, n: Numero) -> 'Calculadora':
        anterior = self._valor_atual
        self._valor_atual -= n
        self._historico.append(f"{anterior} - {n} = {self._valor_atual}")
        return self

    def multiplicar(self, n: Numero) -> 'Calculadora':
        anterior = self._valor_atual
        self._valor_atual *= n
        self._historico.append(f"{anterior} * {n} = {self._valor_atual}")
        return self

    def dividir(self, n: Numero) -> 'Calculadora':
        if n == 0:
            raise ZeroDivisionError("Impossível dividir por zero.")
        anterior = self._valor_atual
        self._valor_atual /= n
        self._historico.append(f"{anterior} / {n} = {self._valor_atual}")
        return self

    def potencia(self, expoente: Numero) -> 'Calculadora':
        anterior = self._valor_atual
        self._valor_atual **= expoente
        self._historico.append(f"{anterior} ** {expoente} = {self._valor_atual}")
        return self

    def raiz_quadrada(self) -> 'Calculadora':
        if self._valor_atual < 0:
            raise ValueError("Não é possível calcular raiz quadrada de número negativo.")
        anterior = self._valor_atual
        self._valor_atual = math.sqrt(self._valor_atual)
        self._historico.append(f"√({anterior}) = {self._valor_atual}")
        return self

    def __repr__(self) -> str:
        return f"Calculadora(resultado={self._valor_atual})"


# Exemplo de uso prático:
if __name__ == "__main__":
    calc = Calculadora(10)
    
    # Encadeamento fluente (Fluent Interface)
    calc.somar(15).multiplicar(2).subtrair(10).dividir(4)
    
    print(f"Resultado final: {calc.resultado}")
    print("\\nHistórico de operações:")
    for passo in calc.historico:
        print(f" -> {passo}")
`,
  },
  {
    id: 'cientifica',
    name: 'Calculadora Científica & Estatística',
    filename: 'calculadora_cientifica.py',
    category: 'Avançado / Científico',
    badge: 'Módulos math & statistics',
    description: 'Trigonometria, logaritmos, estatística (média, mediana, desvio padrão), juros compostos e análise combinatória.',
    code: `"""
Calculadora Científica e Estatística em Python
Utiliza bibliotecas nativas 'math' e 'statistics'.
"""

import math
import statistics

def trigonometria(angulo_graus):
    rad = math.radians(angulo_graus)
    return {
        "seno": math.sin(rad),
        "cosseno": math.cos(rad),
        "tangente": math.tan(rad) if not math.isclose(math.cos(rad), 0, abs_tol=1e-9) else "Indefinida"
    }

def estatisticas(dados):
    return {
        "quantidade": len(dados),
        "soma": sum(dados),
        "media": statistics.mean(dados),
        "mediana": statistics.median(dados),
        "desvio_padrao": statistics.stdev(dados) if len(dados) > 1 else 0
    }

def juros_compostos(capital, taxa_mensal_percentual, meses):
    taxa_dec = taxa_mensal_percentual / 100
    montante = capital * ((1 + taxa_dec) ** meses)
    juros = montante - capital
    return {"montante": round(montante, 2), "juros": round(juros, 2)}

# Execução de teste
if __name__ == "__main__":
    print("--- 1. Trigonometria para 45° ---")
    print(trigonometria(45))

    print("\\n--- 2. Estatística de Notas ---")
    notas = [7.5, 8.0, 9.2, 6.4, 8.8, 10.0]
    print(estatisticas(notas))

    print("\\n--- 3. Juros Compostos (R$ 1.000 a 1.5% ao mês por 12 meses) ---")
    print(juros_compostos(1000, 1.5, 12))
`,
  }
];

export const RUNNABLE_SNIPPETS = [
  {
    title: 'Operações Aritméticas e Potência',
    code: `# Teste de operações matemáticas fundamentais
a = 15
b = 4

print(f"Soma: {a} + {b} = {a + b}")
print(f"Subtração: {a} - {b} = {a - b}")
print(f"Multiplicação: {a} * {b} = {a * b}")
print(f"Divisão Real: {a} / {b} = {a / b}")
print(f"Divisão Inteira: {a} // {b} = {a // b}")
print(f"Resto (Módulo): {a} % {b} = {a % b}")
print(f"Potência: {a} ** {b} = {a ** b}")
`
  },
  {
    title: 'Fórmula de Bhaskara (Equação do 2º Grau)',
    code: `import math

def resolver_bhaskara(a, b, c):
    delta = b**2 - 4 * a * c
    print(f"Equação: {a}x² + ({b})x + ({c}) = 0")
    print(f"Delta (Δ) = {delta}")
    
    if delta < 0:
        return "A equação não possui raízes reais."
    elif delta == 0:
        x = -b / (2 * a)
        return f"Raiz única: x = {x}"
    else:
        x1 = (-b + math.sqrt(delta)) / (2 * a)
        x2 = (-b - math.sqrt(delta)) / (2 * a)
        return f"Raízes reais: x1 = {x1}, x2 = {x2}"

# Exemplo: x² - 5x + 6 = 0 (raízes 2 e 3)
resultado = resolver_bhaskara(1, -5, 6)
print(resultado)
`
  },
  {
    title: 'Cálculo de Juros Compostos',
    code: `def calcular_investimento(capital, taxa_anual, anos):
    montante = capital * (1 + taxa_anual / 100) ** anos
    lucro = montante - capital
    return montante, lucro

capital_inicial = 5000.0
taxa = 12.5 # 12.5% ao ano
tempo = 5   # 5 anos

total, rendimento = calcular_investimento(capital_inicial, taxa, tempo)
print(f"Capital Inicial: R$ {capital_inicial:,.2f}")
print(f"Taxa: {taxa}% ao ano por {tempo} anos")
print(f"Montante Acumulado: R$ {total:,.2f}")
print(f"Rendimento Líquido: R$ {rendimento:,.2f}")
`
  },
  {
    title: 'Módulo Estatístico (Média e Desvio Padrão)',
    code: `import statistics

amostra = [12.4, 15.8, 14.2, 19.5, 11.0, 16.7, 18.2]

print("Dados coletados:", amostra)
print(f"Média aritmética: {statistics.mean(amostra):.2f}")
print(f"Mediana: {statistics.median(amostra):.2f}")
print(f"Desvio Padrão Amostral: {statistics.stdev(amostra):.2f}")
print(f"Variância: {statistics.variance(amostra):.2f}")
`
  }
];
