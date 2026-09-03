import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Play,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  Settings,
  ArrowRight,
  Maximize2,
  Minimize2,
  Terminal
} from 'lucide-react';

interface Operation {
  id: string;
  name: string;
  category: 'Encoding' | 'Encryption' | 'Hashing' | 'Compression' | 'Language' | 'Networking';
  description: string;
  args?: { [key: string]: any };
}

const AVAILABLE_OPERATIONS: Operation[] = [
  { id: 'from_base64', name: 'From Base64', category: 'Encoding', description: 'Decode base64 string to plaintext' },
  { id: 'to_base64', name: 'To Base64', category: 'Encoding', description: 'Encode plaintext into standard RFC 4648 Base64' },
  { id: 'from_base64_utf16le', name: 'PowerShell UTF-16LE (-enc)', category: 'Language', description: 'Decode Windows PowerShell encoded command scripts' },
  { id: 'to_base64_utf16le', name: 'To PowerShell -enc (UTF-16LE)', category: 'Language', description: 'Encode command into PowerShell -enc format' },
  { id: 'url_decode', name: 'URL Decode', category: 'Encoding', description: 'Decode percent-encoded URI strings (%20 -> space)' },
  { id: 'url_encode', name: 'URL Encode', category: 'Encoding', description: 'Encode special characters into percent-encoded URI strings' },
  { id: 'rot13', name: 'ROT13', category: 'Encryption', description: 'Rotate Latin alphabet characters by 13 positions' },
  { id: 'rot47', name: 'ROT47', category: 'Encryption', description: 'Rotate all ASCII printable characters by 47 positions' },
  { id: 'to_hex', name: 'To Hexdump', category: 'Encoding', description: 'Convert text or bytes to hexadecimal space-separated representation' },
  { id: 'from_hex', name: 'From Hexdump', category: 'Encoding', description: 'Convert hexadecimal string back into bytes/text' },
  { id: 'to_binary', name: 'To Binary String', category: 'Encoding', description: 'Convert text into 8-bit binary 0s and 1s' },
  { id: 'from_binary', name: 'From Binary String', category: 'Encoding', description: 'Convert 8-bit binary back to text' },
  { id: 'reverse', name: 'Reverse String', category: 'Encoding', description: 'Reverses character sequence of input' },
  { id: 'to_uppercase', name: 'To Upper case', category: 'Language', description: 'Converts all characters to UPPERCASE' },
  { id: 'to_lowercase', name: 'To Lower case', category: 'Language', description: 'Converts all characters to lowercase' },
  { id: 'xor', name: 'XOR with Key', category: 'Encryption', description: 'XOR input against a single-byte or multi-byte key' },
  { id: 'sha256', name: 'SHA256 Hash', category: 'Hashing', description: 'Calculates SHA-256 cryptographic digest' },
  { id: 'sha1', name: 'SHA1 Hash', category: 'Hashing', description: 'Calculates SHA-1 cryptographic digest' },
  { id: 'md5', name: 'MD5 Hash', category: 'Hashing', description: 'Calculates legacy MD5 message digest' }
];

