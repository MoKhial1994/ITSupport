import React from 'react';
import { QueryHistoryItem } from '../../types';
import { Clock, CheckCircle2, XCircle, ArrowRightLeft, History } from 'lucide-react';

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (queryText: string) => void;
  onClearHistory: () => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] text-xs p-3 font-mono">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3F3F46]">
        <div className="flex items-center gap-2 font-semibold text-white">
          <History className="w-4 h-4 text-[#007ACC]" />
          <span>Session Query History ({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] text-[#888888] hover:text-red-400 font-sans"
          >
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#777777] font-sans">
          <p>No queries executed in this session yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-[#252526] border border-[#3F3F46] rounded p-2.5 hover:border-[#007ACC] transition-all group"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-2">
                  {item.isSuccess ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SUCCESS</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>FAILED</span>
                    </span>
                  )}
                  <span className="text-[#888888]">{item.connectionName}</span>
                </div>

                <div className="flex items-center gap-3 text-[#888888]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{item.durationMs} ms</span>
                  </span>
                  <span>{item.rowsAffected} rows</span>
                  <span className="text-[10px] text-[#666666]">{item.executedAt}</span>
                </div>
              </div>

              {/* Query Text Snippet */}
              <pre className="bg-[#1E1E1E] p-2 rounded text-[#DCDCDC] text-xs font-mono overflow-x-auto max-h-24 whitespace-pre-wrap leading-relaxed border border-[#333333]">
                {item.queryText}
              </pre>

              <div className="flex justify-end mt-1.5">
                <button
                  onClick={() => onSelectQuery(item.queryText)}
                  className="flex items-center gap-1 bg-[#007ACC] hover:bg-[#0066B2] text-white px-2 py-1 rounded text-[11px] font-sans font-medium transition-colors"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Load into Editor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
