import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  Pin,
  PinOff,
  RotateCcw,
  Tag,
  X,
  Filter,
  Download,
  Upload,
  Calendar,
  LayoutGrid,
  List,
  Sparkles,
  Palette,
  Hash,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Minus,
} from 'lucide-react';
import {
  NoteItem,
  NoteColor,
  NOTE_COLOR_CONFIGS,
  DEFAULT_TOPICS,
} from './types';
import { DEFAULT_NOTES_BANK } from './defaultNotes';

const STORAGE_KEY = 'support_toolkit_notes_bank_v1';

export const NotesBankView: React.FC = () => {
  // Local state persistence
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_NOTES_BANK;
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title' | 'pinned'>('pinned');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Copy feedback tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expand / Collapse state (Set of note IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Minimize state (Set of note IDs)
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set());
  // Maximized note for full-screen / inspector modal view
  const [maximizedNote, setMaximizedNote] = useState<NoteItem | null>(null);

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

  // Expand All / Collapse All toggle
  const handleToggleExpandAll = () => {
    if (expandedIds.size >= filteredNotes.length && filteredNotes.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filteredNotes.map((n) => n.id)));
      setMinimizedIds(new Set());
    }
  };

  // Minimize All / Restore All toggle
  const handleToggleMinimizeAll = () => {
    if (minimizedIds.size >= filteredNotes.length && filteredNotes.length > 0) {
      setMinimizedIds(new Set());
    } else {
      setMinimizedIds(new Set(filteredNotes.map((n) => n.id)));
    }
  };

  // Maximize Card Modal
  const handleOpenMaximize = (e: React.MouseEvent, item: NoteItem) => {
    e.stopPropagation();
    setMaximizedNote(item);
  };

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<NoteItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState<string>('Database & SQL');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [formColor, setFormColor] = useState<NoteColor>('amber');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  // Distinct Topics dynamically calculated from existing notes + default topics
  const allTopics = useMemo(() => {
    const topicSet = new Set<string>(DEFAULT_TOPICS);
    notes.forEach((n) => {
      if (n.topic) topicSet.add(n.topic);
    });
    return Array.from(topicSet);
  }, [notes]);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    const result = notes.filter((item) => {
      // Search text match
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.topic.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));

      // Topic filter
      const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;

      // Color filter
      const matchesColor = selectedColor === 'all' || item.color === selectedColor;

      // Pinned filter
      const matchesPinned = !pinnedOnly || item.isPinned;

      return matchesSearch && matchesTopic && matchesColor && matchesPinned;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [notes, searchTerm, selectedTopic, selectedColor, pinnedOnly, sortBy]);

  // Copy Note content to clipboard
  const handleCopyNote = (e: React.MouseEvent, content: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Pin status
  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              isPinned: !n.isPinned,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setFormTitle('');
    setFormTopic(DEFAULT_TOPICS[0]);
    setCustomTopic('');
    setFormColor('amber');
    setFormContent('');
    setFormTags('');
    setFormPinned(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (e: React.MouseEvent, item: NoteItem) => {
    e.stopPropagation();
    setModalMode('edit');
    setEditingItem(item);
    setFormTitle(item.title);
    if (DEFAULT_TOPICS.includes(item.topic)) {
      setFormTopic(item.topic);
      setCustomTopic('');
    } else {
      setFormTopic('__custom__');
      setCustomTopic(item.topic);
    }
    setFormColor(item.color);
    setFormContent(item.content);
    setFormTags(item.tags.join(', '));
    setFormPinned(item.isPinned);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Delete Note
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // Save Note Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Note content is required');
      return;
    }

    const resolvedTopic =
      formTopic === '__custom__' ? customTopic.trim() || 'General' : formTopic;

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const now = new Date().toISOString();

    if (modalMode === 'create') {
      const newNote: NoteItem = {
        id: `note-${Date.now()}`,
        title: formTitle.trim(),
        topic: resolvedTopic,
        color: formColor,
        content: formContent.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['Note'],
        isPinned: formPinned,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
    } else if (editingItem) {
      const updatedNote: NoteItem = {
        ...editingItem,
        title: formTitle.trim(),
        topic: resolvedTopic,
        color: formColor,
        content: formContent.trim(),
        tags: tagsArray.length > 0 ? tagsArray : editingItem.tags,
        isPinned: formPinned,
        updatedAt: now,
      };
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    }

    setIsModalOpen(false);
  };

  // Export Notes to JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `support_notes_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Notes from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (window.confirm(`Import ${parsed.length} notes? This will merge with existing notes.`)) {
            setNotes((prev) => {
              const existingIds = new Set(prev.map((n) => n.id));
              const newItems = parsed.filter((item: NoteItem) => !existingIds.has(item.id));
              return [...newItems, ...prev];
            });
          }
        } else {
          alert('Invalid JSON file format. Expected an array of notes.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset to default notes
  const handleResetDefaults = () => {
    if (window.confirm('Reset Notes Bank to standard default support notes?')) {
      setNotes(DEFAULT_NOTES_BANK);
    }
  };

  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned).length, [notes]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-5 py-3 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Notes Bank & Quick Cheatsheets
              </h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                {notes.length} Notes ({pinnedCount} Pinned)
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Organize support runbooks, troubleshooting tips, and scratchpads by color and topic.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-note"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white font-medium rounded shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Note Card
          </button>

          <button
            id="btn-export-notes"
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Export Notes as JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export
          </button>

          <button
            id="btn-import-notes"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Import Notes from JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            id="btn-reset-notes"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Reset Notes Bank to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Filter, Search & Color Swatch Bar */}
      <div className="p-3.5 bg-[#252526] border-b border-[#3F3F46] flex flex-col gap-3 shrink-0">
        {/* Row 1: Search, Color Filters, and Pinned Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#888888]" />
            <input
              id="search-notes-bank"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes by title, content, or tag..."
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

          {/* Color Filter Swatches */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-[11px] text-[#888888] font-medium mr-1 flex items-center gap-1">
              <Palette className="w-3 h-3 text-amber-400" /> Color:
            </span>
            <button
              onClick={() => setSelectedColor('all')}
              className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium transition-all ${
                selectedColor === 'all'
                  ? 'bg-[#3E3E42] text-white border-[#555555]'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
            >
              ALL
            </button>

            {(Object.keys(NOTE_COLOR_CONFIGS) as NoteColor[]).map((colorKey) => {
              const cfg = NOTE_COLOR_CONFIGS[colorKey];
              const isSelected = selectedColor === colorKey;
              const count = notes.filter((n) => n.color === colorKey).length;

              return (
                <button
                  key={colorKey}
                  onClick={() => setSelectedColor(colorKey)}
                  className={`px-2 py-1 rounded-md border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected ? 'shadow-sm ring-1 ring-white/30' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? cfg.badgeBg : '#1E1E1E',
                    borderColor: isSelected ? cfg.accentText : `${cfg.accentText}40`,
                    color: cfg.accentText,
                  }}
                  title={`Filter by ${cfg.name}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  <span>{cfg.name}</span>
                  {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Pinned & Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="filter-pinned-only"
              onClick={() => setPinnedOnly((prev) => !prev)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all ${
                pinnedOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
              title="Show pinned notes only"
            >
              <Pin className={`w-3 h-3 ${pinnedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              Pinned {pinnedOnly && `(${pinnedCount})`}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#181818] text-[#CCCCCC] px-2.5 py-1 text-xs rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
            >
              <option value="pinned">Sort: Pinned First</option>
              <option value="updated">Sort: Last Updated</option>
              <option value="created">Sort: Date Created</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>

            {/* Expand / Collapse All Cards Toggle */}
            <button
              id="btn-toggle-expand-all-notes"
              onClick={handleToggleExpandAll}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all ${
                expandedIds.size > 0 && expandedIds.size >= filteredNotes.length
                  ? 'bg-[#007ACC]/20 text-[#38BDF8] border-[#007ACC]/50 shadow-xs'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
              title={
                expandedIds.size >= filteredNotes.length && filteredNotes.length > 0
                  ? 'Collapse All Cards'
                  : 'Expand All Cards'
              }
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span>
                {expandedIds.size >= filteredNotes.length && filteredNotes.length > 0
                  ? 'Collapse All'
                  : 'Expand All'}
              </span>
            </button>

            {/* Min / Restore All Cards Toggle */}
            <button
              id="btn-toggle-min-all-notes"
              onClick={handleToggleMinimizeAll}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all ${
                minimizedIds.size > 0 && minimizedIds.size >= filteredNotes.length
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-[#1E1E1E] text-[#888888] border-[#333333] hover:text-white'
              }`}
              title={
                minimizedIds.size >= filteredNotes.length && filteredNotes.length > 0
                  ? 'Restore All Cards'
                  : 'Minimize All Cards'
              }
            >
              <Minus className="w-3.5 h-3.5" />
              <span>
                {minimizedIds.size >= filteredNotes.length && filteredNotes.length > 0
                  ? 'Restore All'
                  : 'Min All'}
              </span>
            </button>

            <div className="flex items-center bg-[#181818] rounded border border-[#3F3F46] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid' ? 'bg-[#3E3E42] text-white' : 'text-[#888888] hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' ? 'bg-[#3E3E42] text-white' : 'text-[#888888] hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Topic Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-[#888888] font-medium mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Topic:
          </span>
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-2.5 py-0.5 rounded-full border transition-all text-xs whitespace-nowrap ${
              selectedTopic === 'all'
                ? 'bg-[#007ACC] text-white border-[#007ACC]'
                : 'bg-[#1E1E1E] text-[#888888] border-[#3F3F46] hover:text-white'
            }`}
          >
            All Topics ({notes.length})
          </button>
          {allTopics.map((topic) => {
            const count = notes.filter((n) => n.topic === topic).length;
            if (count === 0 && selectedTopic !== topic) return null;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-2.5 py-0.5 rounded-full border transition-all text-xs whitespace-nowrap ${
                  selectedTopic === topic
                    ? 'bg-[#007ACC] text-white border-[#007ACC]'
                    : 'bg-[#1E1E1E] text-[#888888] border-[#3F3F46] hover:text-white'
                }`}
              >
                {topic} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Cards Content Area */}
      <div className="flex-1 p-5 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-12 text-center text-[#888888] text-xs">
            <StickyNote className="w-10 h-10 mx-auto text-[#555555] mb-3" />
            No notes match your filter or search criteria.
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTopic('all');
                  setSelectedColor('all');
                  setPinnedOnly(false);
                }}
                className="text-[#38BDF8] hover:underline"
              >
                Clear all filters
              </button>
              <span>•</span>
              <button onClick={handleOpenCreate} className="text-amber-400 hover:underline">
                Create new note
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredNotes.map((item) => {
              const colorCfg = NOTE_COLOR_CONFIGS[item.color] || NOTE_COLOR_CONFIGS.amber;
              const isCopied = copiedId === item.id;
              const isExpanded = expandedIds.has(item.id);
              const isMinimized = minimizedIds.has(item.id);

              // Minimized Note Card (Compact Single-Row Strip)
              if (isMinimized) {
                return (
                  <div
                    key={item.id}
                    id={`note-card-min-${item.id}`}
                    className="group self-start w-full rounded-lg border p-2.5 bg-[#252526] hover:bg-[#2A2A2D] transition-all duration-150 flex items-center justify-between gap-2 shadow-xs"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: colorCfg.dotColor,
                      borderColor: isCopied ? '#10B981' : `${colorCfg.accentText}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <span
                        className="text-[9px] font-semibold px-2 py-0.2 rounded-full border shrink-0"
                        style={{
                          color: colorCfg.accentText,
                          backgroundColor: colorCfg.badgeBg,
                          borderColor: `${colorCfg.accentText}40`,
                        }}
                      >
                        {item.topic}
                      </span>
                      <h4
                        onClick={(e) => handleToggleMinimize(e, item.id)}
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-amber-300 transition-colors"
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
                        title="Restore note card"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Maximize Button */}
                      <button
                        onClick={(e) => handleOpenMaximize(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                        title="Maximize / Full inspect note"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy Content */}
                      <button
                        onClick={(e) => handleCopyNote(e, item.content, item.id)}
                        className="p-1 text-[#888888] hover:text-emerald-400 rounded hover:bg-[#333333] transition-colors"
                        title="Copy note content"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit Note */}
                      <button
                        onClick={(e) => handleOpenEdit(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Standard / Expanded Note Card
              return (
                <div
                  key={item.id}
                  id={`note-card-${item.id}`}
                  className={`group relative rounded-lg border p-4 bg-[#252526] hover:bg-[#2A2A2D] transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-xl ${
                    isCopied ? 'ring-2 ring-emerald-500/40 border-emerald-500' : ''
                  }`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: colorCfg.dotColor,
                    borderColor: isCopied
                      ? '#10B981'
                      : isExpanded
                      ? `${colorCfg.accentText}80`
                      : `${colorCfg.accentText}30`,
                  }}
                >
                  <div>
                    {/* Top Badge & Action Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Topic Pill */}
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: colorCfg.accentText,
                            backgroundColor: colorCfg.badgeBg,
                            borderColor: `${colorCfg.accentText}50`,
                          }}
                        >
                          {item.topic}
                        </span>

                        {/* Color indicator pill */}
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1"
                          style={{
                            color: colorCfg.accentText,
                            backgroundColor: '#181818',
                            borderColor: '#333333',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorCfg.dotColor }}
                          />
                          {colorCfg.name}
                        </span>
                      </div>

                      {/* Action Buttons: Min, Expand/Collapse, Maximize, Pin, Copy, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        {/* Minimize Button */}
                        <button
                          id={`btn-min-note-${item.id}`}
                          onClick={(e) => handleToggleMinimize(e, item.id)}
                          className="p-1 text-[#888888] hover:text-amber-300 rounded hover:bg-[#333333] transition-colors"
                          title="Minimize card"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Expand / Collapse Button */}
                        <button
                          id={`btn-expand-note-${item.id}`}
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className={`p-1 rounded transition-colors ${
                            isExpanded
                              ? 'text-[#38BDF8] bg-[#007ACC]/20'
                              : 'text-[#888888] hover:text-white hover:bg-[#333333]'
                          }`}
                          title={isExpanded ? 'Collapse note card' : 'Expand note card'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Maximize to Modal Button */}
                        <button
                          id={`btn-max-note-${item.id}`}
                          onClick={(e) => handleOpenMaximize(e, item)}
                          className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                          title="Maximize / Inspect note"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleTogglePin(e, item.id)}
                          className={`p-1 rounded transition-colors ${
                            item.isPinned
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-[#888888] hover:text-amber-400 hover:bg-[#333333]'
                          }`}
                          title={item.isPinned ? 'Unpin note' : 'Pin note to top'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-amber-400' : ''}`} />
                        </button>

                        <button
                          onClick={(e) => handleCopyNote(e, item.content, item.id)}
                          className="p-1 text-[#888888] hover:text-emerald-400 rounded hover:bg-[#333333] transition-colors"
                          title="Copy note content"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={(e) => handleOpenEdit(e, item)}
                          className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333] transition-colors"
                          title="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="p-1 text-[#888888] hover:text-rose-400 rounded hover:bg-[#333333] transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={(e) => handleOpenEdit(e, item)}
                      className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {item.isPinned && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                      {item.title}
                    </h3>

                    {/* Content Preview Box */}
                    <div
                      onClick={(e) => handleToggleExpand(e, item.id)}
                      className={`relative bg-[#181818] rounded border border-[#333333] p-3 text-xs leading-relaxed text-[#CCCCCC] whitespace-pre-wrap cursor-pointer font-mono transition-all duration-200 ${
                        isExpanded
                          ? 'max-h-none overflow-visible border-[#4F4F56]'
                          : 'max-h-28 overflow-hidden line-clamp-4'
                      }`}
                      title={isExpanded ? 'Click to collapse' : 'Click to expand'}
                    >
                      {item.content}
                      {!isExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent pointer-events-none flex items-end justify-center pb-0.5">
                          <span className="text-[9px] text-[#888888] group-hover:text-[#38BDF8] flex items-center gap-0.5 bg-[#1E1E1E]/90 px-1.5 py-0.5 rounded border border-[#333333]">
                            <ChevronDown className="w-2.5 h-2.5" /> Click to Expand
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Tags & Timestamp */}
                  <div className="mt-3 pt-2.5 border-t border-[#333333] flex items-center justify-between gap-2 text-[10px] text-[#888888]">
                    <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                      {(isExpanded ? item.tags : item.tags.slice(0, 3)).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#1E1E1E] text-[#AAAAAA] px-1.5 py-0.5 rounded border border-[#333333] flex items-center gap-0.5"
                        >
                          <Hash className="w-2.5 h-2.5 opacity-60" />
                          {tag}
                        </span>
                      ))}
                      {!isExpanded && item.tags.length > 3 && (
                        <span
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className="text-[#888888] hover:text-white cursor-pointer"
                        >
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact List View */
          <div className="bg-[#252526] rounded-lg border border-[#3F3F46] divide-y divide-[#333333] overflow-hidden">
            {filteredNotes.map((item) => {
              const colorCfg = NOTE_COLOR_CONFIGS[item.color] || NOTE_COLOR_CONFIGS.amber;
              const isCopied = copiedId === item.id;
              const isExpanded = expandedIds.has(item.id);
              const isMinimized = minimizedIds.has(item.id);

              if (isMinimized) {
                return (
                  <div
                    key={item.id}
                    className="p-2.5 hover:bg-[#2A2A2D] transition-colors flex items-center justify-between gap-3"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: colorCfg.dotColor,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <span
                        className="text-[9px] font-semibold px-2 py-0.2 rounded-full border shrink-0"
                        style={{
                          color: colorCfg.accentText,
                          backgroundColor: colorCfg.badgeBg,
                          borderColor: `${colorCfg.accentText}40`,
                        }}
                      >
                        {item.topic}
                      </span>
                      <h4
                        onClick={() => handleToggleMinimize(undefined as any, item.id)}
                        className="text-xs font-semibold text-white truncate cursor-pointer hover:text-amber-300 transition-colors"
                        title="Click to restore"
                      >
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleMinimize(e, item.id)}
                        className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#333333]"
                        title="Restore note"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenMaximize(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333]"
                        title="Maximize / Inspect note"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleCopyNote(e, item.content, item.id)}
                        className="p-1 text-[#888888] hover:text-emerald-400 rounded hover:bg-[#333333]"
                        title="Copy content"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-[#2A2A2D] transition-colors flex flex-col gap-2"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: colorCfg.dotColor,
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={(e) => handleToggleMinimize(e, item.id)}
                          className="p-0.5 text-[#888888] hover:text-amber-300 rounded"
                          title="Minimize note"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className="p-0.5 text-[#888888] hover:text-white rounded"
                          title={isExpanded ? 'Collapse note' : 'Expand note'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#38BDF8]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {item.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                        <h4
                          onClick={(e) => handleOpenEdit(e, item)}
                          className="text-xs font-semibold text-white truncate hover:text-amber-300 cursor-pointer"
                        >
                          {item.title}
                        </h4>
                        <span
                          className="text-[9px] font-semibold px-2 py-0.2 rounded-full border shrink-0"
                          style={{
                            color: colorCfg.accentText,
                            backgroundColor: colorCfg.badgeBg,
                            borderColor: `${colorCfg.accentText}40`,
                          }}
                        >
                          {item.topic}
                        </span>
                      </div>
                      {!isExpanded && (
                        <p
                          onClick={(e) => handleToggleExpand(e, item.id)}
                          className="text-xs text-[#AAAAAA] line-clamp-1 truncate font-mono cursor-pointer hover:text-white"
                        >
                          {item.content}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-1">
                        {(isExpanded ? item.tags : item.tags.slice(0, 2)).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-[#181818] text-[#888888] px-1.5 py-0.5 rounded border border-[#333333]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <span className="text-[10px] text-[#888888] font-mono">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={(e) => handleOpenMaximize(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333]"
                        title="Maximize / Inspect note"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleCopyNote(e, item.content, item.id)}
                        className="p-1 text-[#888888] hover:text-emerald-400 rounded hover:bg-[#333333]"
                        title="Copy note content"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleOpenEdit(e, item)}
                        className="p-1 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333]"
                        title="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-1 text-[#888888] hover:text-rose-400 rounded hover:bg-[#333333]"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      onClick={(e) => handleToggleExpand(e, item.id)}
                      className="bg-[#181818] rounded border border-[#333333] p-3 text-xs leading-relaxed text-[#CCCCCC] font-mono whitespace-pre-wrap cursor-pointer"
                    >
                      {item.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#252526] rounded-lg border border-[#3F3F46] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">
                  {modalMode === 'create' ? 'Create New Note Card' : 'Edit Note Card'}
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

              {/* Title */}
              <div>
                <label className="block text-white font-medium mb-1">
                  Note Title <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. GIS Sync Timeout Error Resolution (Error 504)"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  required
                />
              </div>

              {/* Topic & Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] mb-1">Topic / Category:</label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  >
                    {DEFAULT_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Topic...</option>
                  </select>

                  {formTopic === '__custom__' && (
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Enter custom topic name..."
                      className="mt-2 w-full bg-[#181818] text-white px-3 py-1.5 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none text-xs"
                      required
                    />
                  )}
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="block text-[#CCCCCC] mb-1">Card Color Theme:</label>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {(Object.keys(NOTE_COLOR_CONFIGS) as NoteColor[]).map((colorKey) => {
                      const cfg = NOTE_COLOR_CONFIGS[colorKey];
                      const isSelected = formColor === colorKey;

                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setFormColor(colorKey)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isSelected ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: cfg.dotColor }}
                          title={cfg.name}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pin Checkbox */}
              <div className="flex items-center gap-2 p-2 bg-[#181818] rounded border border-[#333333]">
                <input
                  type="checkbox"
                  id="modal-pin-checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="rounded bg-[#252526] border-[#3F3F46] text-[#007ACC] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="modal-pin-checkbox"
                  className="text-xs text-[#CCCCCC] flex items-center gap-1.5 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  Pin this note to the top of the bank
                </label>
              </div>

              {/* Content */}
              <div>
                <label className="block text-white font-medium mb-1">
                  Note Content / SOP / Checklist <span className="text-rose-400">*</span>:
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={8}
                  placeholder="Enter troubleshooting steps, checklist, connection strings, links, or procedures..."
                  className="w-full bg-[#181818] text-[#D4D4D4] p-3 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs resize-y leading-relaxed"
                  spellCheck={false}
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[#CCCCCC] mb-1">Tags (Comma-separated):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="GIS, SOP, Escalation, Timeout, Database"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
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
                  {modalMode === 'create' ? 'Save Note Card' : 'Update Note Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MAXIMIZED NOTE INSPECTOR MODAL */}
      {maximizedNote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#252526] rounded-xl border border-[#3F3F46] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <StickyNote className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {(() => {
                      const cfg = NOTE_COLOR_CONFIGS[maximizedNote.color] || NOTE_COLOR_CONFIGS.amber;
                      return (
                        <>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              color: cfg.accentText,
                              backgroundColor: cfg.badgeBg,
                              borderColor: `${cfg.accentText}40`,
                            }}
                          >
                            {maximizedNote.topic}
                          </span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1"
                            style={{
                              color: cfg.accentText,
                              backgroundColor: '#181818',
                              borderColor: '#333333',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cfg.dotColor }}
                            />
                            {cfg.name}
                          </span>
                          {maximizedNote.isPinned && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                              <Pin className="w-2.5 h-2.5 fill-amber-400" /> Pinned
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                    {maximizedNote.title}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => handleCopyNote(e, maximizedNote.content, maximizedNote.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
                    copiedId === maximizedNote.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#007ACC] hover:bg-[#0062A3] text-white'
                  }`}
                  title="Copy full note content"
                >
                  {copiedId === maximizedNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Note
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => {
                    const n = maximizedNote;
                    setMaximizedNote(null);
                    handleOpenEdit(e, n);
                  }}
                  className="p-1.5 text-[#888888] hover:text-[#38BDF8] rounded hover:bg-[#333333]"
                  title="Edit this note"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMaximizedNote(null)}
                  className="p-1.5 text-[#888888] hover:text-white rounded hover:bg-[#333333]"
                  title="Close maximized view"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-[#888888]">
                  <span className="font-mono text-[11px] flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-400" /> Full Note Content & Procedures
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    Select text or click Copy Note
                  </span>
                </div>
                <div className="bg-[#181818] rounded-lg border border-[#3F3F46] p-4 font-mono text-xs text-[#CCCCCC] leading-relaxed select-text whitespace-pre-wrap shadow-inner overflow-x-auto">
                  {maximizedNote.content}
                </div>
              </div>

              {/* Tags & Metadata */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#333333] flex-wrap text-xs">
                {maximizedNote.tags && maximizedNote.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-[#888888]" />
                    <span className="text-[11px] text-[#888888] mr-1">Tags:</span>
                    {maximizedNote.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-[#1E1E1E] text-[#AAAAAA] px-2 py-0.5 rounded border border-[#333333]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-[#888888] font-mono ml-auto">
                  <span>Created: {new Date(maximizedNote.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Updated: {new Date(maximizedNote.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#2D2D30] border-t border-[#3F3F46] flex items-center justify-between text-xs text-[#888888] shrink-0">
              <span className="font-mono text-[11px]">
                ID: {maximizedNote.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => setMaximizedNote(null)}
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
