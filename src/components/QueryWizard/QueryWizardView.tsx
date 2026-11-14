import React, { useState, useEffect, useMemo } from 'react';
import {
  Wand2,
  Database,
  Search,
  Check,
  ChevronRight,
  ArrowLeft,
  Play,
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  FileCode,
  Download,
  Copy,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Table,
} from 'lucide-react';
import { QueryCardItem } from '../QueryBank/types';
import { DEFAULT_QUERY_BANK, QUERY_CATEGORIES } from '../QueryBank/defaultQueries';
import {
  WizardStep,
  QueryParameterDefinition,
  ParameterValueState,
  ParameterDataType,
} from './types';
import {
  detectParametersFromSql,
  validateParameterValues,
  generateParameterizedSql,
  ParameterizedSqlResult,
} from './queryParameterUtils';
import { ExcelImportModal } from './ExcelImportModal';
import { TableVariableExcelModal } from './TableVariableExcelModal';
import { executeParameterizedSqlSimulated } from '../../services/mockSqlEngine';
import { QueryResult } from '../../types';

const STORAGE_KEY = 'support_toolkit_query_bank_v1';

interface QueryWizardViewProps {
  onUpdateStatus?: (
    status: string,
    timeMs?: number,
    rows?: number,
    isExec?: boolean,
    isErr?: boolean,
    connName?: string
  ) => void;
  initialQueryId?: string | null;
}

