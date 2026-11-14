import React, { useState } from 'react';
import { DatabaseObject, DatabaseObjectType } from '../../types';
import {
  Folder,
  FolderOpen,
  Table,
  Eye,
  Settings,
  Calculator,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  Key,
  Database,
  Play,
} from 'lucide-react';

interface SchemaExplorerProps {
  schemaTree: DatabaseObject[];
  onSelectTableForQuery: (tableName: string) => void;
  onRefreshSchema: () => void;
  isLoading?: boolean;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemaTree,
  onSelectTableForQuery,
  onRefreshSchema,
  isLoading,
}) => {
  const [filterText, setFilterText] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'db-sales': true,
    'folder-tables': true,
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const matchesFilter = (node: DatabaseObject): boolean => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    if (node.name.toLowerCase().includes(lower) || node.details.toLowerCase().includes(lower)) {
      return true;
    }
    if (node.children) {
      return node.children.some(matchesFilter);
    }
    return false;
  };

  const getIconForType = (type: DatabaseObjectType, isExpanded?: boolean) => {
    switch (type) {
      case DatabaseObjectType.Database:
        return <Database className="w-4 h-4 text-blue-400 shrink-0" />;
      case DatabaseObjectType.Folder:
        return isExpanded ? (
          <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
        );
      case DatabaseObjectType.Table:
        return <Table className="w-4 h-4 text-emerald-400 shrink-0" />;
      case DatabaseObjectType.View:
        return <Eye className="w-4 h-4 text-cyan-400 shrink-0" />;
      case DatabaseObjectType.StoredProcedure:
        return <Settings className="w-4 h-4 text-purple-400 shrink-0" />;
      case DatabaseObjectType.Function:
        return <Calculator className="w-4 h-4 text-pink-400 shrink-0" />;
      case DatabaseObjectType.Column:
        return <Key className="w-3.5 h-3.5 text-[#AAAAAA] shrink-0" />;
      default:
        return <Database className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const renderNode = (node: DatabaseObject, level: number = 0) => {
    if (!matchesFilter(node)) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? node.isExpanded ?? false;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={(e) => {
            if (hasChildren) toggleExpand(node.id, e);
          }}
          style={{ paddingLeft: `${level * 14 + 6}px` }}
          className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-[#2D2D30] cursor-pointer text-xs group transition-colors"
        >
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="w-4 h-4 flex items-center justify-center text-[#888888] hover:text-white"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {getIconForType(node.type, isExpanded)}

          <span
            className={`font-mono text-xs truncate ${
              node.type === DatabaseObjectType.Table
                ? 'text-white font-medium'
                : node.type === DatabaseObjectType.Column
                ? 'text-[#CCCCCC]'
                : 'text-[#E0E0E0]'
            }`}
          >
            {node.name}
          </span>

          {node.details && (
            <span className="text-[10px] text-[#888888] italic truncate ml-auto pr-1">
              {node.details}
            </span>
          )}

          {node.type === DatabaseObjectType.Table && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTableForQuery(node.name);
              }}
              title="Query TOP 100 rows"
              className="hidden group-hover:flex items-center gap-1 bg-[#007ACC] hover:bg-[#0066B2] text-white text-[10px] px-1.5 py-0.5 rounded shadow shrink-0"
            >
              <Play className="w-2.5 h-2.5" />
              <span>SELECT</span>
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#E0E0E0] p-3 text-xs">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#3F3F46]">
        <span className="font-semibold text-white">Schema Browser</span>
        <button
          onClick={onRefreshSchema}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-2 py-1 rounded transition-colors"
          title="Refresh database schema"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter search box */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#888888]" />
        <input
          type="text"
          placeholder="Filter tables, views, columns..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded pl-8 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#007ACC]"
        />
        {filterText && (
          <button
            onClick={() => setFilterText('')}
            className="absolute right-2 top-1.5 text-xs text-[#888888] hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* Tree view list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 font-mono">
        {schemaTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
};
