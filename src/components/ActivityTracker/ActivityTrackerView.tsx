import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HeartHandshake,
  Users,
  Code,
  Ticket,
  PhoneCall,
  Edit2,
  Trash2,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  BarChart2,
  Layers,
  X,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ActivityItem,
  ActivityCategory,
  ActivityStatus,
  ACTIVITY_CATEGORIES,
} from './types';
import {
  DEFAULT_ACTIVITIES,
  getTodayDateString,
  getOffsetDateString,
} from './defaultActivities';

const STORAGE_KEY = 'support_toolkit_daily_activities_v1';

export const ActivityTrackerView: React.FC = () => {
  // 1. Persistent Activity State (Survives project updates via localStorage)
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved activities from localStorage:', e);
    }
    return DEFAULT_ACTIVITIES;
  });

  // Save to localStorage on any state change with safety check
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.error('Failed to save activities to localStorage:', e);
    }
  }, [activities]);

  // 2. Navigation & Date filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [dateFilterMode, setDateFilterMode] = useState<'day' | 'all' | 'week'>('day');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3. Modal Form State (Add / Update)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('ticket');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formStatus, setFormStatus] = useState<ActivityStatus>('completed');
  const [formDate, setFormDate] = useState<string>(getTodayDateString());
  const [formTicketId, setFormTicketId] = useState<string>('');
  const [formCollaborators, setFormCollaborators] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formLink, setFormLink] = useState<string>('');

  // Copy feedback tracking
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // In-app Delete confirmation state (avoids window.confirm which is blocked in iframes)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // File input ref for JSON export/import backup
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date jump helpers
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString());
    setDateFilterMode('day');
  };

  // Open modal for Create
  const handleOpenAddModal = (presetCategory?: ActivityCategory) => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory(presetCategory || 'ticket');
    setFormDuration(30);
    setFormStatus('completed');
    setFormDate(selectedDate || getTodayDateString());
    setFormTicketId('');
    setFormCollaborators('');
    setFormNotes('');
    setFormLink('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: ActivityItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDuration(item.durationMinutes);
    setFormStatus(item.status);
    setFormDate(item.date);
    setFormTicketId(item.ticketId || '');
    setFormCollaborators(item.collaborators || '');
    setFormNotes(item.notes || '');
    setFormLink(item.link || '');
    setIsModalOpen(true);
  };

  // Submit Add / Update
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingItem) {
      // Update existing item
      setActivities((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                title: formTitle.trim(),
                category: formCategory,
                durationMinutes: Number(formDuration) || 0,
                status: formStatus,
                date: formDate,
                ticketId: formTicketId.trim() || undefined,
                collaborators: formCollaborators.trim() || undefined,
                notes: formNotes.trim() || undefined,
                link: formLink.trim() || undefined,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } else {
      // Create new item
      const newItem: ActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: formTitle.trim(),
        category: formCategory,
        durationMinutes: Number(formDuration) || 0,
        status: formStatus,
        date: formDate,
        ticketId: formTicketId.trim() || undefined,
        collaborators: formCollaborators.trim() || undefined,
        notes: formNotes.trim() || undefined,
        link: formLink.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActivities((prev) => [newItem, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete an activity directly (guaranteed to work in iframe environment)
  const handleDeleteActivity = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirmId(null);
    if (editingItem && editingItem.id === id) {
      setIsModalOpen(false);
    }
  };

  // Quick duplicate / copy activity
  const handleDuplicateActivity = (item: ActivityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${item.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActivities((prev) => [duplicated, ...prev]);
  };

  // Copy activity as text summary
  const handleCopySingle = (item: ActivityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const catLabel = ACTIVITY_CATEGORIES[item.category]?.label || item.category;
    const ticketStr = item.ticketId ? ` [${item.ticketId}]` : '';
    const text = `• [${catLabel}]${ticketStr} ${item.title} (${item.durationMinutes}m) - Status: ${item.status}${
      item.collaborators ? ` | With: ${item.collaborators}` : ''
    }${item.notes ? `\n  Notes: ${item.notes}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Daily / Period Summary to clipboard (for Standups / Timesheets / Slack)
  const handleCopyDaySummary = () => {
    if (filteredActivities.length === 0) return;
    const dateLabel = dateFilterMode === 'day' ? selectedDate : 'Work Log Summary';
    const lines = [
      `📅 Work Activities Summary (${dateLabel})`,
      `Total Hours: ${(totalMinutes / 60).toFixed(1)}h (${totalMinutes} mins) across ${filteredActivities.length} items`,
      '--------------------------------------------------',
    ];

    filteredActivities.forEach((act) => {
      const cat = ACTIVITY_CATEGORIES[act.category]?.label || act.category;
      const tId = act.ticketId ? ` [${act.ticketId}]` : '';
      lines.push(`• [${cat}]${tId} ${act.title} (${act.durationMinutes}m) - ${act.status}`);
      if (act.collaborators) lines.push(`  Collaborators: ${act.collaborators}`);
      if (act.notes) lines.push(`  Details: ${act.notes}`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Export activities to Excel (.xlsx) spreadsheet
  const handleExportExcel = () => {
    const listToExport = filteredActivities.length > 0 ? filteredActivities : activities;
    if (listToExport.length === 0) {
      return;
    }

    const excelRows = listToExport.map((act, index) => {
      const catCfg = ACTIVITY_CATEGORIES[act.category] || ACTIVITY_CATEGORIES.other;
      return {
        '#': index + 1,
        'Date': act.date,
        'Category': catCfg.label,
        'Activity Title': act.title,
        'Duration (Minutes)': act.durationMinutes,
        'Duration (Hours)': Number((act.durationMinutes / 60).toFixed(2)),
        'Status': act.status.toUpperCase(),
        'Ticket ID': act.ticketId || '',
        'Collaborators': act.collaborators || '',
        'Notes & Details': act.notes || '',
        'Link': act.link || '',
        'Logged At': act.createdAt,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Auto-fit column widths
    const colWidths = [
      { wch: 4 },  // #
      { wch: 12 }, // Date
      { wch: 18 }, // Category
      { wch: 40 }, // Activity Title
      { wch: 18 }, // Duration (Mins)
      { wch: 16 }, // Duration (Hours)
      { wch: 14 }, // Status
      { wch: 14 }, // Ticket ID
      { wch: 25 }, // Collaborators
      { wch: 45 }, // Notes & Details
      { wch: 30 }, // Link
      { wch: 20 }, // Logged At
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Work Activities');

    // Create a summary sheet with category totals
    const catSummary = Object.entries(ACTIVITY_CATEGORIES).map(([catKey, catCfg]) => {
      const catItems = listToExport.filter((a) => a.category === catKey);
      const catMins = catItems.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
      return {
        'Category': catCfg.label,
        'Tasks Count': catItems.length,
        'Total Minutes': catMins,
        'Total Hours': Number((catMins / 60).toFixed(2)),
      };
    }).filter((r) => r['Tasks Count'] > 0);

    const summaryWorksheet = XLSX.utils.json_to_sheet(catSummary);
    summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary & Analytics');

    const fileName = `Work_Activities_${dateFilterMode === 'day' ? selectedDate : getTodayDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export full JSON backup (data safe guarantee)
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-work-activities-backup-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with deduplication by ID
          const existingIds = new Set(activities.map((a) => a.id));
          const newItems = parsed.filter((item: any) => !existingIds.has(item.id));
          setActivities((prev) => [...newItems, ...prev]);
        }
      } catch (err) {
        console.error('Could not parse JSON backup file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Date filter
      if (dateFilterMode === 'day' && act.date !== selectedDate) {
        return false;
      }
      if (dateFilterMode === 'week') {
        // within +/- 6 days from today
        const actD = new Date(act.date);
        const todayD = new Date(getTodayDateString());
        const diffDays = Math.abs((todayD.getTime() - actD.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 7) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && act.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && act.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchTicket = act.ticketId?.toLowerCase().includes(q);
        const matchNotes = act.notes?.toLowerCase().includes(q);
        const matchCollab = act.collaborators?.toLowerCase().includes(q);
        if (!matchTitle && !matchTicket && !matchNotes && !matchCollab) return false;
      }

      return true;
    });
  }, [activities, selectedDate, dateFilterMode, categoryFilter, statusFilter, searchQuery]);

  // Statistics calculation for current view
  const { totalMinutes, categoryBreakdown, statusBreakdown } = useMemo(() => {
    let totalM = 0;
    const catMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    filteredActivities.forEach((act) => {
      totalM += act.durationMinutes || 0;
      catMap[act.category] = (catMap[act.category] || 0) + act.durationMinutes;
      statusMap[act.status] = (statusMap[act.status] || 0) + 1;
    });

    return {
      totalMinutes: totalM,
      categoryBreakdown: catMap,
      statusBreakdown: statusMap,
    };
  }, [filteredActivities]);

  // Render Category Icon
  const renderCategoryIcon = (category: ActivityCategory, className: string = 'w-4 h-4') => {
    switch (category) {
      case 'ticket':
        return <Ticket className={className} />;
      case 'meeting':
        return <Users className={className} />;
      case 'development':
        return <Code className={className} />;
      case 'call':
        return <PhoneCall className={className} />;
      case 'helping':
        return <HeartHandshake className={className} />;
      case 'asking_help':
        return <HelpCircle className={className} />;
      case 'review':
        return <CheckCircle2 className={className} />;
      case 'other':
      default:
        return <Layers className={className} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden select-none">
      {/* Hidden File Input for Data Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="bg-[#2D2D30] border-b border-[#3F3F46] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Daily Work Activity & Ticket Tracker
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono">
                Work Log
              </span>
            </h2>
            <p className="text-xs text-[#AAAAAA]">
              Log meetings, tickets solved, dev tasks, normal calls, helping others & questions asked
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyDaySummary}
            disabled={filteredActivities.length === 0}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Copy formatted daily log to clipboard for standup / Slack / Timesheets"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Log!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#007ACC]" />
                <span>Copy Standup Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-emerald-400 rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Export filtered activities to Excel (.xlsx) spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Download JSON backup so no data is ever lost"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Import previously saved activities JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import</span>
          </button>

          <button
            id="btn-add-activity"
            onClick={() => handleOpenAddModal()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded border border-emerald-500/50 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Quick Category Action Chips Bar */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-5 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[#888888] font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">
            Quick Add:
          </span>
          <button
            onClick={() => handleOpenAddModal('ticket')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-emerald-950/40 hover:border-emerald-500/40 text-emerald-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <Ticket className="w-3 h-3" /> + Ticket Solved
          </button>
          <button
            onClick={() => handleOpenAddModal('meeting')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-blue-950/40 hover:border-blue-500/40 text-blue-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <Users className="w-3 h-3" /> + Meeting
          </button>
          <button
            onClick={() => handleOpenAddModal('development')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-cyan-950/40 hover:border-cyan-500/40 text-cyan-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <Code className="w-3 h-3" /> + Development
          </button>
          <button
            onClick={() => handleOpenAddModal('call')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-purple-950/40 hover:border-purple-500/40 text-purple-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <PhoneCall className="w-3 h-3" /> + Normal Call
          </button>
          <button
            onClick={() => handleOpenAddModal('helping')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-amber-950/40 hover:border-amber-500/40 text-amber-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <HeartHandshake className="w-3 h-3" /> + Helped Colleague
          </button>
          <button
            onClick={() => handleOpenAddModal('asking_help')}
            className="px-2 py-1 bg-[#1E1E1E] hover:bg-rose-950/40 hover:border-rose-500/40 text-rose-400 border border-[#3F3F46] rounded flex items-center gap-1 transition-all"
          >
            <HelpCircle className="w-3 h-3" /> + Asked for Help
          </button>
        </div>

        {/* Local Storage Protection Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Auto-Saved Locally ({activities.length} total)</span>
        </div>
      </div>

      {/* Main Split Layout: Left Controls & List | Right Day Summary & Category Breakdown */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Column (8 cols): Filters, Date Navigation, & Activity Feed */}
        <div className="col-span-12 lg:col-span-8 border-r border-[#3F3F46] flex flex-col h-full bg-[#1E1E1E] overflow-hidden">
          {/* Filter Bar */}
          <div className="p-3 bg-[#252526] border-b border-[#3F3F46] flex flex-wrap items-center justify-between gap-2.5">
            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 bg-[#1E1E1E] p-1 rounded border border-[#3F3F46]">
              <button
                onClick={handlePrevDay}
                className="p-1 hover:bg-[#2D2D30] text-[#CCCCCC] hover:text-white rounded"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilterMode('day');
                }}
                className="bg-transparent text-xs font-mono text-[#E0E0E0] px-2 py-0.5 outline-none cursor-pointer"
              />

              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-[#2D2D30] text-[#CCCCCC] hover:text-white rounded"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-all ${
                  selectedDate === getTodayDateString() && dateFilterMode === 'day'
                    ? 'bg-[#007ACC] text-white'
                    : 'bg-[#2D2D30] text-[#AAAAAA] hover:text-white'
                }`}
              >
                Today
              </button>
            </div>

            {/* Date View Mode Toggle */}
            <div className="flex items-center bg-[#1E1E1E] p-0.5 rounded border border-[#3F3F46] text-xs">
              <button
                onClick={() => setDateFilterMode('day')}
                className={`px-2.5 py-1 rounded transition-all ${
                  dateFilterMode === 'day'
                    ? 'bg-[#007ACC] text-white font-medium'
                    : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                Single Day
              </button>
              <button
                onClick={() => setDateFilterMode('week')}
                className={`px-2.5 py-1 rounded transition-all ${
                  dateFilterMode === 'week'
                    ? 'bg-[#007ACC] text-white font-medium'
                    : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateFilterMode('all')}
                className={`px-2.5 py-1 rounded transition-all ${
                  dateFilterMode === 'all'
                    ? 'bg-[#007ACC] text-white font-medium'
                    : 'text-[#AAAAAA] hover:text-white'
                }`}
              >
                All History
              </button>
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1E1E1E] text-xs text-[#E0E0E0] border border-[#3F3F46] rounded px-2.5 py-1.5 focus:border-[#007ACC] outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(ACTIVITY_CATEGORIES).map(([catKey, catCfg]) => (
                <option key={catKey} value={catKey}>
                  {catCfg.label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1E1E1E] text-xs text-[#E0E0E0] border border-[#3F3F46] rounded px-2.5 py-1.5 focus:border-[#007ACC] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="planned">Planned</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket, topic, or person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E1E1E] text-xs text-[#E0E0E0] pl-8 pr-2.5 py-1.5 rounded border border-[#3F3F46] focus:border-[#007ACC] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Activities List Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-[#888888] space-y-3">
                <Clock className="w-12 h-12 stroke-[1.2] opacity-40 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-medium text-[#CCCCCC]">No Activities Found</h3>
                  <p className="text-xs text-[#777777] mt-1 max-w-sm">
                    {dateFilterMode === 'day'
                      ? `No work activity logged for ${selectedDate}. Click "Log Activity" above to record what you did!`
                      : 'No activities match the current filters.'}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Log First Activity
                </button>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const catCfg = ACTIVITY_CATEGORIES[act.category] || ACTIVITY_CATEGORIES.other;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleOpenEditModal(act)}
                    className="group bg-[#252526] hover:bg-[#2A2A2D] border border-[#3F3F46] hover:border-[#007ACC] p-3.5 rounded-lg transition-all cursor-pointer shadow-sm relative flex flex-col gap-2"
                  >
                    {/* Header: Category Badge, Ticket ID, Status, Duration, Actions */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Category Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1.5 border ${catCfg.colorBg} ${catCfg.colorText} ${catCfg.colorBorder}`}
                        >
                          {renderCategoryIcon(act.category, 'w-3 h-3')}
                          <span>{catCfg.label}</span>
                        </span>

                        {/* Optional Ticket ID */}
                        {act.ticketId && (
                          <span className="px-2 py-0.5 bg-[#1E1E1E] text-amber-400 font-mono text-[11px] rounded border border-amber-500/30">
                            #{act.ticketId}
                          </span>
                        )}

                        {/* Status Tag */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            act.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : act.status === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-300'
                              : act.status === 'blocked'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}
                        >
                          {act.status.replace('_', ' ')}
                        </span>

                        {/* Date badge if not filtering by single day */}
                        {dateFilterMode !== 'day' && (
                          <span className="text-[11px] font-mono text-[#888888] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {act.date}
                          </span>
                        )}
                      </div>

                      {/* Right: Duration & Quick Actions */}
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#1E1E1E] text-[#CCCCCC] font-mono text-xs rounded border border-[#3F3F46] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#007ACC]" />
                          {act.durationMinutes} min
                        </span>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => handleCopySingle(act, e)}
                            className="p-1.5 hover:bg-[#333333] text-[#AAAAAA] hover:text-white rounded"
                            title="Copy summary line"
                          >
                            {copiedId === act.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDuplicateActivity(act, e)}
                            className="p-1.5 hover:bg-[#333333] text-[#AAAAAA] hover:text-white rounded"
                            title="Duplicate activity"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(act)}
                            className="p-1.5 hover:bg-[#333333] text-[#AAAAAA] hover:text-white rounded"
                            title="Edit activity"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#007ACC]" />
                          </button>
                          {deleteConfirmId === act.id ? (
                            <div
                              className="flex items-center gap-1 bg-rose-950/90 px-1 py-0.5 rounded border border-rose-500/60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => handleDeleteActivity(act.id, e)}
                                className="px-1.5 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                                title="Click to permanently delete"
                              >
                                Delete?
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1 py-0.5 text-[11px] text-zinc-400 hover:text-white"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(act.id);
                              }}
                              className="p-1.5 hover:bg-rose-950/40 text-[#888888] hover:text-rose-400 rounded transition-colors"
                              title="Delete activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <span>{act.title}</span>
                      {act.link && (
                        <a
                          href={act.link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#007ACC] hover:underline flex items-center gap-0.5 text-xs font-normal"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Collaborators if present */}
                    {act.collaborators && (
                      <div className="text-xs text-amber-300/90 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>With: {act.collaborators}</span>
                      </div>
                    )}

                    {/* Notes & Details */}
                    {act.notes && (
                      <div className="text-xs text-[#BBBBBB] bg-[#1E1E1E]/80 p-2.5 rounded border border-[#333333] font-sans leading-relaxed whitespace-pre-wrap">
                        {act.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Day Summary, Category Breakdown & Analytics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full bg-[#252526] overflow-y-auto">
          {/* Daily Analytics Header */}
          <div className="p-4 border-b border-[#3F3F46] bg-[#2D2D30]/60">
            <h3 className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Day Work Overview
            </h3>
            <p className="text-[11px] text-[#888888] mt-0.5">
              {dateFilterMode === 'day' ? `Summary for ${selectedDate}` : 'Filtered View Summary'}
            </p>
          </div>

          <div className="p-4 space-y-5 text-xs">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#1E1E1E] p-3 rounded border border-[#3F3F46]">
                <div className="text-[11px] text-[#888888] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Total Time
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {(totalMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-[#888888]">hours</span>
                </div>
                <div className="text-[10px] text-[#888888] mt-0.5">{totalMinutes} minutes total</div>
              </div>

              <div className="bg-[#1E1E1E] p-3 rounded border border-[#3F3F46]">
                <div className="text-[11px] text-[#888888] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#007ACC]" />
                  Items Logged
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  {filteredActivities.length} <span className="text-xs font-normal text-[#888888]">tasks</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {statusBreakdown.completed || 0} completed
                </div>
              </div>
            </div>

            {/* Time by Category Breakdown */}
            <div className="space-y-2.5">
              <label className="text-[#CCCCCC] font-semibold block flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                Time Spent by Category:
              </label>

              <div className="space-y-2">
                {Object.entries(ACTIVITY_CATEGORIES).map(([catKey, catCfg]) => {
                  const minutes = categoryBreakdown[catKey] || 0;
                  const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
                  if (minutes === 0) return null;

                  return (
                    <div key={catKey} className="bg-[#1E1E1E] p-2.5 rounded border border-[#3F3F46] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium flex items-center gap-1.5 ${catCfg.colorText}`}>
                          {renderCategoryIcon(catKey as ActivityCategory, 'w-3.5 h-3.5')}
                          {catCfg.label}
                        </span>
                        <span className="font-mono text-[#CCCCCC]">
                          {minutes}m <span className="text-[11px] text-[#888888]">({percentage}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#333333] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            catKey === 'ticket'
                              ? 'bg-emerald-400'
                              : catKey === 'meeting'
                              ? 'bg-blue-400'
                              : catKey === 'development'
                              ? 'bg-cyan-400'
                              : catKey === 'call'
                              ? 'bg-purple-400'
                              : catKey === 'helping'
                              ? 'bg-amber-400'
                              : catKey === 'asking_help'
                              ? 'bg-rose-400'
                              : 'bg-indigo-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {totalMinutes === 0 && (
                  <div className="text-[11px] text-[#777777] italic py-2 text-center bg-[#1E1E1E] rounded border border-[#333333]">
                    No duration logged yet for this period.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Standup Helper Box */}
            <div className="bg-[#1E1E1E] p-3 rounded-lg border border-[#3F3F46] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#CCCCCC] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Daily Standup Helper
                </span>
                <button
                  onClick={handleCopyDaySummary}
                  className="text-[11px] text-[#007ACC] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Text
                </button>
              </div>
              <p className="text-[11px] text-[#888888] leading-relaxed">
                Need to report what you did today? Click copy to generate a structured bulleted summary
                categorized by meetings, tickets solved, dev tasks, and team collaborations.
              </p>
            </div>

            {/* Data Safety & Backup Guarantee Notice */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[11px] space-y-1.5">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zero Data Loss Guarantee
              </div>
              <p className="text-[#AAAAAA] leading-relaxed">
                Your activities are saved continuously into your browser's local database. You can also click{' '}
                <strong className="text-white">"Export Backup"</strong> anytime to save a JSON file on your machine.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#252526] border border-[#3F3F46] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-sm font-semibold text-white">
                  {editingItem ? 'Update Work Activity' : 'Log New Work Activity'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-white p-1 rounded hover:bg-[#333333]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveActivity} className="p-5 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[#CCCCCC] font-semibold mb-1">
                  Activity Title / Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Debugged missing index on plots table, sprint planning meeting..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">Activity Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none"
                  >
                    <option value="ticket">Ticket Solving (Bugs / Support)</option>
                    <option value="meeting">Meeting (Standup / Sync)</option>
                    <option value="development">Development (Code / Features)</option>
                    <option value="call">Normal Call (1:1 / Phone)</option>
                    <option value="helping">Helping Others (Colleagues)</option>
                    <option value="asking_help">Asking for Help (Escalation)</option>
                    <option value="review">Code / Ticket Review (QA)</option>
                    <option value="other">Other Activity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              </div>

              {/* Date & Duration (Minutes) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">
                    Duration (Minutes)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value) || 0)}
                      className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none font-mono"
                    />
                    <div className="flex gap-1">
                      {[15, 30, 60, 90].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormDuration(m)}
                          className="px-1.5 py-1 bg-[#333333] hover:bg-[#3E3E42] rounded text-[10px] text-[#CCCCCC]"
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Ticket ID & Collaborators */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">
                    Ticket # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SUP-4921 or INC-102"
                    value={formTicketId}
                    onChange={(e) => setFormTicketId(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#CCCCCC] font-semibold mb-1">
                    People Involved / Asked / Helped (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah M., Omar (Lead), Team"
                    value={formCollaborators}
                    onChange={(e) => setFormCollaborators(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none"
                  />
                </div>
              </div>

              {/* Notes / Details */}
              <div>
                <label className="block text-[#CCCCCC] font-semibold mb-1">
                  Notes & Outcome Details (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Key decisions, solution summary, PR link, reason blocked..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded p-2 text-white focus:border-[#007ACC] outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3F3F46]">
                <div>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(editingItem.id)}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white text-xs font-medium rounded border border-rose-800/70 flex items-center gap-1.5 transition-colors"
                      title="Delete this activity record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Activity</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded shadow flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingItem ? 'Save Changes' : 'Record Activity'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
