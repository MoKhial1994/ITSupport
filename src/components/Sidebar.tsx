import React from 'react';
import { Database, Laptop, Code, ShieldCheck, Cpu, Quote, Trash2, KeyRound, BookOpen, Layers, StickyNote, Sun, Moon, Braces, Wand2, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type FeatureTab = 'activity_tracker' | 'database' | 'formatter' | 'json' | 'delete_plots' | 'jwt' | 'regulations' | 'query_bank' | 'query_wizard' | 'notes_bank' | 'system' | 'solution';

interface SidebarProps {
  activeTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  activeConnectionName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeConnectionName,
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <aside className="w-64 bg-[#252526] border-r border-[#3F3F46] flex flex-col justify-between select-none">
      <div>
        {/* Header Branding matching WPF App */}
        <div className="p-4 border-b border-[#3F3F46] bg-[#1E1E1E]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#007ACC] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm tracking-wide">
                SupportToolkit
              </h1>
              <span className="text-xs text-[#888888] font-mono block">
                .NET 8.0 WPF • MVVM
              </span>
            </div>
          </div>
        </div>

        {/* Feature Navigation List */}
        <div className="p-3">
          <div className="text-[11px] uppercase tracking-wider text-[#888888] font-semibold px-3 py-1.5 mb-1">
            Toolkit Features
          </div>

          <nav className="space-y-1">
            <button
              id="nav-tab-activity-tracker"
              onClick={() => onSelectTab('activity_tracker')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'activity_tracker'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>Daily Work Tracker</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1 rounded border border-emerald-500/30 font-mono">
                    LOG
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Tickets, Meetings & Calls
                </div>
              </div>
            </button>

            <button
              id="nav-tab-database-explorer"
              onClick={() => onSelectTab('database')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'database'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <div className="text-left">
                <div>Database Explorer</div>
                <div className="text-[10px] opacity-75 font-normal">
                  SQL Manager & Schema
                </div>
              </div>
            </button>

            <button
              id="nav-tab-list-formatter"
              onClick={() => onSelectTab('formatter')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'formatter'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Quote className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div>List & SQL Formatter</div>
                <div className="text-[10px] opacity-75 font-normal">
                  Single Quote & Delimiter Tool
                </div>
              </div>
            </button>

            <button
              id="nav-tab-json-formatter"
              onClick={() => onSelectTab('json')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'json'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Braces className="w-4 h-4 text-[#38BDF8]" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>JSON Formatter</span>
                  <span className="bg-[#38BDF8]/20 text-[#38BDF8] text-[9px] px-1 rounded border border-[#38BDF8]/30 font-mono">
                    JSON
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Prettify, Minify & Validate
                </div>
              </div>
            </button>

            <button
              id="nav-tab-delete-plots"
              onClick={() => onSelectTab('delete_plots')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'delete_plots'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <div className="text-left">
                <div>Delete Plots Generator</div>
                <div className="text-[10px] opacity-75 font-normal">
                  InspectionPlanId, PlotId, GISID
                </div>
              </div>
            </button>

            <button
              id="nav-tab-jwt-decoder"
              onClick={() => onSelectTab('jwt')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'jwt'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4 text-[#FB7185]" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>JWT Deserializer</span>
                  <span className="bg-[#FB7185]/20 text-[#FB7185] text-[9px] px-1 rounded border border-[#FB7185]/30 font-mono">
                    RFC
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Claims & Signature Verifier
                </div>
              </div>
            </button>

            <button
              id="nav-tab-support-regulations"
              onClick={() => onSelectTab('regulations')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'regulations'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>Support SOPs & Rules</span>
                  <span className="bg-[#38BDF8]/20 text-[#38BDF8] text-[9px] px-1 rounded border border-[#38BDF8]/30 font-mono">
                    SOP
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Ticket Creation & Guidelines
                </div>
              </div>
            </button>

            <button
              id="nav-tab-query-bank"
              onClick={() => onSelectTab('query_bank')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'query_bank'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>SQL Query Bank</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1 rounded border border-emerald-500/30 font-mono">
                    CARDS
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Quick-Copy Query Library
                </div>
              </div>
            </button>

            <button
              id="nav-tab-query-wizard"
              onClick={() => onSelectTab('query_wizard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'query_wizard'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>SQL Query Wizard</span>
                  <span className="bg-cyan-500/20 text-cyan-300 text-[9px] px-1 rounded border border-cyan-500/30 font-mono">
                    BUILDER
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Parameterized & Excel Lists
                </div>
              </div>
            </button>

            <button
              id="nav-tab-notes-bank"
              onClick={() => onSelectTab('notes_bank')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'notes_bank'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <StickyNote className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>Notes Bank</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1 rounded border border-amber-500/30 font-mono">
                    CARDS
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  Color-Coded Support Notes
                </div>
              </div>
            </button>

            <button
              id="nav-tab-system-info"
              onClick={() => onSelectTab('system')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'system'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <div className="text-left">
                <div>System Information</div>
                <div className="text-[10px] opacity-75 font-normal">
                  Hardware & OS Diagnostics
                </div>
              </div>
            </button>

            <button
              id="nav-tab-csharp-solution"
              onClick={() => onSelectTab('solution')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                activeTab === 'solution'
                  ? 'bg-[#007ACC] text-white shadow-md'
                  : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
              }`}
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>C# WPF Solution</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1 rounded border border-emerald-500/30 font-mono">
                    ZIP
                  </span>
                </div>
                <div className="text-[10px] opacity-75 font-normal">
                  .NET 8 Source Code & SLN
                </div>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Section: Theme Switcher & Connection Quick Info */}
      <div className="border-t border-[#3F3F46] bg-[#1E1E1E]/40 divide-y divide-[#3F3F46]">
        {/* Theme Switcher (Dark Mode / Light Mode) */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-[#888888] uppercase tracking-wider">
              Theme Mode
            </span>
            <span className="text-[10px] font-mono text-[#007ACC] bg-[#007ACC]/10 px-1.5 py-0.5 rounded border border-[#007ACC]/30">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#181818] rounded-md border border-[#3F3F46]">
            <button
              id="theme-btn-dark"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-[#007ACC] text-white shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-[#252526]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              id="theme-btn-light"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-[#007ACC] text-white shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-[#252526]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* Connection Quick Info Badge */}
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-[#888888] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium text-[#AAAAAA]">
              Active Connection
            </span>
          </div>
          <div
            className="text-xs font-medium text-[#E0E0E0] truncate bg-[#2D2D30] px-2.5 py-1.5 rounded border border-[#3F3F46]"
            title={activeConnectionName || 'None'}
          >
            {activeConnectionName || 'No Connection Selected'}
          </div>
        </div>
      </div>
    </aside>
  );
};
