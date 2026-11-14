import React, { useState, useMemo, useRef } from 'react';
import {
  Braces,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Minimize2,
  FileCode,
  ArrowDownUp,
  Wrench,
  Search,
} from 'lucide-react';

// Sample JSON payload representing support ticket & diagnostic data
const SAMPLE_JSON = `{
  "ticketId": "TCK-2026-9481",
  "status": "In_Investigation",
  "priority": "High",
  "customer": {
    "accountId": 883921,
    "orgName": "Global Logistics Corp",
    "tier": "Enterprise",
    "contact": {
      "name": "Sarah Jenkins",
      "email": "s.jenkins@globallogistics.example.com",
      "phone": "+1-555-019-2834"
    }
  },
  "environment": {
    "platform": ".NET 8.0 WPF",
    "database": "Production SQL Server (SalesDB)",
    "serverVersion": "v16.0.4105.2",
    "clusterNodes": ["node-eu-west-01", "node-eu-west-02"]
  },
  "affectedPlots": [1048, 1052, 1089, 1102],
  "metrics": {
    "latencyMs": 42.8,
    "retryCount": 0,
    "isResolved": false,
    "resolutionNotes": null
  },
  "tags": ["sql-timeout", "plot-sync", "wpf-client"]
}`;

// Helper: Fix common loose JSON syntax errors (unquoted keys, single quotes, trailing commas, comments)
function repairLooseJson(input: string): string {
  let cleaned = input
    // Remove single line comments // ...
    .replace(/\/\/.*$/gm, '')
    // Remove multi-line comments /* ... */
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Replace single-quoted strings with double-quoted strings: 'val' -> "val"
    .replace(/'((?:\\.|[^'])*)'/g, '"$1"')
    // Quote unquoted object keys: { foo: "bar" } -> { "foo": "bar" }
    .replace(/([{,]\s*)([a-zA-Z0-9_$-]+)(\s*:)/g, '$1"$2"$3')
    // Remove trailing commas before } or ]
    .replace(/,\s*([}\]])/g, '$1');

  return cleaned.trim();
}

// Helper: Recursively sort object keys alphabetically
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc: Record<string, any>, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

