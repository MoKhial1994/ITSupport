import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, FeatureTab } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { DatabaseExplorerView } from './components/DatabaseExplorer/DatabaseExplorerView';
import { SystemInfoView } from './components/SystemInfo/SystemInfoView';
import { SolutionExplorerView } from './components/SolutionExplorer/SolutionExplorerView';
import { ListFormatterView } from './components/ListFormatter/ListFormatterView';
import { JsonFormatterView } from './components/JsonFormatter/JsonFormatterView';
import { DeletePlotsView } from './components/DeletePlots/DeletePlotsView';
import { JwtDecoderView } from './components/JwtDecoder/JwtDecoderView';
import { RegulationsView } from './components/SupportRegulations/RegulationsView';
import { QueryBankView } from './components/QueryBank/QueryBankView';
import { QueryWizardView } from './components/QueryWizard/QueryWizardView';
import { NotesBankView } from './components/NotesBank/NotesBankView';
import { ActivityTrackerView } from './components/ActivityTracker/ActivityTrackerView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<FeatureTab>('activity_tracker');
  const [wizardQueryId, setWizardQueryId] = useState<string | null>(null);

  // Status Bar state
  const [connectionName, setConnectionName] = useState<string>('Production SQL Server (SalesDB)');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [rowsCount, setRowsCount] = useState<number | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleUpdateStatus = (
    msg: string,
    timeMs?: number,
    rows?: number,
    isExec: boolean = false,
    isErr: boolean = false,
    connName?: string
  ) => {
    setStatusText(msg);
    setExecutionTimeMs(timeMs);
    setRowsCount(rows);
    setIsExecuting(isExec);
    setHasError(isErr);
    if (connName) setConnectionName(connName);
  };

  const handleLaunchWizard = (queryId?: string) => {
    if (queryId) setWizardQueryId(queryId);
    setActiveTab('query_wizard');
    setStatusText('SQL Query Builder Wizard Active');
  };

  const handleSelectTab = (tab: FeatureTab) => {
    setActiveTab(tab);
    if (tab === 'activity_tracker') {
      setStatusText('Daily Work Activity & Ticket Tracker Active');
    } else if (tab === 'database') {
      setStatusText('Database Explorer Active');
    } else if (tab === 'formatter') {
      setStatusText('List & SQL Formatter Active');
    } else if (tab === 'json') {
      setStatusText('JSON Formatter & Validator Active');
    } else if (tab === 'delete_plots') {
      setStatusText('Delete Plots Script Generator Active');
    } else if (tab === 'jwt') {
      setStatusText('JWT Token Deserializer & Debugger Active');
    } else if (tab === 'regulations') {
      setStatusText('Support Regulations & Ticket Guidelines Active');
    } else if (tab === 'query_bank') {
      setStatusText('SQL Query Bank & Cards Active');
    } else if (tab === 'query_wizard') {
      setStatusText('SQL Query Builder Wizard Active');
    } else if (tab === 'notes_bank') {
      setStatusText('Notes Bank & Quick Cheatsheets Active');
    } else if (tab === 'system') {
      setStatusText('System Information Active');
    } else {
      setStatusText('.NET 8 WPF C# Solution Explorer Active');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden font-sans transition-colors duration-150">
      {/* Upper Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          activeConnectionName={connectionName}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 h-full overflow-hidden bg-[#1E1E1E] flex flex-col transition-colors duration-150">
          {activeTab === 'activity_tracker' && <ActivityTrackerView />}

          {activeTab === 'database' && (
            <DatabaseExplorerView onUpdateStatus={handleUpdateStatus} />
          )}

          {activeTab === 'formatter' && <ListFormatterView />}

          {activeTab === 'json' && <JsonFormatterView />}

          {activeTab === 'delete_plots' && <DeletePlotsView />}

          {activeTab === 'jwt' && <JwtDecoderView />}

          {activeTab === 'regulations' && <RegulationsView />}

          {activeTab === 'query_bank' && (
            <QueryBankView onLaunchWizard={handleLaunchWizard} />
          )}

          {activeTab === 'query_wizard' && (
            <QueryWizardView
              onUpdateStatus={handleUpdateStatus}
              initialQueryId={wizardQueryId}
            />
          )}

          {activeTab === 'notes_bank' && <NotesBankView />}

          {activeTab === 'system' && <SystemInfoView />}

          {activeTab === 'solution' && <SolutionExplorerView />}
        </main>
      </div>

      {/* Bottom WPF Status Bar */}
      <StatusBar
        connectionName={connectionName}
        statusText={statusText}
        executionTimeMs={executionTimeMs}
        rowsCount={rowsCount}
        isExecuting={isExecuting}
        hasError={hasError}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
