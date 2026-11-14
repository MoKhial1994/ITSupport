import React, { useState } from 'react';
import { Play, Square, Trash2, FileSpreadsheet, Code2, Plus, X } from 'lucide-react';

interface TabItem {
  id: string;
  title: string;
  sql: string;
}

interface SqlEditorProps {
  activeSql: string;
  onSqlChange: (sql: string) => void;
  onExecute: (sql: string) => void;
  onCancel: () => void;
  onClear: () => void;
  onExportCsv: () => void;
  isExecuting?: boolean;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({
  activeSql,
  onSqlChange,
  onExecute,
  onCancel,
  onClear,
  onExportCsv,
  isExecuting,
}) => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'tab-1', title: 'Query 1.sql', sql: activeSql },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleTabSqlChange = (newSql: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, sql: newSql } : t))
    );
    onSqlChange(newSql);
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TabItem = {
      id: newId,
      title: `Query ${tabs.length + 1}.sql`,
      sql: 'SELECT TOP 100 * FROM dbo.Customers;',
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    onSqlChange(newTab.sql);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    const nextTabs = tabs.filter((t) => t.id !== id);
    setTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
      onSqlChange(nextTabs[nextTabs.length - 1].sql);
    }
  };

  const handleSelectTab = (tab: TabItem) => {
    setActiveTabId(tab.id);
    onSqlChange(tab.sql);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // F5 or Ctrl+Enter executes SQL
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      onExecute(activeTab.sql);
    }
  };

  const handleInsertSnippet = (snippetType: string) => {
    let snippet = '';
    switch (snippetType) {
      case 'select':
        snippet = `SELECT TOP 100 
    c.CustomerID,
    c.CompanyName,
    c.ContactEmail,
    c.AccountBalance
FROM dbo.Customers c
WHERE c.IsActive = 1
ORDER BY c.AccountBalance DESC;`;
        break;
      case 'join':
        snippet = `SELECT 
    c.CompanyName,
    o.OrderID,
    o.OrderDate,
    o.TotalAmount,
    o.OrderStatus
FROM dbo.Customers c
INNER JOIN dbo.Orders o ON c.CustomerID = o.CustomerID
WHERE o.OrderStatus = 'Completed';`;
        break;
      case 'insert':
        snippet = `INSERT INTO dbo.Customers (CompanyName, ContactName, ContactEmail, Country, AccountBalance, IsActive, CreatedAt)
VALUES ('Apex Global Corp', 'Marcus Thorne', 'm.thorne@apex.org', 'USA', 12500.00, 1, GETDATE());`;
        break;
      case 'update':
        snippet = `UPDATE dbo.Customers
SET AccountBalance = AccountBalance + 1000.00,
    IsActive = 1
WHERE Country = 'USA';`;
        break;
      case 'delete':
        snippet = `DELETE FROM dbo.AuditLogs
WHERE Timestamp < DATEADD(day, -30, GETDATE());`;
        break;
      case 'exec':
        snippet = `EXEC dbo.sp_GenerateAuditReport @DaysBack = 7;`;
        break;
      case 'create':
        snippet = `CREATE TABLE dbo.ServerMetrics (
    MetricID INT IDENTITY(1,1) PRIMARY KEY,
    ServerName VARCHAR(100) NOT NULL,
    CpuPercent DECIMAL(5,2) NOT NULL,
    MemoryAvailableMB INT NOT NULL,
    LoggedAt DATETIME2 DEFAULT GETDATE()
);`;
        break;
      default:
        return;
    }
    handleTabSqlChange(snippet);
  };

  // Calculate line numbers for display
  const lines = (activeTab?.sql || '').split('\n');

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] border-b border-[#3F3F46]">
      {/* Editor Tabs */}
      <div className="flex items-center bg-[#252526] border-b border-[#3F3F46] overflow-x-auto text-xs select-none px-1 pt-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => handleSelectTab(tab)}
              className={`flex items-center gap-2 px-3 py-1.5 border-t-2 rounded-t font-mono cursor-pointer transition-colors ${
                isActive
                  ? 'bg-[#1E1E1E] border-[#007ACC] text-white font-medium'
                  : 'border-transparent text-[#888888] hover:text-[#CCCCCC] hover:bg-[#2D2D30]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="hover:text-red-400 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleAddTab}
          className="px-2 py-1 text-[#888888] hover:text-white hover:bg-[#2D2D30] rounded ml-1"
          title="New Query Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#2D2D30]/60 border-b border-[#3F3F46] text-xs">
        <div className="flex items-center gap-1.5">
          <button
            id="btn-execute-sql"
            onClick={() => onExecute(activeTab.sql)}
            disabled={isExecuting}
            className="flex items-center gap-1.5 bg-[#007ACC] hover:bg-[#0066B2] text-white font-semibold px-3 py-1.5 rounded shadow transition-colors disabled:opacity-50"
            title="Execute SQL Query (F5 or Ctrl+Enter)"
          >
            <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-pulse' : ''}`} />
            <span>{isExecuting ? 'Executing...' : 'Execute (F5)'}</span>
          </button>

          {isExecuting && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 bg-red-800/80 hover:bg-red-800 text-white px-2.5 py-1.5 rounded transition-colors"
            >
              <Square className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={onClear}
            className="flex items-center gap-1 bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-2.5 py-1.5 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* SQL Snippets Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleInsertSnippet(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-[#1E1E1E] border border-[#3F3F46] text-[#E0E0E0] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#007ACC]"
          >
            <option value="" disabled>
              📋 Snippet Templates...
            </option>
            <option value="select">SELECT TOP 100 Customers</option>
            <option value="join">INNER JOIN Customers & Orders</option>
            <option value="insert">INSERT Statement</option>
            <option value="update">UPDATE Statement</option>
            <option value="delete">DELETE Statement</option>
            <option value="exec">EXEC Stored Procedure</option>
            <option value="create">CREATE TABLE Schema</option>
          </select>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-2.5 py-1 rounded transition-colors"
            title="Export Result Data to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers & Textarea */}
      <div className="flex-1 relative flex font-mono text-xs overflow-hidden">
        {/* Line Numbers sidebar */}
        <div className="w-10 bg-[#1E1E1E] text-[#666666] border-r border-[#333333] select-none py-2 text-right pr-2 font-mono leading-5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={activeTab.sql}
          onChange={(e) => handleTabSqlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="-- Write your T-SQL query here... Press F5 or Ctrl+Enter to Execute"
          spellCheck={false}
          className="flex-1 bg-[#1E1E1E] text-[#DCDCDC] p-2 leading-5 resize-none focus:outline-none font-mono selection:bg-[#264F78]"
        />
      </div>
    </div>
  );
};
