import React, { useState, useMemo } from 'react';
import {
  Quote,
  Copy,
  Check,
  Trash2,
  ListFilter,
  Sparkles,
  ArrowRight,
  Filter,
  Code2,
  FileText,
  RotateCcw,
} from 'lucide-react';

export type QuoteStyle = 'single' | 'none' | 'double' | 'custom';
export type SeparatorStyle = 'comma_space' | 'comma_only' | 'newline' | 'semicolon' | 'custom';
export type SqlWrapper = 'none' | 'sql_in' | 'sql_where_in' | 'sql_row_tuples';
export type CaseTransform = 'none' | 'uppercase' | 'lowercase';

export const ListFormatterView: React.FC = () => {
  // Input state
  const [inputText, setInputText] = useState<string>(
    'ORD-2026-8801\nORD-2026-8802\nORD-2026-8803\nORD-2026-8804\nORD-2026-8802\nORD-2026-8805'
  );

  // Configuration options
  const [quoteStyle, setQuoteStyle] = useState<QuoteStyle>('single');
  const [customQuote, setCustomQuote] = useState<string>('`');
  const [itemPrefix, setItemPrefix] = useState<string>('');
  const [itemSuffix, setItemSuffix] = useState<string>('');
  const [separatorStyle, setSeparatorStyle] = useState<SeparatorStyle>('comma_space');
  const [customSeparator, setCustomSeparator] = useState<string>(' | ');
  const [sqlWrapper, setSqlWrapper] = useState<SqlWrapper>('none');
  const [columnName, setColumnName] = useState<string>('OrderId');
  
  // Cleaning & transformation flags
  const [trimItems, setTrimItems] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(true);
  const [caseTransform, setCaseTransform] = useState<CaseTransform>('none');

  // Copy notification feedback state
  const [copied, setCopied] = useState<boolean>(false);

  // Format computation logic
  const { formattedOutput, rawCount, processedCount, duplicateCount } = useMemo(() => {
    if (!inputText) {
      return { formattedOutput: '', rawCount: 0, processedCount: 0, duplicateCount: 0 };
    }

    // Split input by newlines, commas, or spaces if multiline paste
    // Standard delimiter parser that handles newlines, tabs, and commas gracefully
    const rawItems = inputText
      .split(/[\r\n,;\t]+/)
      .map((item) => (trimItems ? item.trim() : item));

    const totalRaw = rawItems.length;

    // Filter empty items
    let items = rawItems.filter((item) => {
      if (removeEmpty && item === '') return false;
      return true;
    });

    // Case transform
    if (caseTransform === 'uppercase') {
      items = items.map((i) => i.toUpperCase());
    } else if (caseTransform === 'lowercase') {
      items = items.map((i) => i.toLowerCase());
    }

    // Deduplication
    let duplicates = 0;
    if (removeDuplicates) {
      const uniqueItems: string[] = [];
      const seen = new Set<string>();
      for (const item of items) {
        if (seen.has(item)) {
          duplicates++;
        } else {
          seen.add(item);
          uniqueItems.push(item);
        }
      }
      items = uniqueItems;
    }

    // Apply Quote Style and Item Prefix / Suffix
    const quotedItems = items.map((item) => {
      let quoted = item;
      switch (quoteStyle) {
        case 'single':
          quoted = `'${item}'`;
          break;
        case 'double':
          quoted = `"${item}"`;
          break;
        case 'custom':
          quoted = `${customQuote}${item}${customQuote}`;
          break;
        case 'none':
        default:
          quoted = item;
          break;
      }
      return `${itemPrefix}${quoted}${itemSuffix}`;
    });

    // Apply Separator Style
    let delimiter = ', ';
    switch (separatorStyle) {
      case 'comma_space':
        delimiter = ', ';
        break;
      case 'comma_only':
        delimiter = ',';
        break;
      case 'newline':
        delimiter = '\n';
        break;
      case 'semicolon':
        delimiter = '; ';
        break;
      case 'custom':
        delimiter = customSeparator;
        break;
    }

    let joined = quotedItems.join(delimiter);

    // Apply SQL Wrapper
    if (sqlWrapper === 'sql_in') {
      joined = `IN (${joined})`;
    } else if (sqlWrapper === 'sql_where_in') {
      const col = columnName.trim() || 'Column';
      joined = `WHERE ${col} IN (${joined})`;
    } else if (sqlWrapper === 'sql_row_tuples') {
      // Formats as (item1),\n(item2),\n(item3);
      if (quotedItems.length > 0) {
        joined = quotedItems.map((item) => `(${item})`).join(',\n') + ';';
      } else {
        joined = '';
      }
    }

    return {
      formattedOutput: joined,
      rawCount: totalRaw,
      processedCount: items.length,
      duplicateCount: duplicates,
    };
  }, [
    inputText,
    quoteStyle,
    customQuote,
    itemPrefix,
    itemSuffix,
    separatorStyle,
    customSeparator,
    sqlWrapper,
    columnName,
    trimItems,
    removeDuplicates,
    removeEmpty,
    caseTransform,
  ]);

  const handleCopy = () => {
    if (!formattedOutput) return;
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
  };

  const loadSampleData = (type: 'orders' | 'emails' | 'skus' | 'ids') => {
    if (type === 'orders') {
      setInputText(
        'ORD-2026-901\nORD-2026-902\nORD-2026-903\nORD-2026-904\nORD-2026-902\nORD-2026-905\nORD-2026-906'
      );
    } else if (type === 'ids') {
      setInputText('1995833\n1995834\n1995835');
      setQuoteStyle('none');
      setSqlWrapper('sql_row_tuples');
    } else if (type === 'emails') {
      setInputText(
        'user.alpha@company.com\nuser.beta@company.com\nuser.gamma@company.com\nuser.alpha@company.com\nadmin@company.com'
      );
    } else if (type === 'skus') {
      setInputText('SKU-101, SKU-102, SKU-103, SKU-104, SKU-101, SKU-105');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="bg-[#2D2D30] border-b border-[#3F3F46] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#007ACC]/20 text-[#007ACC] rounded-md border border-[#007ACC]/30">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              List & SQL Formatter
              <span className="text-[10px] bg-[#007ACC] text-white px-2 py-0.5 rounded font-mono">
                Utility
              </span>
            </h2>
            <p className="text-xs text-[#AAAAAA]">
              Convert raw item lists into Single-Quoted, Comma-Separated, or SQL IN (...) queries
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sample-ids"
            onClick={() => loadSampleData('ids')}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Load sample ID list formatted as (1995833), (1995834);"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Sample IDs
          </button>
          <button
            id="btn-sample-orders"
            onClick={() => loadSampleData('orders')}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sample Orders
          </button>
          <button
            id="btn-sample-emails"
            onClick={() => loadSampleData('emails')}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Sample Emails
          </button>
          <button
            id="btn-clear-input"
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-red-950/40 hover:text-red-300 text-xs text-[#888888] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Main Formatting Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#3F3F46]">
        {/* Left Column: Raw Input Area (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#1E1E1E]">
          <div className="px-4 py-2 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5 text-[#007ACC]" />
              Raw Input List
            </span>
            <span className="text-[11px] font-mono text-[#888888]">
              {rawCount} item{rawCount !== 1 ? 's' : ''} detected
            </span>
          </div>

          <div className="flex-1 p-3 flex flex-col">
            <textarea
              id="input-list-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw items here (one per line, space-separated, or comma-separated)...&#10;Example:&#10;1001&#10;1002&#10;1003"
              className="w-full flex-1 bg-[#252526] text-[#E0E0E0] p-3 text-xs font-mono rounded border border-[#3F3F46] focus:outline-none focus:border-[#007ACC] resize-none leading-relaxed"
            />
          </div>

          {/* Quick Stats Banner */}
          <div className="px-4 py-2 bg-[#252526] border-t border-[#3F3F46] text-[11px] font-mono text-[#AAAAAA] flex justify-between items-center">
            <div>
              Cleaned: <span className="text-emerald-400 font-bold">{processedCount}</span>
            </div>
            {duplicateCount > 0 && (
              <div className="text-amber-400">
                Duplicates Removed: <span className="font-bold">{duplicateCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Options & Controls (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#252526] overflow-y-auto">
          <div className="px-4 py-2 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#007ACC]" />
              Format Options
            </span>
            <button
              onClick={() => {
                setQuoteStyle('single');
                setItemPrefix('');
                setItemSuffix('');
                setSeparatorStyle('comma_space');
                setSqlWrapper('none');
                setTrimItems(true);
                setRemoveDuplicates(true);
                setRemoveEmpty(true);
                setCaseTransform('none');
              }}
              className="text-[11px] text-[#888888] hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="p-4 space-y-5 text-xs">
            {/* 1. Quote Style Selection */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-2">
                Quote Framing:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="opt-quote-single"
                  onClick={() => setQuoteStyle('single')}
                  className={`px-3 py-2 rounded text-left border flex items-center justify-between transition-all ${
                    quoteStyle === 'single'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <span>Single Quote</span>
                  <span className="font-mono text-[11px] opacity-80">'abc'</span>
                </button>

                <button
                  id="opt-quote-none"
                  onClick={() => setQuoteStyle('none')}
                  className={`px-3 py-2 rounded text-left border flex items-center justify-between transition-all ${
                    quoteStyle === 'none'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <span>No Quote</span>
                  <span className="font-mono text-[11px] opacity-80">abc</span>
                </button>

                <button
                  id="opt-quote-double"
                  onClick={() => setQuoteStyle('double')}
                  className={`px-3 py-2 rounded text-left border flex items-center justify-between transition-all ${
                    quoteStyle === 'double'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <span>Double Quote</span>
                  <span className="font-mono text-[11px] opacity-80">"abc"</span>
                </button>

                <button
                  id="opt-quote-custom"
                  onClick={() => setQuoteStyle('custom')}
                  className={`px-3 py-2 rounded text-left border flex items-center justify-between transition-all ${
                    quoteStyle === 'custom'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <span>Custom Quote</span>
                  <span className="font-mono text-[11px] opacity-80">`abc`</span>
                </button>
              </div>

              {quoteStyle === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[#888888]">Custom Character:</span>
                  <input
                    type="text"
                    value={customQuote}
                    onChange={(e) => setCustomQuote(e.target.value)}
                    className="w-16 bg-[#1E1E1E] border border-[#3F3F46] rounded px-2 py-1 text-center font-mono focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Item Prefix & Suffix Wrapping */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-2">
                Item Prefix & Suffix (Wrap Each Item):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-[#888888] block mb-1">Prefix (e.g. `(`):</span>
                  <input
                    id="input-item-prefix"
                    type="text"
                    placeholder="("
                    value={itemPrefix}
                    onChange={(e) => setItemPrefix(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2 py-1.5 font-mono text-xs focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#888888] block mb-1">Suffix (e.g. `)`):</span>
                  <input
                    id="input-item-suffix"
                    type="text"
                    placeholder=")"
                    value={itemSuffix}
                    onChange={(e) => setItemSuffix(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2 py-1.5 font-mono text-xs focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Separator Selection */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-2">
                Delimiter / Separator:
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'comma_space', label: 'Comma + Space', preview: 'item1, item2' },
                  { id: 'comma_only', label: 'Comma Only', preview: 'item1,item2' },
                  { id: 'newline', label: 'New Line', preview: 'item1\\nitem2' },
                  { id: 'semicolon', label: 'Semicolon + Space', preview: 'item1; item2' },
                  { id: 'custom', label: 'Custom Delimiter', preview: 'custom' },
                ].map((sep) => (
                  <label
                    key={sep.id}
                    className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                      separatorStyle === sep.id
                        ? 'bg-[#007ACC]/20 border-[#007ACC] text-white'
                        : 'bg-[#1E1E1E] border-[#3F3F46] text-[#AAAAAA] hover:bg-[#2D2D30]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="separator"
                        checked={separatorStyle === sep.id}
                        onChange={() => setSeparatorStyle(sep.id as SeparatorStyle)}
                        className="accent-[#007ACC]"
                      />
                      <span>{sep.label}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#888888]">
                      {sep.preview}
                    </span>
                  </label>
                ))}
              </div>

              {separatorStyle === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[#888888]">Custom Separator:</span>
                  <input
                    type="text"
                    value={customSeparator}
                    onChange={(e) => setCustomSeparator(e.target.value)}
                    className="flex-1 bg-[#1E1E1E] border border-[#3F3F46] rounded px-2 py-1 font-mono focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. SQL Wrapper Options */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-2 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                SQL Query Wrapper:
              </label>
              <div className="space-y-2">
                <select
                  id="select-sql-wrapper"
                  value={sqlWrapper}
                  onChange={(e) => setSqlWrapper(e.target.value as SqlWrapper)}
                  className="w-full bg-[#1E1E1E] text-[#E0E0E0] border border-[#3F3F46] rounded p-2 focus:border-[#007ACC] focus:outline-none"
                >
                  <option value="none">None (Raw Formatted Items)</option>
                  <option value="sql_in">Wrap with IN ( 'item1', 'item2' )</option>
                  <option value="sql_where_in">Wrap with WHERE Column IN ( 'item1', 'item2' )</option>
                  <option value="sql_row_tuples">SQL Values Rows: (val1), (val2);</option>
                </select>

                {sqlWrapper === 'sql_where_in' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#888888]">Column Name:</span>
                    <input
                      type="text"
                      value={columnName}
                      onChange={(e) => setColumnName(e.target.value)}
                      className="flex-1 bg-[#1E1E1E] border border-[#3F3F46] rounded px-2 py-1 font-mono focus:border-[#007ACC] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Data Cleaners & Filters */}
            <div className="pt-2 border-t border-[#3F3F46]">
              <label className="block text-[#CCCCCC] font-semibold mb-2">
                List Cleaning & Case:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC]">
                  <input
                    type="checkbox"
                    checked={trimItems}
                    onChange={(e) => setTrimItems(e.target.checked)}
                    className="accent-[#007ACC] rounded"
                  />
                  <span>Trim whitespace from items</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC]">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="accent-[#007ACC] rounded"
                  />
                  <span>Remove duplicate values</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC]">
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="accent-[#007ACC] rounded"
                  />
                  <span>Ignore empty or blank items</span>
                </label>
              </div>

              {/* Case transform */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[#888888]">Case Transform:</span>
                <select
                  value={caseTransform}
                  onChange={(e) => setCaseTransform(e.target.value as CaseTransform)}
                  className="bg-[#1E1E1E] text-[#E0E0E0] border border-[#3F3F46] rounded px-2 py-1 font-mono text-xs focus:border-[#007ACC] focus:outline-none"
                >
                  <option value="none">As Entered</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Formatted Result Output (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#1E1E1E]">
          <div className="px-4 py-2 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              Formatted Result
            </span>
            <button
              id="btn-copy-formatted-result"
              onClick={handleCopy}
              disabled={!formattedOutput}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : formattedOutput
                  ? 'bg-[#007ACC] hover:bg-[#0062A3] text-white'
                  : 'bg-[#333333] text-[#777777] cursor-not-allowed'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Output
                </>
              )}
            </button>
          </div>

          <div className="flex-1 p-3 flex flex-col">
            <textarea
              id="output-list-textarea"
              readOnly
              value={formattedOutput}
              placeholder="Formatted output will appear here automatically..."
              className="w-full flex-1 bg-[#1E1E1E] text-emerald-300 p-3 text-xs font-mono rounded border border-[#3F3F46] focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Preset Shortcuts */}
          <div className="p-3 bg-[#252526] border-t border-[#3F3F46] flex items-center justify-between text-xs">
            <span className="text-[#888888] font-mono text-[11px]">
              {formattedOutput.length} characters
            </span>

            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setQuoteStyle('single');
                  setItemPrefix('');
                  setItemSuffix('');
                  setSeparatorStyle('comma_space');
                  setSqlWrapper('none');
                }}
                className="px-2 py-1 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[11px] text-[#CCCCCC] rounded border border-[#3F3F46]"
                title="Single Quoted + Comma Separated ('a', 'b')"
              >
                'a', 'b'
              </button>
              <button
                onClick={() => {
                  setQuoteStyle('none');
                  setItemPrefix('');
                  setItemSuffix('');
                  setSeparatorStyle('comma_space');
                  setSqlWrapper('none');
                }}
                className="px-2 py-1 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[11px] text-[#CCCCCC] rounded border border-[#3F3F46]"
                title="Comma Separated Only (a, b)"
              >
                a, b
              </button>
              <button
                onClick={() => {
                  setQuoteStyle('single');
                  setItemPrefix('');
                  setItemSuffix('');
                  setSeparatorStyle('comma_space');
                  setSqlWrapper('sql_in');
                }}
                className="px-2 py-1 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[11px] text-[#CCCCCC] rounded border border-[#3F3F46]"
                title="SQL IN ('a', 'b')"
              >
                IN ('a','b')
              </button>
              <button
                id="preset-paren-items"
                onClick={() => {
                  setQuoteStyle('none');
                  setItemPrefix('(');
                  setItemSuffix(')');
                  setSeparatorStyle('comma_only');
                  setSqlWrapper('none');
                }}
                className="px-2 py-1 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[11px] text-cyan-400 font-mono rounded border border-[#3F3F46]"
                title="Paren-wrapped items separated by commas: (1),(2),(3)"
              >
                (1),(2),(3)
              </button>
              <button
                id="preset-row-tuples"
                onClick={() => {
                  setQuoteStyle('none');
                  setItemPrefix('');
                  setItemSuffix('');
                  setSqlWrapper('sql_row_tuples');
                }}
                className="px-2 py-1 bg-[#1E1E1E] hover:bg-[#2D2D30] text-[11px] text-emerald-400 font-mono rounded border border-[#3F3F46]"
                title="SQL Values Rows: (1995833), (1995834);"
              >
                (1),(2);
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
