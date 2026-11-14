import React from 'react';
import { Database, Clock, Server, CheckCircle2, AlertTriangle, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StatusBarProps {
  connectionName: string;
  statusText: string;
  executionTimeMs?: number;
  rowsCount?: number;
  isExecuting?: boolean;
  hasError?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  connectionName,
  statusText,
  executionTimeMs,
  rowsCount,
  isExecuting,
  hasError,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="h-7 bg-[#007ACC] text-white text-xs flex items-center justify-between px-3 select-none font-mono shadow-inner z-10">
      <div className="flex items-center gap-4 truncate">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 truncate max-w-[280px]">
          <Database className="w-3.5 h-3.5 text-blue-200 shrink-0" />
          <span className="truncate">{connectionName || 'Disconnected'}</span>
        </div>

        {/* Separator */}
        <span className="text-blue-300/50">|</span>

        {/* Query status */}
        <div className="flex items-center gap-1.5 truncate">
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-300 shrink-0" />
          ) : hasError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          )}
          <span className="truncate">{statusText}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-blue-100 text-[11px]">
        {executionTimeMs !== undefined && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-200" />
            <span>{executionTimeMs} ms</span>
          </div>
        )}

        {rowsCount !== undefined && (
          <div className="bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px]">
            {rowsCount} row(s)
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-blue-200/80 border-l border-blue-400/30 pl-3">
          <Server className="w-3 h-3" />
          <span>.NET 8.0 WPF</span>
        </div>

        {/* Quick Theme Switcher */}
        <button
          id="statusbar-toggle-theme"
          onClick={toggleTheme}
          className="flex items-center gap-1 bg-blue-900/40 hover:bg-blue-900/70 border border-blue-400/30 px-2 py-0.5 rounded text-[10px] text-white transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-2.5 h-2.5 text-blue-200" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-2.5 h-2.5 text-yellow-300" />
              <span>Light</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
