import React, { useState } from 'react';
import { QueryResult } from '../../types';
import { Table, Copy, Check, FileSpreadsheet, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QueryResultsProps {
  result: QueryResult | null;
  onExportCsv: () => void;
}

export const QueryResults: React.FC<QueryResultsProps> = ({ result, onExportCsv }) => {
  const [filterText, setFilterText] = useState('');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#888888] text-xs p-6 bg-[#1E1E1E]">
        <Table className="w-10 h-10 mb-2 opacity-30 text-[#007ACC]" />
        <p className="font-medium text-[#CCCCCC]">No Query Results Executed Yet</p>
        <p className="text-[11px] text-[#777777] mt-1 text-center max-w-sm">
          Write a SQL statement in the editor above and press <span className="text-[#007ACC] font-mono">F5</span> or click <span className="text-white font-semibold">Execute</span>.
        </p>
      </div>
    );
  }

  if (!result.isSuccess) {
    return (
      <div className="h-full bg-[#1E1E1E] text-xs p-4 font-mono overflow-y-auto">
        <div className="flex items-center gap-2 text-red-400 font-bold mb-2 pb-2 border-b border-red-900/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Execution Error ({result.executionTimeMs} ms)</span>
        </div>
        <div className="bg-red-950/30 border border-red-800/40 text-red-200 p-3 rounded leading-relaxed whitespace-pre-wrap">
          {result.errorDetails || result.message}
        </div>
      </div>
    );
  }

  const rows = result.data || [];
  const columns = result.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

  const filteredRows = rows.filter((r) => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    return Object.values(r).some((val) =>
      String(val ?? '').toLowerCase().includes(lower)
    );
  });

  const handleCopyTable = () => {
    if (rows.length === 0) return;
    const header = columns.join('\t');
    const body = rows.map((r) => columns.map((c) => String(r[c] ?? '')).join('\t')).join('\n');
    const fullText = `${header}\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedStatus('All Rows Copied');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] text-xs font-mono">
      {/* Top Bar Summary & Filter */}
      <div className="flex items-center justify-between p-2 bg-[#252526] border-b border-[#3F3F46]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{result.message}</span>
          </div>
          <span className="text-[10px] bg-[#3E3E42] text-[#E0E0E0] px-2 py-0.5 rounded">
            {result.executionTimeMs} ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-[#888888]" />
            <input
              type="text"
              placeholder="Search in results..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-[#1E1E1E] border border-[#3F3F46] rounded pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-[#007ACC]"
            />
          </div>

          <button
            onClick={handleCopyTable}
            className="flex items-center gap-1 bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-2.5 py-1 rounded text-xs transition-colors"
            title="Copy all rows to clipboard as TSV"
          >
            {copiedStatus ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedStatus || 'Copy Table'}</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 bg-[#007ACC] hover:bg-[#0066B2] text-white px-2.5 py-1 rounded text-xs transition-colors"
            title="Export to CSV"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* DataGrid Table Container */}
      <div className="flex-1 overflow-auto">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-[#888888] font-sans">
            {rows.length === 0
              ? 'Command executed successfully. No data rows returned.'
              : `No rows match filter "${filterText}"`}
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-[#252526] border-b border-[#3F3F46] shadow-sm z-10">
              <tr>
                <th className="w-10 px-2 py-1.5 text-[10px] text-[#777777] border-r border-[#3F3F46] text-center font-normal">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-1.5 font-semibold text-[#E0E0E0] border-r border-[#3F3F46] whitespace-nowrap text-xs select-none hover:bg-[#2D2D30]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2D]">
              {filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#264F78]/40 transition-colors">
                  <td className="px-2 py-1 text-[10px] text-[#777777] border-r border-[#2A2A2D] text-center bg-[#252526]/50">
                    {rowIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    const isBool = typeof val === 'boolean';
                    return (
                      <td
                        key={col}
                        className={`px-3 py-1 border-r border-[#2A2A2D] whitespace-nowrap text-xs ${
                          isNull
                            ? 'text-yellow-500/80 italic'
                            : isBool
                            ? val
                              ? 'text-emerald-400 font-bold'
                              : 'text-red-400'
                            : 'text-[#DCDCDC]'
                        }`}
                      >
                        {isNull ? 'NULL' : isBool ? (val ? 'TRUE (1)' : 'FALSE (0)') : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
