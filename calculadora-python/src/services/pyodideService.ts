/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Service to manage Python execution via Pyodide (CPython in WebAssembly)
// with instant fallback mathematical evaluator.

export interface PyResult {
  success: boolean;
  result: string;
  stdout: string;
  error?: string;
  executionTimeMs: number;
}

export interface PySessionVariable {
  name: string;
  type: string;
  value: string;
}

class PyodideManager {
  private pyodide: any = null;
  private isLoading = false;
  private isReady = false;
  private loadPromise: Promise<any> | null = null;
  private memoryValue = 0;
  private lastAnswer: any = 0;

  constructor() {
    this.initPyodide();
  }

  public async initPyodide(): Promise<any> {
    if (this.isReady && this.pyodide) return this.pyodide;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Check if script tag is already in DOM
        if (!(window as any).loadPyodide) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          script.async = true;
          document.head.appendChild(script);

          await new Promise((res, rej) => {
            script.onload = res;
            script.onerror = () => rej(new Error('Falha ao carregar script do Pyodide CDN'));
          });
        }

        const loadPyodide = (window as any).loadPyodide;
        if (!loadPyodide) {
          throw new Error('Função loadPyodide não encontrada');
        }

        const py = await loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });

        // Initialize standard environment
        await py.runPythonAsync(`
import sys
import io
import math
import cmath
import statistics
import random
from decimal import Decimal
from fractions import Fraction

# Setup context for calculator
_ans = 0
_mem = 0
_deg_mode = False

_orig_sin = math.sin
_orig_cos = math.cos
_orig_tan = math.tan

def _clean_trig_val(val):
    if abs(val) < 1e-15:
        return 0
    rounded = round(val, 10)
    if abs(val - rounded) < 1e-12:
        return int(rounded) if (isinstance(rounded, float) and rounded.is_integer()) else rounded
    return rounded

def _calc_sin(x):
    if _deg_mode:
        rad = (x * math.pi) / 180.0
        val = _orig_sin(rad)
        return _clean_trig_val(val)
    return _orig_sin(x)

def _calc_cos(x):
    if _deg_mode:
        rad = (x * math.pi) / 180.0
        val = _orig_cos(rad)
        return _clean_trig_val(val)
    return _orig_cos(x)

def _calc_tan(x):
    if _deg_mode:
        rad = (x * math.pi) / 180.0
        cos_val = _orig_cos(rad)
        if abs(cos_val) < 1e-15:
            raise ZeroDivisionError("math range error (tangente indefinida)")
        val = _orig_tan(rad)
        return _clean_trig_val(val)
    return _orig_tan(x)

math.sin = _calc_sin
math.cos = _calc_cos
math.tan = _calc_tan
sin = _calc_sin
cos = _calc_cos
tan = _calc_tan
`);

        this.pyodide = py;
        this.isReady = true;
        this.isLoading = false;
        resolve(py);
      } catch (err) {
        console.warn('Pyodide CDN initialization error, fallback evaluator will be used:', err);
        this.isLoading = false;
        // Don't reject completely so the app remains functional with fallback
        resolve(null);
      }
    });

    return this.loadPromise;
  }

  public isEngineReady(): boolean {
    return this.isReady && this.pyodide !== null;
  }

  public isEngineLoading(): boolean {
    return this.isLoading;
  }

  public setDegMode(deg: boolean) {
    if (this.isReady && this.pyodide) {
      try {
        this.pyodide.runPython(`_deg_mode = ${deg ? 'True' : 'False'}`);
      } catch {
        // ignore
      }
    }
  }

  public setMemory(val: number) {
    this.memoryValue = val;
    if (this.isReady && this.pyodide) {
      try {
        this.pyodide.runPython(`_mem = ${val}`);
      } catch {
        // ignore
      }
    }
  }

  public getMemory(): number {
    return this.memoryValue;
  }

  public getLastAnswer(): any {
    return this.lastAnswer;
  }

  /**
   * Executes a Python expression or statement.
   * If Pyodide is loaded, runs real Python.
   * If not, uses secure instant JS math evaluator for quick results.
   */
  public async execute(code: string, isDegreeMode = false): Promise<PyResult> {
    const startTime = performance.now();

    if (!code || !code.trim()) {
      return {
        success: true,
        result: '',
        stdout: '',
        executionTimeMs: 0,
      };
    }

    if (this.isReady && this.pyodide) {
      try {
        // Setup stdout redirection and pass current angle mode
        const wrapper = `
import sys
import io

_deg_mode = ${isDegreeMode ? 'True' : 'False'}
__stdout_capture = io.StringIO()
sys.stdout = __stdout_capture

__exec_result = None
try:
    # First try eval
    __code_str = """${code.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"') }"""
    try:
        __exec_result = eval(__code_str)
        if __exec_result is not None:
            _ans = __exec_result
    except SyntaxError:
        # If syntax error, it might be a statement (e.g. assignment or def)
        exec(__code_str)
        __exec_result = None
except Exception as e:
    sys.stdout = sys.__stdout__
    raise e

sys.stdout = sys.__stdout__
__output_val = __stdout_capture.getvalue()
`;
        await this.pyodide.runPythonAsync(wrapper);

        const execResult = this.pyodide.globals.get('__exec_result');
        const stdout = this.pyodide.globals.get('__output_val') || '';

        let resultStr = '';
        if (execResult !== undefined && execResult !== null) {
          if (isDegreeMode && typeof execResult === 'number') {
            if (Math.abs(execResult) < 1e-15) {
              resultStr = '0';
            } else if (Number.isInteger(execResult)) {
              resultStr = execResult.toString();
            } else {
              const rounded = Math.round(execResult * 1e10) / 1e10;
              resultStr = Math.abs(execResult - rounded) < 1e-12 ? rounded.toString() : String(execResult);
            }
          } else {
            resultStr = String(execResult);
          }
          this.lastAnswer = execResult;
        }

        const endTime = performance.now();
        return {
          success: true,
          result: resultStr,
          stdout: String(stdout).trim(),
          executionTimeMs: Math.round(endTime - startTime),
        };
      } catch (err: any) {
        const endTime = performance.now();
        const errMessage = err?.message || String(err);
        // Clean Python traceback if too long
        const cleaned = this.formatPythonError(errMessage);
        return {
          success: false,
          result: '',
          stdout: '',
          error: cleaned,
          executionTimeMs: Math.round(endTime - startTime),
        };
      }
    }

    // Fallback: Instant JS mathematical evaluation
    try {
      const res = this.evaluateFallback(code, isDegreeMode);
      this.lastAnswer = res;
      const endTime = performance.now();
      return {
        success: true,
        result: String(res),
        stdout: '',
        executionTimeMs: Math.round(endTime - startTime),
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        success: false,
        result: '',
        stdout: '',
        error: err.message || 'Erro de sintaxe',
        executionTimeMs: Math.round(endTime - startTime),
      };
    }
  }

  /**
   * Executes a full multi-line Python script and captures output.
   */
  public async runScript(script: string): Promise<PyResult> {
    const startTime = performance.now();
    await this.initPyodide();

    if (!this.isReady || !this.pyodide) {
      return {
        success: false,
        result: '',
        stdout: '',
        error: 'O interpretador Python está carregando... Aguarde um instante.',
        executionTimeMs: 0,
      };
    }

    try {
      const wrapper = `
import sys
import io

__stdout_capture = io.StringIO()
sys.stdout = __stdout_capture
sys.stderr = __stdout_capture

try:
    __script_to_run = """${script.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"') }"""
    exec(__script_to_run)
except Exception as e:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
    raise e

sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
__output_val = __stdout_capture.getvalue()
`;
      await this.pyodide.runPythonAsync(wrapper);
      const stdout = this.pyodide.globals.get('__output_val') || '';
      const endTime = performance.now();

      return {
        success: true,
        result: '',
        stdout: String(stdout),
        executionTimeMs: Math.round(endTime - startTime),
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        success: false,
        result: '',
        stdout: '',
        error: this.formatPythonError(err?.message || String(err)),
        executionTimeMs: Math.round(endTime - startTime),
      };
    }
  }

  /**
   * Inspect current Python global variables
   */
  public getDefinedVariables(): PySessionVariable[] {
    if (!this.isReady || !this.pyodide) {
      return [
        { name: 'ans', type: 'float', value: String(this.lastAnswer) },
        { name: '_mem', type: 'float', value: String(this.memoryValue) },
        { name: 'pi', type: 'float', value: String(Math.PI) },
        { name: 'e', type: 'float', value: String(Math.E) },
      ];
    }

    try {
      const varsJson = this.pyodide.runPython(`
import json

_vars = []
_ignored = {
    'sys', 'io', 'math', 'cmath', 'statistics', 'random', 'Decimal', 'Fraction',
    '__name__', '__doc__', '__package__', '__loader__', '__spec__', '__annotations__',
    '__builtins__', '__stdout_capture', '__output_val', '__exec_result', '__code_str',
    '__script_to_run', '_vars', '_ignored', 'json',
    '_orig_sin', '_orig_cos', '_orig_tan', '_clean_trig_val', '_calc_sin', '_calc_cos', '_calc_tan',
    '_deg_mode', 'sin', 'cos', 'tan'
}

for k, v in list(globals().items()):
    if k not in _ignored and not k.startswith('__'):
        try:
            val_str = repr(v)
            if len(val_str) > 40:
                val_str = val_str[:37] + '...'
            _vars.append({'name': k, 'type': type(v).__name__, 'value': val_str})
        except:
            pass

json.dumps(_vars)
`);
      return JSON.parse(varsJson);
    } catch {
      return [
        { name: '_ans', type: 'float', value: String(this.lastAnswer) },
        { name: '_mem', type: 'float', value: String(this.memoryValue) },
      ];
    }
  }

  private formatPythonError(rawErr: string): string {
    const lines = rawErr.split('\n');
    const filtered = lines.filter(l => !l.includes('pyodide') && !l.includes('File "<exec>"') && !l.includes('File "<string>"'));
    return filtered.slice(-3).join('\n') || rawErr;
  }

  private evaluateFallback(code: string, isDegreeMode: boolean): number | string {
    // Replace common Python syntax with JS equivalents for immediate evaluation
    let sanitized = code.trim();

    // Handle variables
    sanitized = sanitized.replace(/\bans\b/g, String(this.lastAnswer));
    sanitized = sanitized.replace(/\b_ans\b/g, String(this.lastAnswer));
    sanitized = sanitized.replace(/\b_mem\b/g, String(this.memoryValue));

    // Python constants
    sanitized = sanitized.replace(/math\.pi/g, String(Math.PI));
    sanitized = sanitized.replace(/math\.e/g, String(Math.E));
    sanitized = sanitized.replace(/\bpi\b/gi, String(Math.PI));
    sanitized = sanitized.replace(/\be\b/g, String(Math.E));

    // Python operators
    // Integer division //
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\/\/\s*(\d+(?:\.\d+)?)/g, 'Math.floor($1 / $2)');
    // Power **
    sanitized = sanitized.replace(/(\d+(?:\.\d+)?|\([^)]+\))\s*\*\*\s*(\d+(?:\.\d+)?|\([^)]+\))/g, 'Math.pow($1, $2)');

    // Math functions
    sanitized = sanitized.replace(/math\.sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
    sanitized = sanitized.replace(/math\.log10\(([^)]+)\)/g, 'Math.log10($1)');
    sanitized = sanitized.replace(/math\.log\(([^)]+)\)/g, 'Math.log($1)');
    sanitized = sanitized.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');
    sanitized = sanitized.replace(/math\.factorial\(([^)]+)\)/g, 'factorial($1)');

    const cleanTrig = (v: number) => {
      if (Math.abs(v) < 1e-15) return 0;
      const rounded = Math.round(v * 1e10) / 1e10;
      return Math.abs(v - rounded) < 1e-12 ? (Number.isInteger(rounded) ? Math.round(rounded) : rounded) : v;
    };

    const _sin = (x: number) => {
      if (isDegreeMode) {
        return cleanTrig(Math.sin((x * Math.PI) / 180));
      }
      return Math.sin(x);
    };

    const _cos = (x: number) => {
      if (isDegreeMode) {
        return cleanTrig(Math.cos((x * Math.PI) / 180));
      }
      return Math.cos(x);
    };

    const _tan = (x: number) => {
      if (isDegreeMode) {
        const c = Math.cos((x * Math.PI) / 180);
        if (Math.abs(c) < 1e-15) throw new Error('Tangente indefinida (divisão por zero)');
        return cleanTrig(Math.tan((x * Math.PI) / 180));
      }
      return Math.tan(x);
    };

    sanitized = sanitized.replace(/(?:math\.)?sin\(/g, '_sin(');
    sanitized = sanitized.replace(/(?:math\.)?cos\(/g, '_cos(');
    sanitized = sanitized.replace(/(?:math\.)?tan\(/g, '_tan(');

    // factorial helper
    const factorial = (n: number): number => {
      n = Math.floor(n);
      if (n < 0) throw new Error('Fatorial não definido para números negativos');
      if (n > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    };

    // Safe execution of mathematical expression
    const func = new Function('Math', 'factorial', '_sin', '_cos', '_tan', `return (${sanitized});`);
    const val = func(Math, factorial, _sin, _cos, _tan);

    if (typeof val === 'number') {
      if (Number.isNaN(val)) return 'Indefinido';
      if (!Number.isFinite(val)) return val > 0 ? 'Infinito' : '-Infinito';
      if (isDegreeMode) {
        if (Math.abs(val) < 1e-15) return '0';
        if (Number.isInteger(val)) return String(val);
        const rounded = Math.round(val * 1e10) / 1e10;
        return String(Math.abs(val - rounded) < 1e-12 ? rounded : Math.round(val * 1e12) / 1e12);
      }
      return Math.round(val * 1e12) / 1e12;
    }

    return String(val);
  }
}

export const pyodideService = new PyodideManager();
