import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  Tag,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  X,
  Share2,
} from 'lucide-react';
import { RegulationItem, RegulationCategory, RegulationPriority } from './types';
import { DEFAULT_REGULATIONS, CATEGORY_LABELS, PRIORITY_CONFIG } from './defaultRegulations';

const STORAGE_KEY = 'support_toolkit_regulations_v1';

export const RegulationsView: React.FC = () => {
  // Load regulations from localStorage or fall back to default
  const [regulations, setRegulations] = useState<RegulationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_REGULATIONS;
  });

  // Selected item
  const [selectedId, setSelectedId] = useState<string>(() => regulations[0]?.id || '');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<RegulationItem | null>(null);

  // Form State inside Modal
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<RegulationCategory>('ticket_creation');
  const [formPriority, setFormPriority] = useState<RegulationPriority>('standard');
  const [formDepartment, setFormDepartment] = useState('Technical Support');
  const [formSummary, setFormSummary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formTemplate, setFormTemplate] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(regulations));
    } catch {
      // Ignore
    }
  }, [regulations]);

  // Ensure selected ID is valid
  useEffect(() => {
    if (!regulations.some((r) => r.id === selectedId) && regulations.length > 0) {
      setSelectedId(regulations[0].id);
    }
  }, [regulations, selectedId]);

  // Filtered List
  const filteredRegulations = useMemo(() => {
    return regulations.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.steps.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchPriority = selectedPriority === 'all' || item.priority === selectedPriority;

      return matchSearch && matchCategory && matchPriority;
    });
  }, [regulations, searchTerm, selectedCategory, selectedPriority]);

  const activeItem = useMemo(() => {
    return regulations.find((r) => r.id === selectedId) || filteredRegulations[0] || null;
  }, [regulations, selectedId, filteredRegulations]);

  // Copy Template handler
  const handleCopyText = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('ticket_creation');
    setFormPriority('standard');
    setFormDepartment('Technical Support');
    setFormSummary('');
    setFormDescription('');
    setFormSteps('');
    setFormTemplate('');
    setFormTags('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: RegulationItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormDepartment(item.department || 'Technical Support');
    setFormSummary(item.summary);
    setFormDescription(item.description);
    setFormSteps(item.steps.join('\n'));
    setFormTemplate(item.templateText || '');
    setFormTags(item.tags.join(', '));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Modal Form (Create / Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Summary is required');
      return;
    }

    const stepsArray = formSteps
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const currentDate = new Date().toISOString().split('T')[0];

    if (modalMode === 'create') {
      const newItem: RegulationItem = {
        id: `reg-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        priority: formPriority,
        department: formDepartment.trim() || 'Technical Support',
        summary: formSummary.trim(),
        description: formDescription.trim() || formSummary.trim(),
        steps: stepsArray.length > 0 ? stepsArray : [formSummary.trim()],
        templateText: formTemplate.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : ['Support', 'SOP'],
        lastUpdated: currentDate,
      };

      setRegulations((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
    } else if (editingItem) {
      const updatedItem: RegulationItem = {
        ...editingItem,
        title: formTitle.trim(),
        category: formCategory,
        priority: formPriority,
        department: formDepartment.trim() || 'Technical Support',
        summary: formSummary.trim(),
        description: formDescription.trim() || formSummary.trim(),
        steps: stepsArray.length > 0 ? stepsArray : editingItem.steps,
        templateText: formTemplate.trim() || undefined,
        tags: tagsArray.length > 0 ? tagsArray : editingItem.tags,
        lastUpdated: currentDate,
      };

      setRegulations((prev) => prev.map((r) => (r.id === updatedItem.id ? updatedItem : r)));
    }

    setIsModalOpen(false);
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this instruction / regulation?')) {
      setRegulations((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Reset to default regulations
  const handleResetDefaults = () => {
    if (window.confirm('Reset all regulations to the standard default support team SOPs? Any custom items will be restored.')) {
      setRegulations(DEFAULT_REGULATIONS);
      setSelectedId(DEFAULT_REGULATIONS[0]?.id || '');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Top Header / Control Toolbar */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-5 py-3 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Support Team Regulations & Ticket Instructions
              </h2>
              <span className="bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                {regulations.length} SOPs Active
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Standard operating procedures, ticket creation rules, safety policies, and escalation guidelines.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-regulation"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white font-medium rounded shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Regulation / SOP
          </button>

          <button
            id="btn-reset-regulations"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Reset to default support regulations"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: Search, Filters & Regulations Master List (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col border-r border-[#3F3F46] bg-[#1E1E1E] overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-3 bg-[#252526] border-b border-[#3F3F46] space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#888888]" />
              <input
                id="search-regulations"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search regulations, SOPs, tickets, tags..."
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#007ACC] text-white border-[#007ACC]'
                    : 'bg-[#1E1E1E] text-[#888888] border-[#3F3F46] hover:text-white'
                }`}
              >
                All Categories ({regulations.length})
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
                const count = regulations.filter((r) => r.category === key).length;
                if (count === 0 && selectedCategory !== key) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
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
          </div>

          {/* List of Regulations */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#2F2F32]">
            {filteredRegulations.length === 0 ? (
              <div className="p-8 text-center text-[#888888] text-xs">
                <BookOpen className="w-8 h-8 mx-auto text-[#555555] mb-2" />
                No matching regulations or instructions found.
                <div className="mt-2">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedPriority('all');
                    }}
                    className="text-[#38BDF8] hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              filteredRegulations.map((item) => {
                const isSelected = activeItem?.id === item.id;
                const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.general;
                const priorityInfo = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.standard;

                return (
                  <div
                    key={item.id}
                    id={`reg-item-${item.id}`}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#2A2D30] border-l-4 border-l-[#007ACC]'
                        : 'hover:bg-[#252528] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            color: catInfo.color,
                            backgroundColor: catInfo.bg,
                            borderColor: `${catInfo.color}40`,
                          }}
                        >
                          {catInfo.label}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${priorityInfo.bg}`}
                        >
                          {priorityInfo.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#777777] font-mono shrink-0">
                        {item.lastUpdated}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-white leading-snug mb-1 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#AAAAAA] line-clamp-2 leading-relaxed mb-2">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-1 flex-wrap">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-[#181818] text-[#888888] px-1.5 py-0.5 rounded border border-[#333333]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.templateText && (
                        <span className="text-[9px] bg-sky-950/40 text-sky-400 border border-sky-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <FileText className="w-2.5 h-2.5" /> Template
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detailed Reading View & Actions (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-[#1E1E1E] overflow-hidden">
          {activeItem ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="p-4 bg-[#252526] border-b border-[#3F3F46] flex items-start justify-between gap-4 shrink-0">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: (CATEGORY_LABELS[activeItem.category] || CATEGORY_LABELS.general).color,
                        backgroundColor: (CATEGORY_LABELS[activeItem.category] || CATEGORY_LABELS.general).bg,
                        borderColor: `${(CATEGORY_LABELS[activeItem.category] || CATEGORY_LABELS.general).color}50`,
                      }}
                    >
                      {(CATEGORY_LABELS[activeItem.category] || CATEGORY_LABELS.general).label}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        (PRIORITY_CONFIG[activeItem.priority] || PRIORITY_CONFIG.standard).bg
                      }`}
                    >
                      {(PRIORITY_CONFIG[activeItem.priority] || PRIORITY_CONFIG.standard).label}
                    </span>

                    {activeItem.department && (
                      <span className="text-xs text-[#888888] flex items-center gap-1 font-mono">
                        <Building2 className="w-3 h-3 text-[#777777]" />
                        {activeItem.department}
                      </span>
                    )}

                    <span className="text-xs text-[#888888] flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-[#777777]" />
                      Updated: {activeItem.lastUpdated}
                    </span>
                  </div>

                  <h1 className="text-base font-bold text-white leading-snug">
                    {activeItem.title}
                  </h1>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="btn-edit-active-regulation"
                    onClick={() => handleOpenEdit(activeItem)}
                    className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1 transition-all"
                    title="Edit instruction"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Edit
                  </button>
                  <button
                    id="btn-delete-active-regulation"
                    onClick={() => handleDelete(activeItem.id)}
                    className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-rose-400 rounded border border-[#3F3F46] flex items-center gap-1 transition-all"
                    title="Delete instruction"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Detail Content Body (Scrollable) */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5 leading-relaxed">
                {/* Summary Card */}
                <div className="p-3.5 rounded-lg bg-[#252526] border border-[#3F3F46] text-xs text-[#CCCCCC] space-y-1">
                  <div className="font-semibold text-white uppercase tracking-wider text-[10px] text-[#38BDF8]">
                    Regulation Summary
                  </div>
                  <div className="text-sm font-normal text-[#E0E0E0]">{activeItem.summary}</div>
                  {activeItem.description && activeItem.description !== activeItem.summary && (
                    <p className="text-xs text-[#AAAAAA] pt-1.5 leading-relaxed border-t border-[#333333] mt-2">
                      {activeItem.description}
                    </p>
                  )}
                </div>

                {/* Step-by-Step Instructions & Requirements */}
                <div className="bg-[#252526] rounded-lg border border-[#3F3F46] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#3F3F46] pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Mandatory Steps & Instructions
                      </h3>
                    </div>
                    <span className="text-xs text-[#888888] font-mono">
                      {activeItem.steps.length} checklist items
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {activeItem.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded bg-[#1E1E1E] border border-[#333333] hover:border-[#444444] transition-colors"
                      >
                        <div className="w-5 h-5 rounded bg-[#007ACC]/20 text-[#38BDF8] border border-[#007ACC]/40 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="text-[#E0E0E0] leading-relaxed font-sans flex-1">
                          {step}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Standard Copyable Ticket / SQL Template if present */}
                {activeItem.templateText && (
                  <div className="bg-[#252526] rounded-lg border border-[#3F3F46] p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Ready-to-Use Ticket / Code Template
                        </h3>
                      </div>
                      <button
                        id="btn-copy-template-text"
                        onClick={() =>
                          handleCopyText(activeItem.templateText!, `template-${activeItem.id}`)
                        }
                        className="px-2.5 py-1 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 shadow-sm"
                      >
                        {copiedId === `template-${activeItem.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-[#181818] rounded border border-[#333333] text-xs font-mono text-[#D4D4D4] whitespace-pre-wrap select-all leading-relaxed overflow-x-auto">
                      {activeItem.templateText}
                    </pre>
                  </div>
                )}

                {/* Tags Footer */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-[#888888] flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags:
                  </span>
                  {activeItem.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#252526] text-[#CCCCCC] px-2.5 py-1 rounded-full border border-[#3F3F46]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#888888] text-xs">
              Select a regulation or instruction from the left panel to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#252526] rounded-lg border border-[#3F3F46] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#38BDF8]" />
                <h2 className="text-sm font-semibold text-white">
                  {modalMode === 'create' ? 'Add New Support Regulation / SOP' : 'Edit Support Regulation'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-white font-medium mb-1">
                  Title / SOP Name <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Standard Support Ticket Creation Guidelines"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  required
                />
              </div>

              {/* Category, Priority & Department Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] mb-1">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RegulationCategory)}
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCCCCC] mb-1">Priority / Severity:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as RegulationPriority)}
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  >
                    <option value="critical">Critical / Mandatory</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="standard">Standard SOP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCCCCC] mb-1">Department / Team:</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Tier 1 Support, Security"
                    className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-white font-medium mb-1">
                  Summary (Brief 1-2 sentence overview) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Key summary of what the agent or engineer needs to know"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                  required
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-[#CCCCCC] mb-1">Detailed Context / Description:</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Additional context, why this regulation exists, or background info..."
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none resize-none"
                />
              </div>

              {/* Steps / Checklist (One per line) */}
              <div>
                <label className="block text-white font-medium mb-1">
                  Step-by-Step Instructions (Enter each step on a new line):
                </label>
                <textarea
                  value={formSteps}
                  onChange={(e) => setFormSteps(e.target.value)}
                  rows={4}
                  placeholder="1. Verify target InspectionPlanId with user&#10;2. Capture exact browser console error log&#10;3. Fill out ticket template and assign priority"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Ready-to-use Template (Optional) */}
              <div>
                <label className="block text-[#CCCCCC] mb-1">
                  Ready-to-Use Ticket / Code Template (Optional):
                </label>
                <textarea
                  value={formTemplate}
                  onChange={(e) => setFormTemplate(e.target.value)}
                  rows={4}
                  placeholder="[TICKET TEMPLATE]&#10;InspectionPlanId:&#10;PlotId:&#10;Steps to Reproduce:&#10;Error Message:"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[#CCCCCC] mb-1">Tags (Comma-separated):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Ticket Creation, Mandatory, Database, GIS"
                  className="w-full bg-[#181818] text-white px-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none"
                />
              </div>

              {/* Modal Footer Controls */}
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
                  {modalMode === 'create' ? 'Save New Regulation' : 'Update Regulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
