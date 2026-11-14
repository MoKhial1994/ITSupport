import React, { useState } from 'react';
import { ConnectionConfig, DatabaseObject, QueryHistoryItem, QueryResult } from '../../types';
import { ConnectionManager } from './ConnectionManager';
import { SchemaExplorer } from './SchemaExplorer';
import { SqlEditor } from './SqlEditor';
import { QueryResults } from './QueryResults';
import { QueryHistory } from './QueryHistory';
import { executeSqlSimulated } from '../../services/mockSqlEngine';
import { initialConnections, sampleSchemaTree, initialQueryHistory } from '../../data/sampleDbData';
import { Server, Database, History, LayoutGrid } from 'lucide-react';

interface DatabaseExplorerViewProps {
  onUpdateStatus: (
    status: string,
    timeMs?: number,
    rows?: number,
    isExec?: boolean,
    isErr?: boolean,
    connName?: string
  ) => void;
}

export const DatabaseExplorerView: React.FC<DatabaseExplorerViewProps> = ({ onUpdateStatus }) => {
  const [connections, setConnections] = useState<ConnectionConfig[]>(initialConnections);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionConfig | null>(
    initialConnections[0]
  );
  const [leftTab, setLeftTab] = useState<'schema' | 'connections'>('schema');
  const [rightBottomTab, setRightBottomTab] = useState<'results' | 'history'>('results');

  const [schemaTree, setSchemaTree] = useState<DatabaseObject[]>(sampleSchemaTree);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT TOP 100 * FROM dbo.Customers ORDER BY AccountBalance DESC;'
  );

  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>(initialQueryHistory);

  // Connection Handlers
  const handleSaveConnection = (conn: ConnectionConfig) => {
    setConnections((prev) => {
      const idx = prev.findIndex((c) => c.id === conn.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = conn;
        return updated;
      }
      return [...prev, conn];
    });
    setSelectedConnection(conn);
    onUpdateStatus(`Saved connection ${conn.name}`, undefined, undefined, false, false, conn.name);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    if (selectedConnection?.id === id) {
      const remaining = connections.filter((c) => c.id !== id);
      setSelectedConnection(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleTestConnection = async (conn: ConnectionConfig): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600)); // simulate handshake
    return !!conn.server && !!conn.database;
  };

  const handleRefreshSchema = async () => {
    setIsLoadingSchema(true);
    await new Promise((r) => setTimeout(r, 500));
    setSchemaTree([...sampleSchemaTree]);
    setIsLoadingSchema(false);
    onUpdateStatus('Database schema refreshed', undefined, undefined, false, false, selectedConnection?.name);
  };

  // SQL Execution Handler
  const handleExecuteSql = (sqlToRun: string) => {
    if (!sqlToRun.trim()) return;

    setIsExecuting(true);
    onUpdateStatus('Executing SQL query...', undefined, undefined, true, false, selectedConnection?.name);

    setTimeout(() => {
      const result = executeSqlSimulated(
        sqlToRun,
        selectedConnection ? selectedConnection.name : 'SalesDB'
      );

      setQueryResult(result);
      setIsExecuting(false);
      setRightBottomTab('results');

      // Record History Item
      const newHistoryItem: QueryHistoryItem = {
        id: `h-${Date.now()}`,
        executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        queryText: sqlToRun,
        isSuccess: result.isSuccess,
        durationMs: result.executionTimeMs,
        rowsAffected: result.rowsAffected,
        connectionName: selectedConnection?.name || 'Local Server',
      };
      setHistory((prev) => [newHistoryItem, ...prev]);

      // Update status bar
      onUpdateStatus(
        result.message,
        result.executionTimeMs,
        result.rowsAffected,
        false,
        !result.isSuccess,
        selectedConnection?.name
      );
    }, 350);
  };

  const handleCancel = () => {
    setIsExecuting(false);
    onUpdateStatus('Query execution cancelled', undefined, undefined, false, true, selectedConnection?.name);
  };

  const handleClearEditor = () => {
    setSqlQuery('');
  };

  const handleExportCsv = () => {
    if (!queryResult || !queryResult.data || queryResult.data.length === 0) {
      alert('No query data available to export.');
      return;
    }

    const rows = queryResult.data;
    const cols = queryResult.columns || Object.keys(rows[0]);
    const csvContent = [
      cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(','),
      ...rows.map((r) =>
        cols.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `QueryExport_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectTableForQuery = (tableName: string) => {
    const query = `SELECT TOP 100 * FROM ${tableName};`;
    setSqlQuery(query);
    handleExecuteSql(query);
  };

  return (
    <div className="flex h-full w-full bg-[#1E1E1E] overflow-hidden">
      {/* Left Pane: Connections / Schema */}
      <div className="w-80 border-r border-[#3F3F46] flex flex-col bg-[#252526] shrink-0">
        {/* Left Pane Tabs */}
        <div className="flex bg-[#1E1E1E] border-b border-[#3F3F46] text-xs font-semibold select-none">
          <button
            onClick={() => setLeftTab('schema')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              leftTab === 'schema'
                ? 'border-[#007ACC] text-white bg-[#252526]'
                : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Schema</span>
          </button>
          <button
            onClick={() => setLeftTab('connections')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              leftTab === 'connections'
                ? 'border-[#007ACC] text-white bg-[#252526]'
                : 'border-transparent text-[#888888] hover:text-[#CCCCCC]'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connections</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {leftTab === 'schema' ? (
            <SchemaExplorer
              schemaTree={schemaTree}
              onSelectTableForQuery={handleSelectTableForQuery}
              onRefreshSchema={handleRefreshSchema}
              isLoading={isLoadingSchema}
            />
          ) : (
            <ConnectionManager
              connections={connections}
              selectedConnection={selectedConnection}
              onSelectConnection={(conn) => {
                setSelectedConnection(conn);
                onUpdateStatus('Connection selected', undefined, undefined, false, false, conn.name);
              }}
              onSaveConnection={handleSaveConnection}
              onDeleteConnection={handleDeleteConnection}
              onTestConnection={handleTestConnection}
            />
          )}
        </div>
      </div>

      {/* Right Pane: Split Vertical (SQL Editor on top, Results/History on bottom) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top: SQL Editor */}
        <div className="h-1/2 min-h-[220px]">
          <SqlEditor
            activeSql={sqlQuery}
            onSqlChange={setSqlQuery}
            onExecute={handleExecuteSql}
            onCancel={handleCancel}
            onClear={handleClearEditor}
            onExportCsv={handleExportCsv}
            isExecuting={isExecuting}
          />
        </div>

        {/* Horizontal Split Line */}
        <div className="h-1 bg-[#333333] hover:bg-[#007ACC] cursor-row-resize shadow-sm" />

        {/* Bottom: Results & History Pane */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E] overflow-hidden">
          {/* Results/History Tab Headers */}
          <div className="flex items-center justify-between bg-[#252526] border-b border-[#3F3F46] px-2 select-none">
            <div className="flex items-center text-xs font-semibold">
              <button
                onClick={() => setRightBottomTab('results')}
                className={`px-4 py-2 flex items-center gap-1.5 border-b-2 transition-colors ${
                  rightBottomTab === 'results'
                    ? 'border-[#007ACC] text-white bg-[#1E1E1E]'
                    : 'border-transparent text-[#888888] hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
                <span>Results Grid</span>
                {queryResult?.data && (
                  <span className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                    {queryResult.data.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setRightBottomTab('history')}
                className={`px-4 py-2 flex items-center gap-1.5 border-b-2 transition-colors ${
                  rightBottomTab === 'history'
                    ? 'border-[#007ACC] text-white bg-[#1E1E1E]'
                    : 'border-transparent text-[#888888] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Query History</span>
                <span className="text-[10px] bg-[#3E3E42] text-[#E0E0E0] px-1.5 py-0.2 rounded font-mono">
                  {history.length}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Pane Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightBottomTab === 'results' ? (
              <QueryResults result={queryResult} onExportCsv={handleExportCsv} />
            ) : (
              <QueryHistory
                history={history}
                onSelectQuery={(q) => {
                  setSqlQuery(q);
                  setRightBottomTab('results');
                }}
                onClearHistory={() => setHistory([])}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
