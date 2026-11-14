import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Tag,
  X,
  Code2,
  Layers,
  Terminal,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Minus,
  Wand2,
} from 'lucide-react';
import {
  QueryCardItem,
  QueryCategory,
  SqlOperationType,
  SQL_OPERATION_STYLES,
  detectSqlOperation,
} from './types';
import { DEFAULT_QUERY_BANK, QUERY_CATEGORIES } from './defaultQueries';

const STORAGE_KEY = 'support_toolkit_query_bank_v1';

interface QueryBankViewProps {
  onLaunchWizard?: (queryId?: string) => void;
}

// SQL Syntax Highlighter function for card code preview
function highlightSql(sql: string): React.ReactNode {
  const lines = sql.split('\n');
  return lines.map((line, lineIdx) => {
    // Comment line
    if (line.trim().startsWith('--')) {
      return (
        <div key={lineIdx} className="text-[#6B7280] italic">
          {line}
        </div>
      );
    }

    // Split line by comments, string literals, keywords, numbers
    const parts = line.split(
      /(\-\-.*$|'[^']*'|\b(?:SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|CROSS APPLY|OUTER APPLY|GROUP BY|ORDER BY|HAVING|IN|ON|WITH|NOLOCK|AS|AND|OR|NOT|TOP|DISTINCT|COUNT|SUM|AVG|MIN|MAX|STRING_AGG|INSERT INTO|INSERT|VALUES|UPDATE|SET|DELETE FROM|DELETE|DROP|TRUNCATE|EXEC|EXECUTE|BEGIN TRANSACTION|BEGIN TRAN|COMMIT TRANSACTION|COMMIT|ROLLBACK TRANSACTION|ROLLBACK)\b|\b\d+\b)/gi
    );

    return (
      <div key={lineIdx} className="leading-relaxed">
        {parts.map((part, partIdx) => {
          if (!part) return null;
          const upper = part.toUpperCase();

          if (part.startsWith('--')) {
            return (
              <span key={partIdx} className="text-[#6B7280] italic">
                {part}
              </span>
            );
          }
          if (part.startsWith("'") && part.endsWith("'")) {
            return (
              <span key={partIdx} className="text-[#FDE047]">
                {part}
              </span>
            );
          }
          if (/^\d+$/.test(part)) {
            return (
              <span key={partIdx} className="text-[#F472B6]">
                {part}
              </span>
            );
          }
          if (
            /^(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|CROSS APPLY|OUTER APPLY|GROUP BY|ORDER BY|HAVING|IN|ON|WITH|NOLOCK|AS|AND|OR|NOT|TOP|DISTINCT|COUNT|SUM|AVG|MIN|MAX|STRING_AGG)$/i.test(
              upper
            )
          ) {
            return (
              <span key={partIdx} className="text-[#38BDF8] font-semibold">
                {part}
              </span>
            );
          }
          if (/^(INSERT INTO|INSERT|VALUES)$/i.test(upper)) {
            return (
              <span key={partIdx} className="text-[#34D399] font-bold">
                {part}
              </span>
            );
          }
          if (/^(UPDATE|SET)$/i.test(upper)) {
            return (
              <span key={partIdx} className="text-[#FBBF24] font-bold">
                {part}
              </span>
            );
          }
          if (/^(DELETE FROM|DELETE|DROP|TRUNCATE)$/i.test(upper)) {
            return (
              <span key={partIdx} className="text-[#F87171] font-bold">
                {part}
              </span>
            );
          }
          if (/^(EXEC|EXECUTE)$/i.test(upper)) {
            return (
              <span key={partIdx} className="text-[#C084FC] font-bold">
                {part}
              </span>
            );
          }
          if (
            /^(BEGIN TRANSACTION|BEGIN TRAN|COMMIT TRANSACTION|COMMIT|ROLLBACK TRANSACTION|ROLLBACK)$/i.test(
              upper
            )
          ) {
            return (
              <span key={partIdx} className="text-[#818CF8] font-bold">
                {part}
              </span>
            );
          }
          return (
            <span key={partIdx} className="text-[#D4D4D4]">
              {part}
            </span>
          );
        })}
      </div>
    );
  });
}