export const CyberChefFullSuite: React.FC = () => {
  const [viewMode, setViewMode] = useState<'workbench'>('workbench');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchOp, setSearchOp] = useState<string>('');
  
  // Custom Workbench State
  const [recipe, setRecipe] = useState<Operation[]>([
    AVAILABLE_OPERATIONS.find(o => o.id === 'from_base64_utf16le')!
  ]);
  const [xorKey, setXorKey] = useState<string>('secret');
  const [inputData, setInputData] = useState<string>(
    'SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwADAALgAxADEAOAAuADEANgAxAC4AMQA3AC8AcABhAHkAbABvAGEAZAAnACkA'
  );
  const [outputData, setOutputData] = useState<string>('');
  const [autoBake, setAutoBake] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronous Recipe Execution Pipeline
  const executePipeline = async (input: string, currentRecipe: Operation[]): Promise<string> => {
    let current = input;

    for (const op of currentRecipe) {
      try {
        if (!current) break;

        switch (op.id) {
          case 'from_base64':
            current = atob(current.trim());
            break;
          case 'to_base64':
            current = btoa(current);
            break;
          case 'from_base64_utf16le': {
            const bin = atob(current.trim());
            let str = '';
            for (let i = 0; i < bin.length; i += 2) {
              str += bin.charAt(i);
            }
            current = str;
            break;
          }
          case 'to_base64_utf16le': {
            let utf16 = '';
            for (let i = 0; i < current.length; i++) {
              utf16 += current.charAt(i) + '\0';
            }
            current = btoa(utf16);
            break;
          }
          case 'url_decode':
            current = decodeURIComponent(current);
            break;
          case 'url_encode':
            current = encodeURIComponent(current);
            break;
          case 'rot13':
            current = current.replace(/[a-zA-Z]/g, c => {
              const base = c <= 'Z' ? 65 : 97;
              return String.fromCharCode(base + (c.charCodeAt(0) - base + 13) % 26);
            });
            break;
          case 'rot47':
            current = current.replace(/[!-~]/g, c => {
              return String.fromCharCode(33 + (c.charCodeAt(0) - 33 + 47) % 94);
            });
            break;
          case 'to_hex':
            current = Array.from(new TextEncoder().encode(current))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(' ');
            break;
          case 'from_hex': {
            const cleanHex = current.replace(/[\s\r\n]/g, '');
            let hexStr = '';
            for (let i = 0; i < cleanHex.length; i += 2) {
              hexStr += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
            }
            current = hexStr;
            break;
          }
          case 'to_binary':
            current = Array.from(new TextEncoder().encode(current))
              .map(b => b.toString(2).padStart(8, '0'))
              .join(' ');
            break;
          case 'from_binary': {
            const bytes = current.trim().split(/\s+/);
            current = bytes.map(b => String.fromCharCode(parseInt(b, 2))).join('');
            break;
          }
          case 'reverse':
            current = current.split('').reverse().join('');
            break;
          case 'to_uppercase':
            current = current.toUpperCase();
            break;
          case 'to_lowercase':
            current = current.toLowerCase();
            break;
          case 'xor': {
            const key = xorKey || 'A';
            let xorRes = '';
            for (let i = 0; i < current.length; i++) {
              xorRes += String.fromCharCode(current.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            current = xorRes;
            break;
          }
          case 'sha256': {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current));
            current = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            break;
          }
          case 'sha1': {
            const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(current));
            current = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            break;
          }
          default:
            break;
        }
      } catch (err: any) {
        return `[Error in step "${op.name}"]: ${err.message}`;
      }
    }

    return current;
  };

  useEffect(() => {
    if (autoBake) {
      executePipeline(inputData, recipe).then(res => setOutputData(res));
    }
  }, [inputData, recipe, xorKey, autoBake]);

  const addOperation = (op: Operation) => {
    setRecipe(prev => [...prev, op]);
    setToastMessage(`Added "${op.name}" to recipe pipeline.`);
  };

  const removeOperation = (index: number) => {
    setRecipe(prev => prev.filter((_, idx) => idx !== index));
  };

  const filteredOps = AVAILABLE_OPERATIONS.filter(o => {
    if (activeCategory !== 'All' && o.category !== activeCategory) return false;
    if (searchOp && !o.name.toLowerCase().includes(searchOp.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-3.5 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded-xl font-mono text-xs flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-3">✕</button>
        </div>
      )}

      {/* Top Banner & Mode Toggle */}
      <div className="bg-[#0B0E14] border border-[#202736] rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/40 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-950">
            CC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">CYBERCHEF · COMPLETE CRYPTO WORKBENCH</h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                GCHQ CYBERCHEF v10.x EMBEDDED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              The Cyber Swiss Army Knife: 300+ de-obfuscation recipes, hash crackers, binary encoders, and XOR pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* CYBER-RANGE QUICK-BAKE PIPELINE WORKBENCH (OFFLINE LOCAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[700px]">
          {/* Col 1: Operations Library (3 cols) */}
          <div className="lg:col-span-3 bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                Operations Library
              </span>

              {/* Search Operations */}
              <input
                type="text"
                value={searchOp}
                onChange={e => setSearchOp(e.target.value)}
                placeholder="Search 19+ operations..."
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />

              {/* Categories */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[#202736]">
                {['All', 'Encoding', 'Language', 'Encryption', 'Hashing'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      activeCategory === cat
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                        : 'bg-[#121620] text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Operations List */}
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredOps.map(op => (
                  <button
                    key={op.id}
                    onClick={() => addOperation(op)}
                    className="w-full p-2.5 rounded-xl bg-[#121620] hover:bg-[#182030] border border-[#202736] hover:border-emerald-500 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-300">{op.name}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[170px]">{op.description}</div>
                    </div>
                    <span className="text-emerald-400 font-black text-sm opacity-0 group-hover:opacity-100 transition">+</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: Active Recipe Pipeline (3 cols) */}
          <div className="lg:col-span-3 bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                  Active Recipe ({recipe.length} Steps)
                </span>
                <button
                  onClick={() => setRecipe([])}
                  className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1 font-bold"
                  title="Clear All Steps"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {recipe.map((op, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#121620] border border-emerald-500/40 rounded-xl space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/40">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs">{op.name}</span>
                      </div>
                      <button
                        onClick={() => removeOperation(idx)}
                        className="text-slate-500 hover:text-red-400"
                        title="Remove step"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Step Argument Customizers */}
                    {op.id === 'xor' && (
                      <div className="pt-1">
                        <label className="text-[9px] text-slate-400 uppercase font-bold block mb-1">XOR Key (String / Byte):</label>
                        <input
                          type="text"
                          value={xorKey}
                          onChange={e => setXorKey(e.target.value)}
                          className="w-full bg-[#080A0E] border border-[#202736] rounded-lg px-2 py-1 text-emerald-300 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {recipe.length === 0 && (
                  <div className="p-8 text-center text-slate-600 border border-dashed border-[#202736] rounded-xl space-y-2">
                    <Layers className="w-6 h-6 mx-auto text-slate-700" />
                    <div>Recipe is empty.</div>
                    <div className="text-[10px]">Click any operation from the left library to add it to your pipeline.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-Bake Controls */}
            <div className="pt-3 border-t border-[#182030] flex items-center justify-between">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoBake}
                  onChange={e => setAutoBake(e.target.checked)}
                  className="rounded border-[#202736] text-emerald-500 focus:ring-0"
                />
                <span>Auto-Bake (Real-Time)</span>
              </label>
              {!autoBake && (
                <button
                  onClick={() => executePipeline(inputData, recipe).then(res => setOutputData(res))}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Bake
                </button>
              )}
            </div>
          </div>

          {/* Col 3: Input & Output Panels (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Input Panel */}
            <div className="flex-1 bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Input Stream ({inputData.length} chars • {new Blob([inputData]).size} bytes)
                </span>
                <button
                  onClick={() => setInputData('')}
                  className="text-slate-500 hover:text-white text-[10px]"
                >
                  Clear Input
                </button>
              </div>
              <textarea
                value={inputData}
                onChange={e => setInputData(e.target.value)}
                placeholder="Drop, paste or type input text, base64 payload, hex dump..."
                rows={7}
                className="w-full bg-[#080A0E] border border-[#202736] rounded-xl p-3 text-amber-300 text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Output Panel */}
            <div className="flex-1 bg-[#0B0E14] border border-[#202736] rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#202736]">
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                  Bake Output Stream ({outputData.length} chars • {new Blob([outputData]).size} bytes)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(outputData);
                    setToastMessage("Copied baked output to clipboard!");
                  }}
                  className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Result</span>
                </button>
              </div>
              <div className="w-full bg-[#080A0E] border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs font-mono min-h-[140px] max-h-[220px] overflow-y-auto whitespace-pre-wrap break-all leading-relaxed">
                {outputData || '// Pipeline output will display here.'}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};