export const QueryWizardView: React.FC<QueryWizardViewProps> = ({
  onUpdateStatus,
  initialQueryId,
}) => {
  // 1. Wizard Steps state
  const [currentStep, setCurrentStep] = useState<WizardStep>('select_query');

  // 2. Query Bank queries
  const [queries, setQueries] = useState<QueryCardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_QUERY_BANK;
  });

  // Query selection & filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuery, setSelectedQuery] = useState<QueryCardItem | null>(null);

  // If initialQueryId provided, preselect it
  useEffect(() => {
    if (initialQueryId) {
      const found = queries.find((q) => q.id === initialQueryId);
      if (found) {
        setSelectedQuery(found);
      }
    } else if (!selectedQuery && queries.length > 0) {
      setSelectedQuery(queries[0]);
    }
  }, [initialQueryId, queries]);

  // 3. Parameters definitions and values state
  const [parameters, setParameters] = useState<QueryParameterDefinition[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, ParameterValueState>>({});
  const [manualInputBuffers, setManualInputBuffers] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

  // 4. Modals state
  const [activeExcelParam, setActiveExcelParam] = useState<QueryParameterDefinition | null>(null);
  const [activeTableVarParam, setActiveTableVarParam] = useState<QueryParameterDefinition | null>(null);

  // 5. Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<QueryResult | null>(null);
  const [confirmedExecution, setConfirmedExecution] = useState<boolean>(false);
  const [resultsActiveTab, setResultsActiveTab] = useState<'grid' | 'bindings' | 'sql'>('grid');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // When a query is selected, detect its parameters and initialize values
  useEffect(() => {
    if (!selectedQuery) {
      setParameters([]);
      setParamValues({});
      return;
    }

    const detected = detectParametersFromSql(selectedQuery.sql);
    setParameters(detected);

    const initialValues: Record<string, ParameterValueState> = {};
    const initialBuffers: Record<string, string> = {};

    detected.forEach((def) => {
      if (def.isTable || def.kind === 'table') {
        let initialTableRows: Record<string, unknown>[] = [];
        let initialSource: 'manual' | 'excel' = 'manual';
        let initialSourceInfo: ParameterValueState['excelSourceInfo'] = undefined;

        // Prepopulate sample rows for @Items as requested in prompt example
        if (def.rawName.toLowerCase().includes('item')) {
          initialTableRows = [
            { ItemId: 1001, ItemCode: 'ABC001', Quantity: 5 },
            { ItemId: 1002, ItemCode: 'ABC002', Quantity: 10 },
            { ItemId: 1003, ItemCode: 'ABC003', Quantity: 7 },
          ];
          initialSource = 'excel';
          initialSourceInfo = {
            fileName: 'items_inventory.xlsx',
            sheetName: 'Sheet1',
            mappedColumns: { ItemId: '[A] ItemId', ItemCode: '[B] ItemCode', Quantity: '[C] Quantity' },
            totalImported: 3,
          };
        } else if (def.rawName.toLowerCase().includes('center')) {
          initialTableRows = [
            { GISID: 'GIS-PLOT-88492', CenterName: 'North Regional Inspection Unit', TargetStatus: 'Active' },
            { GISID: 'GIS-PLOT-88493', CenterName: 'East Industrial Survey Point', TargetStatus: 'Verified' },
            { GISID: 'GIS-PLOT-88494', CenterName: 'West Terminal Facility', TargetStatus: 'Active' },
          ];
          initialSource = 'excel';
          initialSourceInfo = {
            fileName: 'center_status_updates.xlsx',
            sheetName: 'Sheet1',
            mappedColumns: { GISID: '[A] GISID', CenterName: '[B] CenterName', TargetStatus: '[C] TargetStatus' },
            totalImported: 3,
          };
        }

        initialValues[def.id] = {
          paramId: def.id,
          paramName: def.name,
          kind: def.kind,
          value: '',
          listValues: [],
          tableRows: initialTableRows,
          isList: false,
          isTable: true,
          isTempTable: def.isTempTable,
          type: 'string',
          source: initialSource,
          excelSourceInfo: initialSourceInfo,
        };
      } else {
        let initialList: string[] = [];
        let initialVal = def.defaultValue || '';

        if (def.isList && def.defaultValue) {
          initialList = def.defaultValue.split(',').map((s) => s.trim()).filter(Boolean);
        }

        initialValues[def.id] = {
          paramId: def.id,
          paramName: def.name,
          kind: def.isList ? 'list' : 'single',
          value: initialVal,
          listValues: initialList,
          tableRows: [],
          isList: def.isList,
          isTable: false,
          isTempTable: false,
          type: def.type,
          source: 'manual',
        };

        initialBuffers[def.id] = initialList.join('\n');
      }
    });

    setParamValues(initialValues);
    setManualInputBuffers(initialBuffers);
    setValidationErrors({});
    setExecutionResult(null);
    setConfirmedExecution(false);
  }, [selectedQuery]);

  // Compute parameterized SQL result
  const parameterizedSqlData: ParameterizedSqlResult | null = useMemo(() => {
    if (!selectedQuery) return null;
    return generateParameterizedSql(selectedQuery.sql, parameters, paramValues);
  }, [selectedQuery, parameters, paramValues]);

  // Filtered queries for Step 1
  const filteredQueries = useMemo(() => {
    return queries.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sql.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [queries, selectedCategory, searchQuery]);

  // Step 2: Handle single scalar value change
  const handleScalarChange = (paramId: string, val: string) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        value: val,
      },
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [paramId]: null,
    }));
  };

  // Step 2: Handle list text buffer change
  const handleListBufferChange = (paramId: string, text: string) => {
    setManualInputBuffers((prev) => ({
      ...prev,
      [paramId]: text,
    }));

    const items = text
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s !== '');

    setParamValues((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        listValues: items,
        source: 'manual',
        excelSourceInfo: undefined,
      },
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [paramId]: null,
    }));
  };

  // Remove single chip from list
  const handleRemoveListItem = (paramId: string, itemToRemove: string) => {
    setParamValues((prev) => {
      const current = prev[paramId];
      if (!current) return prev;
      const updatedList = current.listValues.filter((v) => v !== itemToRemove);
      return {
        ...prev,
        [paramId]: {
          ...current,
          listValues: updatedList,
        },
      };
    });

    setManualInputBuffers((prev) => {
      const currentText = prev[paramId] || '';
      const items = currentText
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => s !== '' && s !== itemToRemove);
      return {
        ...prev,
        [paramId]: items.join('\n'),
      };
    });
  };

  // Step 2: Excel Import Confirmation for List values
  const handleExcelImportConfirm = (
    items: string[],
    meta: {
      fileName: string;
      sheetName: string;
      columnName: string;
      totalImported: number;
      duplicatesRemoved: number;
    }
  ) => {
    if (!activeExcelParam) return;

    setParamValues((prev) => ({
      ...prev,
      [activeExcelParam.id]: {
        ...prev[activeExcelParam.id],
        listValues: items,
        source: 'excel',
        excelSourceInfo: meta,
      },
    }));

    setManualInputBuffers((prev) => ({
      ...prev,
      [activeExcelParam.id]: items.join('\n'),
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [activeExcelParam.id]: null,
    }));

    setActiveExcelParam(null);
  };

  // Step 2: Excel Import Confirmation for Table Variable
  const handleTableVariableImportConfirm = (
    records: Record<string, unknown>[],
    meta: {
      fileName: string;
      sheetName: string;
      mappedColumns: Record<string, string>;
      totalImported: number;
      duplicatesRemoved: number;
      invalidRowsCount: number;
    }
  ) => {
    if (!activeTableVarParam) return;

    setParamValues((prev) => ({
      ...prev,
      [activeTableVarParam.id]: {
        ...prev[activeTableVarParam.id],
        tableRows: records,
        source: 'excel',
        excelSourceInfo: meta,
      },
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [activeTableVarParam.id]: null,
    }));

    setActiveTableVarParam(null);
  };

  // Clear Table Rows
  const handleClearTableRows = (paramId: string) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        tableRows: [],
        excelSourceInfo: undefined,
        source: 'manual',
      },
    }));
  };

  // Delete a single row from table variable
  const handleDeleteTableRow = (paramId: string, rowIdx: number) => {
    setParamValues((prev) => {
      const current = prev[paramId];
      if (!current) return prev;
      const updated = current.tableRows.filter((_, i) => i !== rowIdx);
      return {
        ...prev,
        [paramId]: {
          ...current,
          tableRows: updated,
        },
      };
    });
  };

  // Quick load sample rows for table variable
  const handleLoadSampleTableRows = (param: QueryParameterDefinition) => {
    const cols = param.tableDefinition?.columns || [];
    let samples: Record<string, unknown>[] = [];

    if (param.rawName.toLowerCase().includes('item')) {
      samples = [
        { ItemId: 1001, ItemCode: 'ABC001', Quantity: 5 },
        { ItemId: 1002, ItemCode: 'ABC002', Quantity: 10 },
        { ItemId: 1003, ItemCode: 'ABC003', Quantity: 7 },
      ];
    } else if (param.rawName.toLowerCase().includes('center')) {
      samples = [
        { GISID: 'GIS-PLOT-88492', CenterName: 'North Regional Inspection Unit', TargetStatus: 'Active' },
        { GISID: 'GIS-PLOT-88493', CenterName: 'East Industrial Survey Point', TargetStatus: 'Verified' },
        { GISID: 'GIS-PLOT-88494', CenterName: 'West Terminal Facility', TargetStatus: 'Active' },
      ];
    } else {
      samples = [
        cols.reduce((acc, c, i) => ({ ...acc, [c.name]: c.baseType === 'number' ? 100 + i : `Val_${c.name}_1` }), {}),
        cols.reduce((acc, c, i) => ({ ...acc, [c.name]: c.baseType === 'number' ? 200 + i : `Val_${c.name}_2` }), {}),
      ];
    }

    setParamValues((prev) => ({
      ...prev,
      [param.id]: {
        ...prev[param.id],
        tableRows: samples,
        source: 'excel',
        excelSourceInfo: {
          fileName: 'sample_records.xlsx',
          sheetName: 'Sheet1',
          totalImported: samples.length,
          mappedColumns: cols.reduce((acc, c, i) => ({ ...acc, [c.name]: `[Col ${i + 1}] ${c.name}` }), {}),
        },
      },
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [param.id]: null,
    }));
  };

  // Validate before advancing to Step 3
  const handleProceedToReview = () => {
    const errors = validateParameterValues(parameters, paramValues);
    const hasAnyError = Object.values(errors).some((e) => e !== null);

    setValidationErrors(errors);

    if (!hasAnyError) {
      setCurrentStep('review');
    }
  };

  // Step 4: Execution
  const handleExecuteQuery = () => {
    if (!selectedQuery || !parameterizedSqlData) return;

    setIsExecuting(true);
    if (onUpdateStatus) {
      onUpdateStatus(
        `Executing parameterized query "${selectedQuery.title}"...`,
        undefined,
        undefined,
        true,
        false,
        selectedQuery.database || 'Production SQL Server'
      );
    }

    setTimeout(() => {
      const result = executeParameterizedSqlSimulated(
        parameterizedSqlData.parameterizedSql,
        parameterizedSqlData.executionBindings,
        selectedQuery.database || 'Production SQL Server'
      );

      setExecutionResult(result);
      setIsExecuting(false);
      setCurrentStep('execution');

      if (onUpdateStatus) {
        onUpdateStatus(
          result.isSuccess
            ? `Wizard executed query successfully (${result.rowsAffected} row(s) affected)`
            : 'Wizard execution error',
          result.executionTimeMs,
          result.rowsAffected,
          false,
          !result.isSuccess,
          selectedQuery.database || 'Production SQL Server'
        );
      }
    }, 450);
  };

  // Export results to CSV
  const handleExportCsv = () => {
    if (!executionResult?.data || executionResult.data.length === 0) return;
    const cols = executionResult.columns || Object.keys(executionResult.data[0]);

    const header = cols.join(',');
    const rows = executionResult.data.map((row) =>
      cols
        .map((col) => {
          const val = row[col];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Top Wizard Navigation Header */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              SQL Query Builder Wizard
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#007ACC]/20 text-[#38BDF8] border border-[#007ACC]/30">
                TABLE VARIABLES & EXCEL
              </span>
            </h1>
            <p className="text-xs text-[#888888]">
              Select predefined queries from the Query Bank, populate variables or table records via Excel, and execute safely.
            </p>
          </div>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div className="flex items-center gap-2 bg-[#1E1E1E] px-3 py-1.5 rounded-lg border border-[#3F3F46]">
          {/* Step 1 */}
          <button
            onClick={() => setCurrentStep('select_query')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
              currentStep === 'select_query'
                ? 'bg-[#007ACC] text-white shadow-xs'
                : selectedQuery
                ? 'text-emerald-400 hover:text-white'
                : 'text-[#888888]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Select Query</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />

          {/* Step 2 */}
          <button
            onClick={() => selectedQuery && setCurrentStep('enter_variables')}
            disabled={!selectedQuery}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
              currentStep === 'enter_variables'
                ? 'bg-[#007ACC] text-white shadow-xs'
                : currentStep === 'review' || currentStep === 'execution'
                ? 'text-emerald-400 hover:text-white'
                : 'text-[#666666] cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Enter Variables</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />

          {/* Step 3 */}
          <button
            onClick={() => selectedQuery && handleProceedToReview()}
            disabled={!selectedQuery}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
              currentStep === 'review'
                ? 'bg-[#007ACC] text-white shadow-xs'
                : currentStep === 'execution'
                ? 'text-emerald-400 hover:text-white'
                : 'text-[#666666] cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Review</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />

          {/* Step 4 */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
              currentStep === 'execution'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#666666]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-bold">
              4
            </span>
            <span>Results</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================================= */}
        {/* STEP 1: SELECT QUERY                                                      */}
        {/* ========================================================================= */}
        {currentStep === 'select_query' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
            {/* Toolbar */}
            <div className="bg-[#252526] p-4 rounded-xl border border-[#3F3F46] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search queries by title, SQL text, tags, or parameters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#007ACC]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-[#007ACC] text-white'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] hover:text-white border border-[#3F3F46]'
                  }`}
                >
                  All Categories ({queries.length})
                </button>
                {Object.entries(QUERY_CATEGORIES).map(([catKey, cat]) => {
                  const count = queries.filter((q) => q.category === catKey).length;
                  return (
                    <button
                      key={catKey}
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === catKey
                          ? 'bg-[#007ACC] text-white'
                          : 'bg-[#1E1E1E] text-[#AAAAAA] hover:text-white border border-[#3F3F46]'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-semibold text-[#888888] uppercase tracking-wider px-1">
                  Available Queries from SQL Query Bank ({filteredQueries.length})
                </div>

                <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                  {filteredQueries.length === 0 ? (
                    <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-8 text-center text-[#888888] text-xs">
                      No queries match your search filter.
                    </div>
                  ) : (
                    filteredQueries.map((item) => {
                      const isSelected = selectedQuery?.id === item.id;
                      const detected = detectParametersFromSql(item.sql);
                      const tableVars = detected.filter((p) => p.isTable);
                      const hasList = detected.some((p) => p.isList);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedQuery(item)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#007ACC]/10 border-[#007ACC] shadow-md ring-1 ring-[#007ACC]/50'
                              : 'bg-[#252526] border-[#3F3F46] hover:border-[#555555] hover:bg-[#2A2A2D]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="text-xs font-semibold text-white">
                                  {item.title}
                                </h3>
                                <span
                                  className="text-[10px] px-2 py-0.2 rounded font-medium border"
                                  style={{
                                    backgroundColor: QUERY_CATEGORIES[item.category]?.bg || 'rgba(156, 163, 175, 0.15)',
                                    color: QUERY_CATEGORIES[item.category]?.color || '#9CA3AF',
                                    borderColor: `${QUERY_CATEGORIES[item.category]?.color || '#9CA3AF'}40`,
                                  }}
                                >
                                  {QUERY_CATEGORIES[item.category]?.label || item.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#888888] line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#007ACC] text-white'
                                  : 'border border-[#555555] bg-[#1E1E1E]'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Parameter Badges */}
                          <div className="mt-3 pt-2.5 border-t border-[#333338] flex items-center justify-between gap-2 flex-wrap text-[10px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {tableVars.map((tv) => (
                                <span
                                  key={tv.id}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-medium"
                                >
                                  <Table className="w-3 h-3 text-purple-400" />
                                  Table Variable: {tv.name} (
                                  {tv.tableDefinition?.columns.length || 0} cols:{' '}
                                  {tv.tableDefinition?.columns.map((c) => c.name).join(', ')})
                                </span>
                              ))}

                              {hasList && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                                  <FileSpreadsheet className="w-3 h-3" />
                                  List (IN clause)
                                </span>
                              )}

                              {detected.filter((p) => !p.isTable && !p.isList).length > 0 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                                  <Layers className="w-3 h-3" />
                                  Single:{' '}
                                  {detected
                                    .filter((p) => !p.isTable && !p.isList)
                                    .map((d) => d.name)
                                    .join(', ')}
                                </span>
                              )}
                            </div>

                            <span className="text-[#888888] font-mono">
                              DB: {item.database || 'Production SQL'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Query Details Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                <div className="text-xs font-semibold text-[#888888] uppercase tracking-wider px-1">
                  Selected Query Specification
                </div>

                {selectedQuery ? (
                  <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-5 flex flex-col justify-between flex-1 shadow-sm">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-bold text-white mb-1">
                          {selectedQuery.title}
                        </div>
                        <div className="text-xs text-[#AAAAAA] leading-relaxed">
                          {selectedQuery.description}
                        </div>
                      </div>

                      {/* Required Parameters Preview Box */}
                      <div className="bg-[#1E1E1E] p-3.5 rounded-lg border border-[#3F3F46] space-y-3">
                        <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Detected Query Variables ({parameters.length})
                        </div>

                        {parameters.length === 0 ? (
                          <div className="text-xs text-[#888888] italic">
                            This query has no variable parameters. You can proceed directly to execution.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {parameters.map((param) => {
                              // If it's a table variable or temp table, render table column definition table
                              if (param.isTable && param.tableDefinition) {
                                const isTemp = param.isTempTable;
                                return (
                                  <div
                                    key={param.id}
                                    className={`p-3 rounded-lg border space-y-2 ${
                                      isTemp
                                        ? 'bg-[#252526] border-indigo-500/40'
                                        : 'bg-[#252526] border-purple-500/40'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`font-mono font-bold flex items-center gap-1.5 text-xs ${
                                          isTemp ? 'text-indigo-300' : 'text-purple-300'
                                        }`}
                                      >
                                        <Table
                                          className={`w-3.5 h-3.5 ${
                                            isTemp ? 'text-indigo-400' : 'text-purple-400'
                                          }`}
                                        />
                                        {param.name} ({isTemp ? 'Temporary Table' : 'Table Variable'})
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                          isTemp
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                        }`}
                                      >
                                        {param.tableDefinition.columns.length} Columns
                                      </span>
                                    </div>

                                    {/* Table Columns Schema */}
                                    <div className="border border-[#333338] rounded overflow-hidden">
                                      <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-[#1E1E1E] text-[#AAAAAA]">
                                          <tr>
                                            <th className="py-1 px-2.5 font-medium">Column</th>
                                            <th className="py-1 px-2.5 font-medium">Type</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#333338] font-mono text-[11px]">
                                          {param.tableDefinition.columns.map((c) => (
                                            <tr key={c.name}>
                                              <td className="py-1 px-2.5 text-white font-medium">
                                                {c.name}
                                                {!c.isNullable && (
                                                  <span className="text-red-400 ml-1">*</span>
                                                )}
                                              </td>
                                              <td className="py-1 px-2.5 text-cyan-300">{c.type}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={param.id}
                                  className="flex items-center justify-between text-xs bg-[#2D2D30] px-2.5 py-1.5 rounded border border-[#3F3F46]"
                                >
                                  <span className="font-mono text-cyan-300 font-medium">
                                    {param.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-[#888888] uppercase font-mono">
                                      {param.type}
                                    </span>
                                    {param.isList ? (
                                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                                        List (IN)
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-[#007ACC]/20 text-[#38BDF8] text-[10px] font-mono border border-[#007ACC]/30">
                                        Single
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* SQL Code Preview */}
                      <div>
                        <div className="text-[11px] font-medium text-[#AAAAAA] mb-1.5 flex items-center justify-between">
                          <span>SQL Statement Preview:</span>
                          <span className="text-[10px] font-mono text-[#888888]">
                            Target DB: {selectedQuery.database || 'SalesDB'}
                          </span>
                        </div>
                        <pre className="bg-[#181818] p-3.5 rounded-lg border border-[#3F3F46] text-xs font-mono text-[#CCCCCC] overflow-x-auto max-h-56 leading-relaxed">
                          <code>{selectedQuery.sql}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#3F3F46]">
                      <button
                        onClick={() => setCurrentStep('enter_variables')}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007ACC] hover:bg-[#0098FF] text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
                      >
                        <span>Next: Enter Variable Values</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-8 text-center text-[#888888] text-xs">
                    Please select a query from the left column.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ENTER VARIABLE VALUES (SINGLE, LIST, TABLE VARIABLES)              */}
        {/* ========================================================================= */}
        {currentStep === 'enter_variables' && selectedQuery && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
            {/* Query Summary Banner */}
            <div className="bg-[#252526] p-4 rounded-xl border border-[#3F3F46] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#007ACC]/20 text-[#38BDF8] flex items-center justify-center border border-[#007ACC]/30">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    {selectedQuery.title}
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    {parameters.length} variable parameter(s) detected • Database:{' '}
                    {selectedQuery.database || 'Production SQL'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('select_query')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#CCCCCC] hover:text-white hover:bg-[#2D2D30] rounded-md border border-[#3F3F46] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Query</span>
              </button>
            </div>

            {/* Parameters Input Forms */}
            <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-6 space-y-6 shadow-sm">
              <div className="border-b border-[#3F3F46] pb-3">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Define Variable Values
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  Provide single values, list values, or populate Table Variables via Excel import.
                </p>
              </div>

              {parameters.length === 0 ? (
                <div className="p-6 bg-[#1E1E1E] rounded-lg border border-[#3F3F46] text-center text-xs text-[#888888] space-y-3">
                  <p>This query does not contain variable placeholders.</p>
                  <button
                    onClick={() => setCurrentStep('review')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007ACC] hover:bg-[#0098FF] text-white rounded-md text-xs font-medium"
                  >
                    <span>Skip to Review & Execute</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {parameters.map((param, pIdx) => {
                    const valState = paramValues[param.id];
                    const error = validationErrors[param.id];
                    const listItems = valState?.listValues || [];
                    const tableRows = valState?.tableRows || [];
                    const isExcelImported = valState?.source === 'excel';

                    return (
                      <div
                        key={param.id}
                        className={`p-4 rounded-xl border transition-all ${
                          error
                            ? 'bg-red-950/20 border-red-800/60'
                            : param.isTable
                            ? 'bg-[#1E1E1E] border-purple-500/40'
                            : 'bg-[#1E1E1E] border-[#3F3F46]'
                        }`}
                      >
                        {/* Parameter Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-[#2D2D30] text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                              {pIdx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center gap-2">
                                <span>{param.label}</span>
                                <span className="font-mono text-cyan-300 text-[11px] bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/60">
                                  {param.name}
                                </span>
                                {param.required && (
                                  <span className="text-red-400 text-xs font-bold" title="Required">
                                    *
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#888888]">{param.description}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {param.isTempTable ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Temporary Table
                              </span>
                            ) : param.isTable ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Table Variable
                              </span>
                            ) : param.isList ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                List Value (IN)
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#2D2D30] text-[#AAAAAA] border border-[#3F3F46]">
                                {param.type}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ======================================================= */}
                        {/* CASE 1: TEMPORARY TABLE / TABLE VARIABLE WITH EXCEL IMPORT */}
                        {/* ======================================================= */}
                        {param.isTable && param.tableDefinition ? (
                          <div className="space-y-4 mt-3">
                            {/* Table Column Definitions */}
                            <div className="bg-[#252526] p-3 rounded-lg border border-[#333338] space-y-2">
                              <div className="text-[11px] font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
                                <Table className={`w-3.5 h-3.5 ${param.isTempTable ? 'text-indigo-400' : 'text-purple-400'}`} />
                                {param.isTempTable ? 'Temporary Table Column Schema (#TempTable):' : 'Table Variable Column Schema (@TableVar):'}
                              </div>

                              <div className="border border-[#333338] rounded overflow-hidden">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead className="bg-[#1E1E1E] text-[#AAAAAA]">
                                    <tr>
                                      <th className="py-1.5 px-3">Column Name</th>
                                      <th className="py-1.5 px-3">SQL Data Type</th>
                                      <th className="py-1.5 px-3">Type Family</th>
                                      <th className="py-1.5 px-3">Required</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#333338] font-mono text-[11px]">
                                    {param.tableDefinition.columns.map((c) => (
                                      <tr key={c.name}>
                                        <td className="py-1.5 px-3 text-cyan-300 font-semibold">{c.name}</td>
                                        <td className="py-1.5 px-3 text-white">{c.type}</td>
                                        <td className="py-1.5 px-3 text-[#AAAAAA] uppercase text-[10px]">{c.baseType}</td>
                                        <td className="py-1.5 px-3 text-[#AAAAAA]">
                                          {!c.isNullable ? (
                                            <span className="text-red-400 font-bold">Yes (NOT NULL)</span>
                                          ) : (
                                            <span className="text-[#666666]">Nullable</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Action Bar: Upload Excel or Load Sample */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#252526] rounded-lg border border-[#3F3F46]">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className={`w-4 h-4 ${param.isTempTable ? 'text-indigo-400' : 'text-purple-400'}`} />
                                <span className="text-xs text-[#CCCCCC]">
                                  {tableRows.length > 0 ? (
                                    <span className={`${param.isTempTable ? 'text-indigo-300' : 'text-purple-300'} font-medium`}>
                                      {valState?.excelSourceInfo?.fileName || 'Spreadsheet'} (
                                      {tableRows.length} record{tableRows.length !== 1 ? 's' : ''} loaded)
                                    </span>
                                  ) : (
                                    <span>
                                      Upload an Excel spreadsheet with matching columns to {param.isTempTable ? `generate INSERT INTO ${param.name}` : `populate ${param.name}`}
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setActiveTableVarParam(param)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600/25 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>
                                    {tableRows.length > 0 ? 'Re-import Excel' : 'Upload Excel'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleLoadSampleTableRows(param)}
                                  className="px-2.5 py-1.5 bg-[#2D2D30] hover:bg-[#38383C] text-xs text-cyan-300 rounded border border-[#3F3F46] transition-colors"
                                >
                                  Load Sample
                                </button>

                                {tableRows.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearTableRows(param.id)}
                                    className="px-2.5 py-1.5 text-xs text-[#888888] hover:text-red-400 rounded transition-colors"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Records Preview Grid */}
                            {tableRows.length > 0 ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-[#AAAAAA]">
                                  <span className="font-semibold text-white uppercase tracking-wider text-[10px]">
                                    Imported Records Preview ({tableRows.length} rows):
                                  </span>
                                  <span className="font-mono text-purple-300">
                                    Ready to INSERT into {param.name}
                                  </span>
                                </div>

                                <div className="border border-[#333338] rounded-lg overflow-x-auto bg-[#181818] max-h-56">
                                  <table className="w-full text-left text-xs border-collapse font-mono">
                                    <thead className="bg-[#2D2D30] text-cyan-300 sticky top-0 border-b border-[#333338]">
                                      <tr>
                                        <th className="py-2 px-3 w-10 text-center text-[#777777]">#</th>
                                        {param.tableDefinition.columns.map((c) => (
                                          <th key={c.name} className="py-2 px-3 font-semibold">
                                            {c.name}
                                          </th>
                                        ))}
                                        <th className="py-2 px-3 w-12 text-center text-[#777777]">Del</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2D2D30]">
                                      {tableRows.map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-[#252526]">
                                          <td className="py-1.5 px-3 text-center text-[#666666]">
                                            {rIdx + 1}
                                          </td>
                                          {param.tableDefinition!.columns.map((c) => {
                                            const cellVal = row[c.name];
                                            return (
                                              <td key={c.name} className="py-1.5 px-3 text-white">
                                                {cellVal !== undefined && cellVal !== null
                                                  ? String(cellVal)
                                                  : '<NULL>'}
                                              </td>
                                            );
                                          })}
                                          <td className="py-1.5 px-3 text-center">
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteTableRow(param.id, rIdx)}
                                              className="text-[#777777] hover:text-red-400"
                                              title="Remove row"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="p-5 bg-[#181818] rounded-lg border border-dashed border-[#3F3F46] text-center text-xs text-[#888888] space-y-1">
                                <p className="text-white font-medium">No records imported for {param.name} yet.</p>
                                <p>Click "Upload Excel" to map and import your spreadsheet records.</p>
                              </div>
                            )}
                          </div>
                        ) : param.isList ? (
                          /* ======================================================= */
                          /* CASE 2: LIST PARAMETER (IN clause)                      */
                          /* ======================================================= */
                          <div className="space-y-3 mt-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#252526] rounded-lg border border-[#3F3F46]">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-[#CCCCCC]">
                                  {isExcelImported ? (
                                    <span className="text-emerald-300 font-medium">
                                      Loaded from {valState?.excelSourceInfo?.fileName} [Column:{' '}
                                      {valState?.excelSourceInfo?.columnName}]
                                    </span>
                                  ) : (
                                    <span>Provide list values manually or upload an Excel spreadsheet</span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveExcelParam(param)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-md text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>
                                    {isExcelImported ? 'Re-import from Excel' : 'Upload Excel File'}
                                  </span>
                                </button>

                                {listItems.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleListBufferChange(param.id, '')}
                                    className="px-2.5 py-1.5 text-xs text-[#888888] hover:text-red-400 rounded transition-colors"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] text-[#AAAAAA] mb-1">
                                <span>Manual Values (comma or newline separated):</span>
                                <span className="font-mono text-cyan-300">
                                  {listItems.length} value{listItems.length !== 1 ? 's' : ''} in list
                                </span>
                              </div>

                              <textarea
                                rows={3}
                                placeholder="Enter values separated by commas or newlines (e.g. GIS-PLOT-88492, GIS-PLOT-88493)"
                                value={manualInputBuffers[param.id] || ''}
                                onChange={(e) => handleListBufferChange(param.id, e.target.value)}
                                className="w-full bg-[#181818] border border-[#3F3F46] rounded-lg p-2.5 text-xs font-mono text-white placeholder-[#555555] focus:outline-hidden focus:border-[#007ACC]"
                              />
                            </div>

                            {listItems.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-[#888888] uppercase tracking-wider">
                                  Parsed Items Preview ({listItems.length}):
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto p-2 bg-[#181818] rounded-lg border border-[#333338]">
                                  {listItems.slice(0, 30).map((item, idx) => (
                                    <span
                                      key={`${item}-${idx}`}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-[#2D2D30] text-cyan-300 border border-[#3F3F46]"
                                    >
                                      <span>{item}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveListItem(param.id, item)}
                                        className="text-[#888888] hover:text-red-400"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  {listItems.length > 30 && (
                                    <span className="text-xs text-[#888888] font-mono pl-1">
                                      +{listItems.length - 30} more items...
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ======================================================= */
                          /* CASE 3: SCALAR PARAMETER                                */
                          /* ======================================================= */
                          <div className="mt-2">
                            {param.type === 'boolean' ? (
                              <select
                                value={valState?.value || 'true'}
                                onChange={(e) => handleScalarChange(param.id, e.target.value)}
                                className="w-full sm:w-64 bg-[#181818] border border-[#3F3F46] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#007ACC]"
                              >
                                <option value="true">True (1)</option>
                                <option value="false">False (0)</option>
                              </select>
                            ) : (
                              <input
                                type={param.type === 'number' ? 'number' : 'text'}
                                placeholder={param.placeholder || `Enter ${param.label}`}
                                value={valState?.value || ''}
                                onChange={(e) => handleScalarChange(param.id, e.target.value)}
                                className="w-full bg-[#181818] border border-[#3F3F46] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#555555] focus:outline-hidden focus:border-[#007ACC]"
                              />
                            )}
                          </div>
                        )}

                        {error && (
                          <div className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Nav Bar */}
              <div className="pt-4 border-t border-[#3F3F46] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep('select_query')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#CCCCCC] hover:text-white hover:bg-[#2D2D30] rounded-lg border border-[#3F3F46] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Queries</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#007ACC] hover:bg-[#0098FF] text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <span>Next: Review Before Execution</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW BEFORE EXECUTION                                           */}
        {/* ========================================================================= */}
        {currentStep === 'review' && selectedQuery && parameterizedSqlData && (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-[#252526] p-5 rounded-xl border border-[#3F3F46] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      Review Parameterized Query Before Execution
                    </h2>
                    <p className="text-xs text-[#888888]">
                      Verify all parameter values, Table Variable records, and generated parameterized SQL statements.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg">
                  Target DB: {selectedQuery.database || 'Production SQL Server'}
                </span>
              </div>
            </div>

            {/* Variable / Parameter Summary Table */}
            <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Configured Parameter Values & Sources
              </div>

              <div className="border border-[#3F3F46] rounded-lg overflow-hidden bg-[#1E1E1E]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#2D2D30] text-[#AAAAAA] border-b border-[#3F3F46]">
                    <tr>
                      <th className="py-2.5 px-3">Variable Name</th>
                      <th className="py-2.5 px-3">Variable Type</th>
                      <th className="py-2.5 px-3">Source & File Info</th>
                      <th className="py-2.5 px-3">Values / Records Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2D30]">
                    {parameters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-[#888888]">
                          No parameters required for this query.
                        </td>
                      </tr>
                    ) : (
                      parameters.map((param) => {
                        const valState = paramValues[param.id];
                        const isTable = param.isTable;
                        const isList = param.isList;
                        const listItems = valState?.listValues || [];
                        const tableRows = valState?.tableRows || [];

                        return (
                          <tr key={param.id} className="hover:bg-[#252526] transition-colors">
                            <td className="py-2.5 px-3 font-mono text-cyan-300 font-medium">
                              {param.name}
                            </td>
                            <td className="py-2.5 px-3">
                              {param.isTempTable ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Temporary Table ({param.tableDefinition?.columns.length || 0} cols)
                                </span>
                              ) : isTable ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Table Variable ({param.tableDefinition?.columns.length || 0} cols)
                                </span>
                              ) : isList ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  List IN (...)
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2D2D30] text-[#CCCCCC] border border-[#3F3F46]">
                                  Single ({param.type})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {valState?.source === 'excel' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] border border-emerald-500/30">
                                  <FileSpreadsheet className="w-3 h-3" />
                                  Excel: {valState.excelSourceInfo?.fileName}
                                  {valState.excelSourceInfo?.sheetName
                                    ? ` [${valState.excelSourceInfo.sheetName}]`
                                    : ''}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#888888]">Manual Entry</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#CCCCCC]">
                              {isTable ? (
                                <div className={`${param.isTempTable ? 'text-indigo-300' : 'text-purple-300'} font-semibold`}>
                                  {tableRows.length} record{tableRows.length !== 1 ? 's' : ''} ready to generate INSERT INTO {param.name}
                                </div>
                              ) : isList ? (
                                <div>
                                  <span className="text-cyan-300 font-medium">
                                    {listItems.length} item{listItems.length !== 1 ? 's' : ''}:
                                  </span>{' '}
                                  <span className="text-[#AAAAAA]">
                                    [{listItems.slice(0, 6).join(', ')}
                                    {listItems.length > 6 ? ` ... +${listItems.length - 6} more` : ''}]
                                  </span>
                                </div>
                              ) : (
                                <span className="text-white font-medium">
                                  {valState?.value || '<empty>'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table Variable / Temporary Table Preview Section if Tables exist */}
            {parameters.some((p) => p.isTable && (paramValues[p.id]?.tableRows?.length || 0) > 0) && (
              <div className="bg-[#252526] border border-indigo-500/40 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <Table className="w-4 h-4 text-indigo-400" />
                  Temporary Table / Table Variable Records Preview for Execution
                </div>

                {parameters
                  .filter((p) => p.isTable)
                  .map((tvParam) => {
                    const rows = paramValues[tvParam.id]?.tableRows || [];
                    const cols = tvParam.tableDefinition?.columns || [];

                    return (
                      <div key={tvParam.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-cyan-300 font-bold">{tvParam.name}</span>
                          <span className="text-[#888888] font-mono text-[11px]">
                            {rows.length} records • Columns: {cols.map((c) => c.name).join(', ')}
                          </span>
                        </div>

                        <div className="border border-[#333338] rounded-lg overflow-x-auto bg-[#181818] max-h-48">
                          <table className="w-full text-left text-xs border-collapse font-mono">
                            <thead className="bg-[#2D2D30] text-purple-300 sticky top-0">
                              <tr>
                                <th className="py-2 px-3 w-10 text-center text-[#666666]">#</th>
                                {cols.map((c) => (
                                  <th key={c.name} className="py-2 px-3 font-semibold">
                                    {c.name} ({c.type})
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2D2D30]">
                              {rows.slice(0, 10).map((r, idx) => (
                                <tr key={idx} className="hover:bg-[#252526]">
                                  <td className="py-1 px-3 text-center text-[#666666]">{idx + 1}</td>
                                  {cols.map((c) => (
                                    <td key={c.name} className="py-1 px-3 text-white">
                                      {r[c.name] !== undefined && r[c.name] !== null ? String(r[c.name]) : '<NULL>'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Parameterized SQL Command Inspector */}
            <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Safe Parameterized Command Preview
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(parameterizedSqlData.spExecuteSqlScript);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E1E1E] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Parameterized SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#181818] p-4 rounded-lg border border-[#3F3F46] overflow-x-auto text-xs font-mono text-[#CCCCCC] leading-relaxed max-h-64">
                <pre>{parameterizedSqlData.spExecuteSqlScript}</pre>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#888888] bg-[#1E1E1E] p-2.5 rounded-lg border border-[#3F3F46]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Query values and Table Variable records are bound safely via parameterized declarations rather than direct string concatenation, protecting against injection and syntax corruption.
                </span>
              </div>
            </div>

            {/* Confirmation & Execution Bar */}
            <div className="bg-[#252526] border border-[#3F3F46] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedExecution}
                  onChange={(e) => setConfirmedExecution(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC] focus:ring-0"
                />
                <span className="text-xs text-[#E0E0E0] font-medium">
                  I confirm that the query and parameter values/records are reviewed and ready to execute.
                </span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('enter_variables')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#CCCCCC] hover:text-white hover:bg-[#2D2D30] rounded-lg border border-[#3F3F46] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Values</span>
                </button>

                <button
                  type="button"
                  disabled={!confirmedExecution || isExecuting}
                  onClick={handleExecuteQuery}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Executing Query...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Execute Query Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: EXECUTION RESULTS                                                 */}
        {/* ========================================================================= */}
        {currentStep === 'execution' && executionResult && selectedQuery && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
            {/* Status Banner */}
            <div
              className={`p-5 rounded-xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                executionResult.isSuccess
                  ? 'bg-emerald-950/25 border-emerald-800/60 text-emerald-200'
                  : 'bg-red-950/25 border-red-800/60 text-red-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    executionResult.isSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {executionResult.isSuccess ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    {executionResult.isSuccess
                      ? 'Query Executed Successfully'
                      : 'Query Execution Failed'}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      {executionResult.executionTimeMs} ms
                    </span>
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5 font-mono">
                    {executionResult.message}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('enter_variables')}
                  className="px-3 py-1.5 text-xs font-medium bg-[#1E1E1E] hover:bg-[#2D2D30] text-white rounded-lg border border-[#3F3F46] transition-colors"
                >
                  Edit Parameters & Re-run
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('select_query');
                    setExecutionResult(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-[#007ACC] hover:bg-[#0098FF] text-white rounded-lg shadow-xs transition-colors"
                >
                  New Query Wizard
                </button>
              </div>
            </div>

            {/* Results Tab View: Data Grid / Bindings / Parameterized SQL */}
            <div className="bg-[#252526] border border-[#3F3F46] rounded-xl overflow-hidden shadow-sm flex flex-col">
              {/* Tab Header */}
              <div className="bg-[#1E1E1E] border-b border-[#3F3F46] px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResultsActiveTab('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      resultsActiveTab === 'grid'
                        ? 'bg-[#007ACC] text-white shadow-xs'
                        : 'text-[#AAAAAA] hover:text-white hover:bg-[#2D2D30]'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>
                      Data Grid (
                      {executionResult.data ? executionResult.data.length : executionResult.rowsAffected}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsActiveTab('bindings')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      resultsActiveTab === 'bindings'
                        ? 'bg-[#007ACC] text-white shadow-xs'
                        : 'text-[#AAAAAA] hover:text-white hover:bg-[#2D2D30]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Parameter Bindings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsActiveTab('sql')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      resultsActiveTab === 'sql'
                        ? 'bg-[#007ACC] text-white shadow-xs'
                        : 'text-[#AAAAAA] hover:text-white hover:bg-[#2D2D30]'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Executed SQL Plan</span>
                  </button>
                </div>

                {executionResult.data && executionResult.data.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D2D30] hover:bg-[#38383C] text-xs font-medium text-white rounded-md border border-[#3F3F46] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Data Grid */}
              {resultsActiveTab === 'grid' && (
                <div className="p-4">
                  {executionResult.data && executionResult.data.length > 0 ? (
                    <div className="border border-[#3F3F46] rounded-lg overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead className="bg-[#1E1E1E] text-cyan-300 sticky top-0 border-b border-[#3F3F46]">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-[#666666] text-center border-r border-[#333338]">
                              #
                            </th>
                            {(executionResult.columns || Object.keys(executionResult.data[0])).map(
                              (col) => (
                                <th
                                  key={col}
                                  className="py-2.5 px-3 font-semibold border-r border-[#333338] whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D2D30]">
                          {executionResult.data.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-[#1E1E1E]/80 transition-colors">
                              <td className="py-2 px-3 text-[#666666] text-center border-r border-[#333338]">
                                {rowIdx + 1}
                              </td>
                              {(executionResult.columns || Object.keys(executionResult.data[0])).map(
                                (col) => {
                                  const cellVal = row[col];
                                  const formatted =
                                    cellVal === null || cellVal === undefined
                                      ? 'NULL'
                                      : typeof cellVal === 'boolean'
                                      ? cellVal
                                        ? 'TRUE'
                                        : 'FALSE'
                                      : String(cellVal);

                                  return (
                                    <td
                                      key={col}
                                      className={`py-2 px-3 border-r border-[#333338] whitespace-nowrap truncate max-w-xs ${
                                        cellVal === null || cellVal === undefined
                                          ? 'italic text-[#666666]'
                                          : typeof cellVal === 'boolean'
                                          ? cellVal
                                            ? 'text-emerald-400'
                                            : 'text-amber-400'
                                          : 'text-[#E0E0E0]'
                                      }`}
                                    >
                                      {formatted}
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-xs text-[#888888] space-y-2">
                      <p className="font-semibold text-white">No tabular rows returned.</p>
                      <p>{executionResult.message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Parameter Bindings */}
              {resultsActiveTab === 'bindings' && parameterizedSqlData && (
                <div className="p-5 space-y-4">
                  <div className="text-xs font-semibold text-white uppercase tracking-wider">
                    Bound Parameter Arguments
                  </div>

                  <div className="border border-[#3F3F46] rounded-lg overflow-hidden bg-[#1E1E1E]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="bg-[#2D2D30] text-[#AAAAAA] border-b border-[#3F3F46]">
                        <tr>
                          <th className="py-2 px-3">Placeholder Key</th>
                          <th className="py-2 px-3">SQL Data Type</th>
                          <th className="py-2 px-3">Bound Value</th>
                          <th className="py-2 px-3">Input Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2D2D30]">
                        {parameterizedSqlData.expandedParameters.map((p, idx) => (
                          <tr key={idx} className="hover:bg-[#252526]">
                            <td className="py-2 px-3 text-cyan-300 font-semibold">{p.key}</td>
                            <td className="py-2 px-3 text-[#AAAAAA]">{p.type}</td>
                            <td className="py-2 px-3 text-white">
                              {typeof p.value === 'object'
                                ? JSON.stringify(p.value)
                                : String(p.value)}
                            </td>
                            <td className="py-2 px-3 text-[#888888]">{p.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Executed SQL Plan */}
              {resultsActiveTab === 'sql' && parameterizedSqlData && (
                <div className="p-5 space-y-3">
                  <div className="text-xs font-semibold text-white uppercase tracking-wider">
                    Parameterized Execution Statement
                  </div>
                  <pre className="p-4 bg-[#181818] rounded-lg border border-[#3F3F46] font-mono text-xs text-[#CCCCCC] overflow-x-auto leading-relaxed max-h-80">
                    <code>{parameterizedSqlData.spExecuteSqlScript}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Excel Import Modal for List Values */}
      {activeExcelParam && (
        <ExcelImportModal
          isOpen={true}
          parameter={activeExcelParam}
          onClose={() => setActiveExcelParam(null)}
          onConfirmImport={handleExcelImportConfirm}
        />
      )}

      {/* Excel Import Modal for Table Variables */}
      {activeTableVarParam && (
        <TableVariableExcelModal
          isOpen={true}
          parameter={activeTableVarParam}
          onClose={() => setActiveTableVarParam(null)}
          onConfirmImport={handleTableVariableImportConfirm}
        />
      )}
    </div>
  );
};