export const QueryBankView: React.FC<QueryBankViewProps> = ({ onLaunchWizard }) => {
  // Persistence via localStorage
  const [queries, setQueries] = useState<QueryCardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_QUERY_BANK;
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOpType, setSelectedOpType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expand / Minimize / Maximize card states
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set());
  const [maximizedQuery, setMaximizedQuery] = useState<QueryCardItem | null>(null);

  // Toggle single card expand/collapse
  const handleToggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // If minimized, restore first
    if (minimizedIds.has(id)) {
      setMinimizedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle single card minimize/restore
  const handleToggleMinimize = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand All / Collapse All
  const handleToggleExpandAll = () => {
    if (expandedIds.size >= filteredQueries.length && filteredQueries.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredQueries.map((q) => q.id)));
      setMinimizedIds(new Set());
    }
  };

  // Minimize All / Restore All
  const handleToggleMinimizeAll = () => {
    if (minimizedIds.size >= filteredQueries.length && filteredQueries.length > 0) {
      setMinimizedIds(new Set());
    } else {
      setMinimizedIds(new Set(filteredQueries.map((q) => q.id)));
    }
  };

  // Maximize Card Modal
  const handleOpenMaximize = (e: React.MouseEvent, item: QueryCardItem) => {
    e.stopPropagation();
    setMaximizedQuery(item);
  };

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<QueryCardItem | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<QueryCategory>('inspection_plots');
  const [formDatabase, setFormDatabase] = useState('Production SQL');
  const [formDescription, setFormDescription] = useState('');
  const [formSql, setFormSql] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
    } catch {
      // Ignore
    }
  }, [queries]);

  // Enriched queries with detected operation type
  const processedQueries = useMemo(() => {
    return queries.map((item) => ({
      ...item,
      operationType: item.operationType || detectSqlOperation(item.sql),
    }));
  }, [queries]);

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return processedQueries.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sql.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesOp = selectedOpType === 'all' || item.operationType === selectedOpType;

      return matchesSearch && matchesCat && matchesOp;
    });
  }, [processedQueries, searchTerm, selectedCategory, selectedOpType]);

  // Copy Query to clipboard
  const handleCopyQuery = (queryText: string, id: string) => {
    navigator.clipboard.writeText(queryText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('inspection_plots');
    setFormDatabase('Production SQL');
    setFormDescription('');
    setFormSql('');
    setFormTags('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (e: React.MouseEvent, item: QueryCardItem) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDatabase(item.database || 'Production SQL');
    setFormDescription(item.description);
    setFormSql(item.sql);
    setFormTags(item.tags.join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Delete Query
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this query from the Query Bank?')) {
      setQueries((prev) => prev.filter((q) => q.id !== id));
    }
  };

  // Save Modal
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formSql.trim()) {
      setFormError('SQL Query is required');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const detectedOp = detectSqlOperation(formSql.trim());

    if (modalMode === 'create') {
      const newItem: QueryCardItem = {
        id: `qb-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        database: formDatabase.trim() || 'Production SQL',
        description: formDescription.trim() || formTitle.trim(),
        sql: formSql.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['SQL', 'Query'],
        operationType: detectedOp,
      };
      setQueries((prev) => [newItem, ...prev]);
    } else if (editingItem) {
      const updatedItem: QueryCardItem = {
        ...editingItem,
        title: formTitle.trim(),
        category: formCategory,
        database: formDatabase.trim() || 'Production SQL',
        description: formDescription.trim() || formTitle.trim(),
        sql: formSql.trim(),
        tags: tagsArray.length > 0 ? tagsArray : editingItem.tags,
        operationType: detectedOp,
      };
      setQueries((prev) => prev.map((q) => (q.id === updatedItem.id ? updatedItem : q)));
    }

    setIsModalOpen(false);
  };

  // Reset to default query bank
  const handleResetDefaults = () => {
    if (window.confirm('Reset Query Bank to standard default support queries?')) {
      setQueries(DEFAULT_QUERY_BANK);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-5 py-3 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                SQL Query Bank & Snippets
              </h2>
              <span className="bg-[#007ACC]/20 text-[#38BDF8] border border-[#007ACC]/40 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                {queries.length} Queries Stored
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Color-coded SQL library (SELECT, INSERT, UPDATE, DELETE, EXEC). Click any card to copy its query.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onLaunchWizard && (
            <button
              id="btn-launch-wizard"
              onClick={() => onLaunchWizard()}
              className="px-3 py-1.5 bg-cyan-600/25 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-all"
              title="Launch the SQL Query Builder Wizard"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              SQL Query Wizard
            </button>
          )}

          <button
            id="btn-add-query"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white font-medium rounded shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Query to Bank
          </button>

          <button
            id="btn-reset-queries"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Reset queries to standard default support list"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Filter, Search & SQL Operation Selector Bar */}
      <div className="p-3.5 bg-[#252526] border-b border-[#3F3F46] flex flex-col gap-3 shrink-0">
        {/* Row 1: Search & SQL Operation Type Filter Pills */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#888888]" />
            <input
              id="search-query-bank"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search queries by title, SQL, or tag..."
              className="w-full bg-[#181818] text-[#CCCCCC] pl-8 pr-8 py-1.5 text-xs rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-[#888888] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Operation Type Quick Filter (SELECT, INSERT, UPDATE, DELETE, etc.) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-[11px] text-[#888888] font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Op Type:
            </span>
            <button
              onClick={() => setSelectedOpType('all')}
              className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-all ${
                selectedOpType === 'all'
                  ? 'bg-[#3E3E42] text-white border-[#555555]'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
            >
              ALL
            </button>

            {(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXEC', 'TRANSACTION'] as SqlOperationType[]).map(
              (op) => {
                const style = SQL_OPERATION_STYLES[op];
                const isSelected = selectedOpType === op;
                const count = processedQueries.filter((q) => q.operationType === op).length;

                return (
                  <button
                    key={op}
                    onClick={() => setSelectedOpType(op)}
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'shadow-sm'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      color: style.color,
                      backgroundColor: isSelected ? style.badgeBg : '#1E1E1E',
                      borderColor: isSelected ? style.color : `${style.color}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: style.color }}
                    />
                    {op} {count > 0 && <span className="opacity-75 text-[10px]">({count})</span>}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Chips & Bulk View Toggles */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] text-[#888888] font-medium mr-1">Category:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-0.5 rounded-full border transition-all text-xs whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#007ACC] text-white border-[#007ACC]'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#3F3F46] hover:text-white'
              }`}
            >
              All ({queries.length})
            </button>
            {Object.entries(QUERY_CATEGORIES).map(([key, cat]) => {
              const count = queries.filter((q) => q.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-2.5 py-0.5 rounded-full border transition-all text-xs whitespace-nowrap ${
                    selectedCategory === key
                      ? 'bg-[#007ACC] text-white border-[#007ACC]'
                      : 'bg-[#1E1E1E] text-[#888888] border-[#3F3F46] hover:text-white'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Expand All & Min All controls */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <button
              id="btn-toggle-expand-all-queries"
              onClick={handleToggleExpandAll}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-all ${
                expandedIds.size > 0 && expandedIds.size >= filteredQueries.length
                  ? 'bg-[#007ACC]/20 text-[#38BDF8] border-[#007ACC]/50 shadow-xs'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
              title={
                expandedIds.size >= filteredQueries.length && filteredQueries.length > 0
                  ? 'Collapse All Code Previews'
                  : 'Expand All Code Previews'
              }
            >
              <ChevronsUpDown className="w-3 h-3" />
              <span>
                {expandedIds.size >= filteredQueries.length && filteredQueries.length > 0
                  ? 'Collapse All'
                  : 'Expand All'}
              </span>
            </button>

            <button
              id="btn-toggle-min-all-queries"
              onClick={handleToggleMinimizeAll}
              className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 transition-all ${
                minimizedIds.size > 0 && minimizedIds.size >= filteredQueries.length
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
              title={
                minimizedIds.size >= filteredQueries.length && filteredQueries.length > 0
                  ? 'Restore All Cards'
                  : 'Minimize All Cards'
              }
            >
              <Minus className="w-3 h-3" />
              <span>
                {minimizedIds.size >= filteredQueries.length && filteredQueries.length > 0
                  ? 'Restore All'
                  : 'Min All'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid View of Query Cards */}
      <div className="flex-1 p-5 overflow-y-auto">
        {filteredQueries.length === 0 ? (
          <div className="p-12 text-center text-[#888888] text-xs">
            <Database className="w-10 h-10 mx-auto text-[#555555] mb-3" />
            No queries match your search or filter criteria.
            <div className="mt-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedOpType('all');
                }}
                className="text-[#38BDF8] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredQueries.map((item) => {
              const catInfo = QUERY_CATEGORIES[item.category] || QUERY_CATEGORIES.general;
              const opType = item.operationType || 'OTHER';
              const opStyle = SQL_OPERATION_STYLES[opType] || SQL_OPERATION_STYLES.OTHER;
              const isCopied = copiedId === item.id;
              const isExpanded = expandedIds.has(item.id);
              const isMinimized = minimizedIds.has(item.id);

              // Render Minimized Card
              if (isMinimized) {
                return (
                  <div
                    key={item.id}
                    id={`query-card-min-${item.id}`}
                    className="group self-start w-full rounded-lg border p-2.5 bg-[#252526] hover:bg-[#2A2A2D] transition-all duration-150 flex items-center justify-between gap-2 shadow-xs"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: opStyle.color,
                      borderColor: isCopied ? '#10B981' : `${opStyle.color}40`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border shrink-0"
                        style={{
                          color: opStyle.color,
                          backgroundColor: opStyle.badgeBg,
                          borderColor: `${opStyle.color}60`,
                        }}
                      >
                        {opStyle.label}
                      </span>
                      <h4
                        onClick={(e) => handleToggleMinimize(e, item.id)}
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-[#38BDF8] transition-colors"
                        title="Click to restore card"
                      >
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Restore Button */}
                      <button
                        onClick={(e) => handleToggleMinimize(e, item.id)}
                        className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#333333] transition-colors"
                        title="Restore card"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Maximize Button */}
                      <button
                        onClick={(e) => handleOpenMaximize(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                        title="Maximize / Full inspect query"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy SQL */}
                      <button
                        onClick={() => handleCopyQuery(item.sql, item.id)}
                        className="p-1 text-[#888888] hover:text-emerald-400 rounded hover:bg-[#333333] transition-colors"
                        title="Copy SQL"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit Query */}
                      <button
                        onClick={(e) => handleOpenEdit(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                        title="Edit query"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Standard / Expanded Card
              return (
                <div
                  key={item.id}
                  id={`query-card-${item.id}`}
                  className={`group relative rounded-lg border p-4 bg-[#252526] hover:bg-[#2A2A2D] transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl ${
                    isCopied
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : isExpanded
                      ? 'border-[#007ACC]/60'
                      : `${opStyle.cardBorder}`
                  }`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: opStyle.color,
                  }}
                >
                  <div>
                    {/* Top Metadata Badge & Action Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Operation Badge (SELECT, INSERT, UPDATE, DELETE) */}
                        <span
                          className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border tracking-wider shadow-xs"
                          style={{
                            color: opStyle.color,
                            backgroundColor: opStyle.badgeBg,
                            borderColor: `${opStyle.color}60`,
                          }}
                        >
                          {opStyle.label}
                        </span>

                        {/* Category Badge */}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: catInfo.color,
                            backgroundColor: catInfo.bg,
                            borderColor: `${catInfo.color}40`,
                          }}
                        >
                          {catInfo.label}
                        </span>

                        {/* Database Target */}
                        {item.database && (
                          <span className="text-[10px] text-[#888888] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#333333] font-mono">
                            {item.database}
                          </span>
                        )}
                      </div>

                      {/* Card Actions (Min, Expand, Max, Edit, Delete) */}
                      <div className="flex items-center gap-1">
                        {/* Minimize Card Button */}
                        <button
                          onClick={(e) => handleToggleMinimize(e, item.id)}
                          className="p-1 text-[#888888] hover:text-amber-300 rounded hover:bg-[#333333] transition-colors"
                          title="Minimize card"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Expand / Collapse Inline Code */}
                        <button
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className={`p-1 rounded transition-colors ${
                            isExpanded
                              ? 'text-[#38BDF8] bg-[#007ACC]/20'
                              : 'text-[#888888] hover:text-white hover:bg-[#333333]'
                          }`}
                          title={isExpanded ? 'Collapse code preview' : 'Expand full code'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Maximize to Modal Button */}
                        <button
                          onClick={(e) => handleOpenMaximize(e, item)}
                          className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                          title="Maximize / Inspect query dialog"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleOpenEdit(e, item)}
                          className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                          title="Edit query"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1 text-[#888888] hover:text-rose-400 rounded hover:bg-[#333333] transition-colors"
                          title="Delete query"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3
                      onClick={() => handleCopyQuery(item.sql, item.id)}
                      className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-[#38BDF8] transition-colors cursor-pointer"
                      title="Click title to copy SQL"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#AAAAAA] line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Syntax-Highlighted Code Snippet Box with Click-to-Expand / Copy */}
                    <div
                      onClick={(e) => handleToggleExpand(e, item.id)}
                      className={`relative bg-[#181818] rounded border border-[#333333] p-3 font-mono text-xs leading-relaxed transition-all duration-200 cursor-pointer ${
                        isExpanded
                          ? 'max-h-none overflow-visible border-[#007ACC]/50'
                          : 'max-h-40 overflow-hidden line-clamp-5'
                      }`}
                      title={isExpanded ? 'Click to collapse code' : 'Click to expand full code'}
                    >
                      <div className="whitespace-pre-wrap select-text">
                        {highlightSql(item.sql)}
                      </div>
                      {!isExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#181818] via-[#181818]/75 to-transparent pointer-events-none flex items-end justify-center pb-1">
                          <span className="text-[9px] text-[#888888] group-hover:text-[#38BDF8] flex items-center gap-0.5 bg-[#1E1E1E]/95 px-2 py-0.5 rounded border border-[#333333]">
                            <ChevronDown className="w-2.5 h-2.5" /> Click to Expand
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Copy Prompt & Tags */}
                  <div className="mt-3 pt-3 border-t border-[#333333] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                      {(isExpanded ? item.tags : item.tags.slice(0, 3)).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-[#1E1E1E] text-[#888888] px-1.5 py-0.5 rounded border border-[#333333]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {!isExpanded && item.tags.length > 3 && (
                        <span
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className="text-[9px] text-[#666666] hover:text-white cursor-pointer"
                        >
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {onLaunchWizard && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLaunchWizard(item.id);
                          }}
                          className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                          title="Open this query in SQL Query Builder Wizard"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Run in Wizard</span>
                        </button>
                      )}

                      <div
                        onClick={() => handleCopyQuery(item.sql, item.id)}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium cursor-pointer"
                      >
                        {isCopied ? (
                          <span className="text-emerald-400 flex items-center gap-1 animate-pulse font-semibold">
                            <Check className="w-3.5 h-3.5" /> Copied!
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 group-hover:underline"
                            style={{ color: opStyle.color }}
                          >
                            <Copy className="w-3 h-3" /> Click to Copy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#252526] rounded-lg border border-[#3F3F46] w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#38BDF8]" />
                <h2 className="text-sm font-semibold text-white">
                  {modalMode === 'create' ? 'Add Query to Bank' : 'Edit Query Card'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-1">
                  Query Title <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Cascade Delete Corrupted Inspection Plan & Questions"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] mb-1">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as QueryCategory)}
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  >
                    {Object.entries(QUERY_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCCCCC] mb-1">Target Database / Engine:</label>
                  <input
                    type="text"
                    value={formDatabase}
                    onChange={(e) => setFormDatabase(e.target.value)}
                    placeholder="e.g. Production SQL, PostgreSQL, Auth DB"
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#CCCCCC] mb-1">Brief Description:</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What this query does and when to run it"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-white font-medium">
                    SQL Query Statement <span className="text-rose-400">*</span>:
                  </label>
                  {formSql.trim() && (
                    <span
                      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border"
                      style={{
                        color: SQL_OPERATION_STYLES[detectSqlOperation(formSql)].color,
                        backgroundColor: SQL_OPERATION_STYLES[detectSqlOperation(formSql)].badgeBg,
                        borderColor: `${SQL_OPERATION_STYLES[detectSqlOperation(formSql)].color}60`,
                      }}
                    >
                      Detected: {detectSqlOperation(formSql)}
                    </span>
                  )}
                </div>
                <textarea
                  value={formSql}
                  onChange={(e) => setFormSql(e.target.value)}
                  rows={6}
                  placeholder="SELECT * FROM TableName WHERE ...&#10;or DELETE FROM ...&#10;or UPDATE ... SET ..."
                  className="w-full bg-[#181818] text-[#D4D4D4] p-3 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs resize-none leading-relaxed"
                  spellCheck={false}
                  required
                />
              </div>

              <div>
                <label className="block text-[#CCCCCC] mb-1">Tags (Comma-separated):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Inspection, GIS, Cleanup, Performance, Delete"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#3F3F46] flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white font-medium rounded shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {modalMode === 'create' ? 'Save Query Card' : 'Update Query Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MAXIMIZED QUERY INSPECTOR MODAL */}
      {maximizedQuery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#252526] rounded-xl border border-[#3F3F46] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="w-5 h-5 text-[#38BDF8] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {(() => {
                      const op = maximizedQuery.operationType || 'OTHER';
                      const opSt = SQL_OPERATION_STYLES[op] || SQL_OPERATION_STYLES.OTHER;
                      const cat = QUERY_CATEGORIES[maximizedQuery.category] || QUERY_CATEGORIES.general;
                      return (
                        <>
                          <span
                            className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border"
                            style={{
                              color: opSt.color,
                              backgroundColor: opSt.badgeBg,
                              borderColor: `${opSt.color}60`,
                            }}
                          >
                            {opSt.label}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              color: cat.color,
                              backgroundColor: cat.bg,
                              borderColor: `${cat.color}40`,
                            }}
                          >
                            {cat.label}
                          </span>
                          {maximizedQuery.database && (
                            <span className="text-[10px] text-[#AAAAAA] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#333333] font-mono">
                              {maximizedQuery.database}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                    {maximizedQuery.title}
                  </h2>
                </div>
              </div>

              {/* Top Action Icons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyQuery(maximizedQuery.sql, maximizedQuery.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                    copiedId === maximizedQuery.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#007ACC] hover:bg-[#0062A3] text-white'
                  }`}
                  title="Copy full SQL statement"
                >
                  {copiedId === maximizedQuery.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy SQL
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    const q = maximizedQuery;
                    setMaximizedQuery(null);
                    handleOpenEdit(e, q);
                  }}
                  className="p-1.5 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333]"
                  title="Edit this query"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMaximizedQuery(null)}
                  className="p-1.5 text-[#888888] hover:text-white rounded hover:bg-[#333333]"
                  title="Close maximized view"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {maximizedQuery.description && (
                <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#333333] text-xs text-[#CCCCCC] leading-relaxed">
                  <span className="text-[10px] uppercase tracking-wider text-[#888888] font-bold block mb-1">
                    Description & Purpose
                  </span>
                  {maximizedQuery.description}
                </div>
              )}

              {/* Full Syntax Highlighted SQL Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-[#888888]">
                  <span className="font-mono text-[11px] flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#38BDF8]" /> Full SQL Statement ({maximizedQuery.sql.split('\n').length} lines)
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    Select text to copy partially or click Copy SQL
                  </span>
                </div>
                <div className="bg-[#181818] rounded-lg border border-[#3F3F46] p-4 font-mono text-xs text-[#CCCCCC] leading-relaxed select-text overflow-x-auto shadow-inner">
                  {highlightSql(maximizedQuery.sql)}
                </div>
              </div>

              {/* Tags list */}
              {maximizedQuery.tags && maximizedQuery.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <Tag className="w-3.5 h-3.5 text-[#888888]" />
                  <span className="text-[11px] text-[#888888] mr-1">Tags:</span>
                  {maximizedQuery.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-[#1E1E1E] text-[#AAAAAA] px-2 py-0.5 rounded border border-[#333333]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#2D2D30] border-t border-[#3F3F46] flex items-center justify-between text-xs text-[#888888] shrink-0">
              <span className="font-mono text-[11px]">
                ID: {maximizedQuery.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => setMaximizedQuery(null)}
                className="px-4 py-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] text-white rounded text-xs transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