// Syntax highlighter component for formatted JSON text
const JsonCodeViewer: React.FC<{ code: string }> = ({ code }) => {
  const lines = useMemo(() => code.split('\n'), [code]);

  const highlightLine = (line: string) => {
    // Tokenizer regex matching JSON elements
    const tokenRegex =
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],])/g;

    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parts.push(
          <span key={`ws-${lastIdx}`} className="text-[#888888]">
            {line.slice(lastIdx, match.index)}
          </span>
        );
      }

      const token = match[0];
      const isKey = token.endsWith(':');

      if (isKey) {
        // Object Key
        parts.push(
          <span key={match.index} className="text-[#9CDCFE] font-medium">
            {token.slice(0, -1)}
          </span>,
          <span key={`${match.index}-colon`} className="text-[#888888]">
            :
          </span>
        );
      } else if (token.startsWith('"')) {
        // String value
        parts.push(
          <span key={match.index} className="text-[#CE9178]">
            {token}
          </span>
        );
      } else if (token === 'true' || token === 'false') {
        // Boolean
        parts.push(
          <span key={match.index} className="text-[#569CD6] font-semibold">
            {token}
          </span>
        );
      } else if (token === 'null') {
        // Null
        parts.push(
          <span key={match.index} className="text-[#F87171] font-semibold italic">
            {token}
          </span>
        );
      } else if (!isNaN(Number(token))) {
        // Number
        parts.push(
          <span key={match.index} className="text-[#B5CEA8]">
            {token}
          </span>
        );
      } else {
        // Punctuation { } [ ] ,
        parts.push(
          <span key={match.index} className="text-[#D4D4D4]">
            {token}
          </span>
        );
      }

      lastIdx = tokenRegex.lastIndex;
    }

    if (lastIdx < line.length) {
      parts.push(
        <span key={`tail-${lastIdx}`} className="text-[#888888]">
          {line.slice(lastIdx)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span>&nbsp;</span>;
  };

  return (
    <div className="font-mono text-xs leading-relaxed select-text">
      {lines.map((line, idx) => (
        <div key={idx} className="flex hover:bg-[#2A2A2D]/60 transition-colors">
          <span className="w-10 shrink-0 text-right pr-3 text-[#555555] select-none font-mono text-[11px]">
            {idx + 1}
          </span>
          <div className="flex-1 whitespace-pre overflow-x-auto">{highlightLine(line)}</div>
        </div>
      ))}
    </div>
  );
};

export const JsonFormatterView: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>(SAMPLE_JSON);
  const [indentOption, setIndentOption] = useState<'2' | '4' | 'tab'>('2');
  const [sortAlphabetical, setSortAlphabetical] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse and process JSON
  const { parsedData, parseError, formattedOutput, minifiedOutput, stats } = useMemo(() => {
    if (!inputJson.trim()) {
      return {
        parsedData: null,
        parseError: null,
        formattedOutput: '',
        minifiedOutput: '',
        stats: null,
      };
    }

    try {
      let data = JSON.parse(inputJson);

      // Optional Key Sorting
      if (sortAlphabetical) {
        data = sortObjectKeys(data);
      }

      // Filter by search query if provided (simple key/string filter)
      let displayData = data;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data)) {
            displayData = data.filter((item) =>
              JSON.stringify(item).toLowerCase().includes(query)
            );
          } else {
            const filteredObj: Record<string, any> = {};
            for (const [k, v] of Object.entries(data)) {
              if (k.toLowerCase().includes(query) || JSON.stringify(v).toLowerCase().includes(query)) {
                filteredObj[k] = v;
              }
            }
            displayData = filteredObj;
          }
        }
      }

      const indentStr = indentOption === 'tab' ? '\t' : Number(indentOption);
      const formatted = JSON.stringify(displayData, null, indentStr);
      const minified = JSON.stringify(displayData);

      // Calculate stats
      const lineCount = formatted.split('\n').length;
      const rawBytes = new Blob([inputJson]).size;
      const formattedBytes = new Blob([formatted]).size;
      const keyCount =
        typeof data === 'object' && data !== null
          ? Array.isArray(data)
            ? data.length
            : Object.keys(data).length
          : 1;

      return {
        parsedData: data,
        parseError: null,
        formattedOutput: formatted,
        minifiedOutput: minified,
        stats: {
          lineCount,
          rawBytes,
          formattedBytes,
          keyCount,
          isArray: Array.isArray(data),
        },
      };
    } catch (err: any) {
      let errorMsg = err.message || 'Invalid JSON syntax';
      let lineNum: number | undefined = undefined;

      // Extract line number from error message if available
      const match = errorMsg.match(/at position (\d+)/i);
      if (match && match[1]) {
        const pos = parseInt(match[1], 10);
        const textUpToError = inputJson.slice(0, pos);
        lineNum = textUpToError.split('\n').length;
      }

      return {
        parsedData: null,
        parseError: { message: errorMsg, line: lineNum },
        formattedOutput: '',
        minifiedOutput: '',
        stats: null,
      };
    }
  }, [inputJson, indentOption, sortAlphabetical, searchQuery]);

  // Actions
  const handlePrettify = () => {
    if (formattedOutput) {
      setInputJson(formattedOutput);
    }
  };

  const handleMinify = () => {
    if (minifiedOutput) {
      setInputJson(minifiedOutput);
    }
  };

  const handleFixLooseJson = () => {
    const fixed = repairLooseJson(inputJson);
    setInputJson(fixed);
  };

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = formattedOutput || inputJson;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setInputJson(text);
        }
      };
      reader.readAsText(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#007ACC]/20 border border-[#007ACC]/40 flex items-center justify-center text-[#38BDF8]">
            <Braces className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                JSON Formatter & Validator
              </h2>
              <span className="text-[10px] bg-[#007ACC]/20 text-[#38BDF8] px-1.5 py-0.5 rounded border border-[#007ACC]/40 font-mono">
                RFC 8259
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Prettify, minify, validate, repair loose syntax, and analyze JSON payloads
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2">
          <button
            id="btn-json-sample"
            onClick={() => setInputJson(SAMPLE_JSON)}
            className="px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Load sample support ticket JSON"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sample</span>
          </button>

          <label
            className="px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Upload .json or .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Upload</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            id="btn-json-download"
            onClick={handleDownload}
            disabled={!formattedOutput}
            className="px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-[#2D2D30] disabled:opacity-40 disabled:hover:bg-[#1E1E1E] text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download formatted JSON file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download</span>
          </button>

          <button
            id="btn-json-clear"
            onClick={() => setInputJson('')}
            className="px-2.5 py-1.5 bg-[#1E1E1E] hover:bg-rose-950/40 text-[#888888] hover:text-rose-400 rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Indentation, Sorting, Repair, Search */}
      <div className="px-4 py-2 bg-[#202022] border-b border-[#3F3F46] flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Indent option */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#888888] font-medium">Indent:</span>
            <div className="flex items-center bg-[#181818] rounded border border-[#3F3F46] p-0.5">
              <button
                onClick={() => setIndentOption('2')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  indentOption === '2' ? 'bg-[#007ACC] text-white' : 'text-[#888888] hover:text-white'
                }`}
              >
                2 Spaces
              </button>
              <button
                onClick={() => setIndentOption('4')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  indentOption === '4' ? 'bg-[#007ACC] text-white' : 'text-[#888888] hover:text-white'
                }`}
              >
                4 Spaces
              </button>
              <button
                onClick={() => setIndentOption('tab')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  indentOption === 'tab' ? 'bg-[#007ACC] text-white' : 'text-[#888888] hover:text-white'
                }`}
              >
                Tabs
              </button>
            </div>
          </div>

          {/* Sort Keys Alphabetical */}
          <button
            onClick={() => setSortAlphabetical((prev) => !prev)}
            className={`px-2.5 py-1 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              sortAlphabetical
                ? 'bg-[#007ACC]/20 text-[#38BDF8] border-[#007ACC]/50'
                : 'bg-[#181818] text-[#888888] border-[#3F3F46] hover:text-white'
            }`}
            title="Sort object keys alphabetically"
          >
            <ArrowDownUp className="w-3 h-3" />
            <span>Sort Keys (A-Z)</span>
          </button>

          {/* Quick Repair Button */}
          <button
            onClick={handleFixLooseJson}
            className="px-2.5 py-1 bg-[#181818] hover:bg-[#2A2A2D] text-amber-300 rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Auto-quote unquoted keys, replace single quotes, and strip trailing commas"
          >
            <Wrench className="w-3 h-3 text-amber-400" />
            <span>Fix Loose JSON</span>
          </button>

          {/* Fast Prettify & Minify */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrettify}
              disabled={!formattedOutput}
              className="px-2 py-1 bg-[#007ACC] hover:bg-[#0062A3] disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
              title="Replace input with formatted JSON"
            >
              <FileCode className="w-3 h-3" />
              <span>Prettify</span>
            </button>
            <button
              onClick={handleMinify}
              disabled={!minifiedOutput}
              className="px-2 py-1 bg-[#2D2D30] hover:bg-[#3E3E42] disabled:opacity-40 text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1 transition-colors"
              title="Compact into single line"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Minify</span>
            </button>
          </div>
        </div>

        {/* Filter / Search within JSON */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter keys or values..."
              className="bg-[#181818] border border-[#3F3F46] rounded pl-7 pr-2.5 py-1 text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#007ACC] w-48 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#3F3F46] overflow-hidden">
        {/* Left Pane: Raw / Editable Input */}
        <div className="flex flex-col h-full overflow-hidden bg-[#1E1E1E]">
          <div className="p-2.5 bg-[#252526]/80 border-b border-[#3F3F46] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#CCCCCC]">Raw Input</span>
              <span className="text-[10px] text-[#888888] font-mono">
                {inputJson.length.toLocaleString()} chars
              </span>
            </div>

            {/* Validation Indicator */}
            <div>
              {parseError ? (
                <span className="flex items-center gap-1 text-rose-400 text-[11px] font-medium bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Invalid JSON {parseError.line ? `(Line ${parseError.line})` : ''}</span>
                </span>
              ) : inputJson.trim() ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Valid JSON</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#666666]">Empty</span>
              )}
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <textarea
              id="json-raw-input"
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder="Paste or type JSON here..."
              className="w-full h-full p-3 font-mono text-xs text-[#E0E0E0] bg-[#1E1E1E] resize-none focus:outline-hidden leading-relaxed select-text overflow-auto"
              spellCheck={false}
            />
          </div>

          {/* Bottom error bar if invalid */}
          {parseError && (
            <div className="p-2.5 bg-rose-950/30 border-t border-rose-900/50 text-rose-300 text-xs font-mono flex items-start gap-2 overflow-x-auto shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Error:</span> {parseError.message}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Formatted & Syntax-Highlighted Output */}
        <div className="flex flex-col h-full overflow-hidden bg-[#1E1E1E]">
          <div className="p-2.5 bg-[#252526]/80 border-b border-[#3F3F46] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#CCCCCC]">Formatted Preview</span>
              {stats && (
                <span className="text-[10px] text-[#888888] font-mono">
                  {stats.lineCount} lines • {stats.keyCount} {stats.isArray ? 'items' : 'keys'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-formatted-json"
                onClick={() => handleCopy(formattedOutput || inputJson)}
                disabled={!formattedOutput}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#007ACC] hover:bg-[#0062A3] disabled:opacity-40 text-white'
                }`}
                title="Copy formatted JSON to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Formatted</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatted Code View */}
          <div className="flex-1 p-3 overflow-auto bg-[#181818]">
            {formattedOutput ? (
              <JsonCodeViewer code={formattedOutput} />
            ) : parseError ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#888888]">
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2 opacity-80" />
                <p className="text-xs font-medium text-[#CCCCCC] mb-1">Cannot format invalid JSON</p>
                <p className="text-[11px] text-[#888888] max-w-sm mb-3">
                  Please fix the syntax error on the left or click "Fix Loose JSON" to automatically clean up common formatting issues.
                </p>
                <button
                  onClick={handleFixLooseJson}
                  className="px-3 py-1.5 bg-[#252526] hover:bg-[#2D2D30] text-amber-300 rounded border border-[#3F3F46] text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Try Auto-Fix Loose JSON</span>
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#666666]">
                <Braces className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium text-[#888888]">No JSON to preview</p>
                <p className="text-[11px] text-[#666666] mt-1">
                  Type or paste JSON on the left, or click "Sample" to load test data.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Diagnostic Stats Bar */}
          {stats && (
            <div className="p-2 bg-[#202022] border-t border-[#3F3F46] flex items-center justify-between text-[11px] text-[#888888] font-mono shrink-0 px-3">
              <div className="flex items-center gap-3">
                <span>
                  Size: {(stats.formattedBytes / 1024).toFixed(2)} KB
                </span>
                <span>•</span>
                <span>
                  Compression: {(((stats.rawBytes - stats.formattedBytes) / stats.rawBytes) * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                Type: {stats.isArray ? 'JSON Array' : 'JSON Object'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
