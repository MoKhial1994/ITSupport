import React, { useState, useMemo, useRef } from 'react';
import {
  Trash2,
  FileSpreadsheet,
  Upload,
  Copy,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  Database,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type QueryTypeMode = 'auto' | 'plot_id' | 'gis_id' | 'question_inspection_id' | 'plan_only';

interface ParsedRow {
  planId: string;
  plotId?: string;
  gisId?: string;
  questionInspectionId?: string;
  raw: Record<string, string>;
}

export const DeletePlotsView: React.FC = () => {
  // Input raw text (CSV, TSV, or text file content)
  const [inputText, setInputText] = useState<string>(
    'InspectionPlanId\tQuestionInspectionId\tPlotId\tGISID\n96991\t9808165\t10201\tGIS-EAS-101\n96991\t9808166\t10202\tGIS-EAS-102\n96992\t9808167\t10203\tGIS-EAS-103\n76908\t9808168\t20401\tGIS-WST-201'
  );

  // Mode & configuration states
  const [queryMode, setQueryMode] = useState<QueryTypeMode>('auto');
  const [chunkSize, setChunkSize] = useState<number>(1000);
  const [includeComments, setIncludeComments] = useState<boolean>(true);
  const [customTableAlias, setCustomTableAlias] = useState<boolean>(true);

  // File Upload Ref & Name
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Copy notification state
  const [copied, setCopied] = useState<boolean>(false);

  // Sample data loaders
  const loadSamplePlotData = () => {
    setInputText(
      'InspectionPlanId\tPlotId\tGISID\n76907\t10201\tGIS-EAS-101\n76907\t10202\tGIS-EAS-102\n76907\t10203\tGIS-EAS-103\n76908\t20401\tGIS-WST-201\n76908\t20402\tGIS-WST-202'
    );
    setUploadedFileName('sample_inspection_plans.tsv');
  };

  const loadSampleGisData = () => {
    setInputText(
      'InspectionPlanId,GISID\n76907,GIS-ZONE-A1\n76907,GIS-ZONE-A2\n76907,GIS-ZONE-A3\n88102,GIS-ZONE-B1\n88102,GIS-ZONE-B2'
    );
    setUploadedFileName('sample_gis_plans.csv');
  };

  const loadSampleQiAttachedData = () => {
    setInputText(
      'InspectionPlanId\tQuestionInspectionId\n96991\t9808165\n96991\t9808166\n96992\t9808167\n96992\t9808168'
    );
    setUploadedFileName('sample_qi_with_plan.tsv');
  };

  const loadSampleQiDirectData = () => {
    setInputText(
      'QuestionInspectionId\n9808165\n9808166\n9808167\n9808168'
    );
    setUploadedFileName('sample_qi_direct.txt');
  };

  const loadSamplePlanOnlyData = () => {
    setInputText(
      'InspectionPlanId\n76907\n76908\n76909'
    );
    setUploadedFileName('sample_plan_only.txt');
  };

  // Parse input into structured items
  const { parsedRows, detectedColumns, detectedMode } = useMemo(() => {
    if (!inputText.trim()) {
      return { parsedRows: [], detectedColumns: [], detectedMode: 'plot_id' as const };
    }

    const lines = inputText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return { parsedRows: [], detectedColumns: [], detectedMode: 'plot_id' as const };
    }

    // Determine delimiter (tab, comma, semicolon, space)
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(',')) delimiter = ',';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (/\s+/.test(firstLine)) delimiter = ' ';

    // Check if line 0 is header
    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
    
    const hasHeader = headers.some(
      (h) =>
        /plan/i.test(h) ||
        /inspection/i.test(h) ||
        /question/i.test(h) ||
        /plot/i.test(h) ||
        /gis/i.test(h)
    );

    const startIdx = hasHeader ? 1 : 0;
    const cols = hasHeader ? headers : ['InspectionPlanId', 'QuestionInspectionId', 'PlotId', 'GISID'];

    // Map column positions
    let planIdIdx = cols.findIndex((c) => /inspectionplan/i.test(c) || (/plan/i.test(c) && !/question/i.test(c)));
    let qiIdIdx = cols.findIndex((c) => /questioninspection/i.test(c) || /qi_?id/i.test(c) || (/question/i.test(c) && /id/i.test(c)));
    let plotIdIdx = cols.findIndex((c) => /plot/i.test(c) && !/gis/i.test(c));
    let gisIdIdx = cols.findIndex((c) => /gis/i.test(c));

    // Fallbacks if single column or unmapped
    if (planIdIdx === -1 && qiIdIdx === -1 && plotIdIdx === -1 && gisIdIdx === -1) {
      qiIdIdx = 0;
    }

    const rows: ParsedRow[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) continue;

      const planVal = planIdIdx !== -1 ? parts[planIdIdx] || '' : '';
      const qiVal = qiIdIdx !== -1 ? parts[qiIdIdx] || '' : '';
      const plotVal = plotIdIdx !== -1 ? parts[plotIdIdx] || '' : '';
      const gisVal = gisIdIdx !== -1 ? parts[gisIdIdx] || '' : '';

      if (planVal || qiVal || plotVal || gisVal) {
        rows.push({
          planId: planVal,
          questionInspectionId: qiVal,
          plotId: plotVal,
          gisId: gisVal,
          raw: parts.reduce((acc, curr, idx) => {
            acc[cols[idx] || `Col_${idx}`] = curr;
            return acc;
          }, {} as Record<string, string>),
        });
      }
    }

    // Determine auto mode
    let autoMode: 'question_inspection_id' | 'plan_only' | 'plot_id' | 'gis_id' = 'plot_id';
    const hasQiIds = rows.some((r) => r.questionInspectionId && r.questionInspectionId.length > 0);
    const hasPlotIds = rows.some((r) => r.plotId && r.plotId.length > 0);
    const hasGisIds = rows.some((r) => r.gisId && r.gisId.length > 0);
    const hasOnlyPlanIds = rows.some((r) => r.planId && r.planId.length > 0) && !hasQiIds && !hasPlotIds && !hasGisIds;

    if (hasOnlyPlanIds) {
      autoMode = 'plan_only';
    } else if (hasQiIds) {
      autoMode = 'question_inspection_id';
    } else if (!hasPlotIds && hasGisIds) {
      autoMode = 'gis_id';
    } else {
      autoMode = 'plot_id';
    }

    return {
      parsedRows: rows,
      detectedColumns: cols,
      detectedMode: autoMode,
    };
  }, [inputText]);

  // Actual effective mode
  const activeMode = queryMode === 'auto' ? detectedMode : queryMode;

  // Generate SQL Queries
  const { sqlScript, planGroupsCount, totalItemsCount } = useMemo(() => {
    if (parsedRows.length === 0) {
      return { sqlScript: '-- No valid data parsed yet. Upload a file or paste data above.', planGroupsCount: 0, totalItemsCount: 0 };
    }

    const sqlLines: string[] = [];
    let count = 0;
    let planCount = 0;

    sqlLines.push(`-- =================================================================`);
    sqlLines.push(`-- Auto-Generated Delete Script: Delete Plots/QuestionInspections`);
    sqlLines.push(`-- Mode: ${
      activeMode === 'plan_only'
        ? 'InspectionPlanId Only (Full Plan Cascade Delete)'
        : activeMode === 'question_inspection_id'
        ? 'QuestionInspectionId'
        : activeMode === 'plot_id'
        ? 'InspectionPlanId + PlotId'
        : 'InspectionPlanId + GISID'
    }`);
    sqlLines.push(`-- Date Generated: ${new Date().toLocaleString()}`);
    sqlLines.push(`-- =================================================================\n`);

    if (activeMode === 'plan_only') {
      const planSet = new Set<string>();
      for (const r of parsedRows) {
        if (r.planId && r.planId.trim().length > 0) {
          planSet.add(r.planId.trim());
        }
      }

      planCount = planSet.size;
      count = planSet.size;

      planSet.forEach((planId) => {
        if (includeComments) {
          sqlLines.push(`-- Delete Full Inspection Plan & Related Centers and Questions: ${planId}`);
        }
        sqlLines.push(`Delete InspectionPlan where id= ${planId}\n`);
        sqlLines.push(`Delete InspectionPlanCenter where InspectionPlanId = ${planId}\n`);
        sqlLines.push(`Delete QuestionInspection where InspectionPlanCenterId in (`);
        sqlLines.push(`select ID from InspectionPlanCenter where InspectionPlanId = ${planId}\n`);
        sqlLines.push(`)\n`);
      });
    } else if (activeMode === 'question_inspection_id') {
      // Group by PlanId attached vs direct unattached
      const attachedGroups: Map<string, Set<string>> = new Map();
      const directIds: Set<string> = new Set();

      for (const r of parsedRows) {
        const qiId = r.questionInspectionId || r.plotId || r.gisId;
        if (!qiId) continue;

        if (r.planId && r.planId.trim().length > 0) {
          if (!attachedGroups.has(r.planId)) {
            attachedGroups.set(r.planId, new Set());
          }
          attachedGroups.get(r.planId)!.add(qiId);
        } else {
          directIds.add(qiId);
        }
      }

      planCount = attachedGroups.size;

      // 1. Process Attached PlanIds
      attachedGroups.forEach((qiSet, planId) => {
        const qiList = Array.from(qiSet).filter((x) => x !== '');
        count += qiList.length;

        if (includeComments) {
          sqlLines.push(`-- Delete ${qiList.length} QuestionInspectionId(s) for Inspection Plan ID: ${planId}`);
        }

        for (let i = 0; i < qiList.length; i += chunkSize) {
          const chunk = qiList.slice(i, i + chunkSize);
          const inClause = chunk.join(', ');

          sqlLines.push(`DELETE QuestionInspection`);
          sqlLines.push(`WHERE InspectionPlanCenterId IN (`);
          sqlLines.push(`    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = ${planId}`);
          sqlLines.push(`)`);
          sqlLines.push(`AND Id IN (${inClause});\n`);
        }
      });

      // 2. Process Direct QuestionInspectionIds (No PlanId Attached)
      const directList = Array.from(directIds).filter((x) => x !== '');
      if (directList.length > 0) {
        count += directList.length;
        if (includeComments) {
          sqlLines.push(`-- Delete ${directList.length} Direct QuestionInspectionId(s) without PlanId`);
        }

        for (let i = 0; i < directList.length; i += chunkSize) {
          const chunk = directList.slice(i, i + chunkSize);
          if (chunk.length === 1) {
            sqlLines.push(`delete QuestionInspection\n`);
            sqlLines.push(`where id= ${chunk[0]};\n`);
          } else {
            const inClause = chunk.join(', ');
            sqlLines.push(`DELETE QuestionInspection`);
            sqlLines.push(`WHERE Id IN (${inClause});\n`);
          }
        }
      }
    } else {
      // Group rows by InspectionPlanId
      const groups: Map<string, { plotIds: Set<string>; gisIds: Set<string> }> = new Map();

      for (const r of parsedRows) {
        const plan = r.planId || 'UNKNOWN_PLAN';
        if (!groups.has(plan)) {
          groups.set(plan, { plotIds: new Set(), gisIds: new Set() });
        }
        const g = groups.get(plan)!;
        if (r.plotId) g.plotIds.add(r.plotId);
        if (r.gisId) g.gisIds.add(r.gisId);
      }

      planCount = groups.size;

      groups.forEach((data, planId) => {
        if (activeMode === 'plot_id') {
          const plotList = Array.from(data.plotIds).filter((x) => x !== '');
          count += plotList.length;

          if (includeComments) {
            sqlLines.push(`-- Delete ${plotList.length} Plot(s) for Inspection Plan ID: ${planId}`);
          }

          if (plotList.length === 0) {
            sqlLines.push(`-- Warning: No PlotIds found for Plan ${planId}\n`);
            return;
          }

          // Chunking if required
          for (let i = 0; i < plotList.length; i += chunkSize) {
            const chunk = plotList.slice(i, i + chunkSize);
            const inClause = chunk.join(', ');

            sqlLines.push(`DELETE QuestionInspection`);
            sqlLines.push(`WHERE InspectionPlanCenterId IN (`);
            sqlLines.push(`    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = ${planId}`);
            sqlLines.push(`)`);
            sqlLines.push(`AND PlotId IN (${inClause});\n`);
          }
        } else {
          // GISID mode
          const gisList = Array.from(data.gisIds).filter((x) => x !== '');
          count += gisList.length;

          if (includeComments) {
            sqlLines.push(`-- Delete ${gisList.length} GISID Plot(s) for Inspection Plan ID: ${planId}`);
          }

          if (gisList.length === 0) {
            sqlLines.push(`-- Warning: No GISIDs found for Plan ${planId}\n`);
            return;
          }

          // Chunking if required
          for (let i = 0; i < gisList.length; i += chunkSize) {
            const chunk = gisList.slice(i, i + chunkSize);
            const inClause = chunk.map((g) => `'${g.replace(/'/g, "''")}'`).join(', ');

            if (customTableAlias) {
              sqlLines.push(`DELETE q`);
              sqlLines.push(`FROM QuestionInspection q`);
              sqlLines.push(`INNER JOIN center c ON q.plotid = c.id`);
              sqlLines.push(`WHERE q.InspectionPlanCenterId IN (`);
              sqlLines.push(`    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = ${planId}`);
              sqlLines.push(`)`);
              sqlLines.push(`AND c.GISID IN (${inClause});\n`);
            } else {
              sqlLines.push(`DELETE FROM QuestionInspection`);
              sqlLines.push(`FROM QuestionInspection q`);
              sqlLines.push(`INNER JOIN center c ON q.plotid = c.id`);
              sqlLines.push(`WHERE q.InspectionPlanCenterId IN (`);
              sqlLines.push(`    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = ${planId}`);
              sqlLines.push(`)`);
              sqlLines.push(`AND c.GISID IN (${inClause});\n`);
            }
          }
        }
      });
    }

    return {
      sqlScript: sqlLines.join('\n'),
      planGroupsCount: planCount,
      totalItemsCount: count,
    };
  }, [parsedRows, activeMode, chunkSize, includeComments, customTableAlias]);

  // Handle File Selection (XLS, XLSX, CSV, TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];

          const csvData = XLSX.utils.sheet_to_csv(ws, { FS: '\t' });
          setInputText(csvData);
        } catch (err) {
          console.error('Failed to parse Excel file', err);
          alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // Text / CSV / TSV file
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setInputText(text || '');
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    if (!sqlScript) return;
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    if (!sqlScript) return;
    const blob = new Blob([sqlScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Delete_Plots_${activeMode}_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="bg-[#2D2D30] border-b border-[#3F3F46] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-950/50 text-red-400 rounded-md border border-red-800/40">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              Delete Plots from Plans Script Generator
              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-mono uppercase">
                Query Builder
              </span>
            </h2>
            <p className="text-xs text-[#AAAAAA]">
              Generate DELETE queries for QuestionInspection by InspectionPlanId & PlotId or GISID
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-sample-plan-only"
            onClick={loadSamplePlanOnlyData}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Plan Only
          </button>
          <button
            id="btn-sample-qi-attached"
            onClick={loadSampleQiAttachedData}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Plan + QI ID
          </button>
          <button
            id="btn-sample-qi-direct"
            onClick={loadSampleQiDirectData}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Direct QI ID
          </button>
          <button
            id="btn-sample-plots"
            onClick={loadSamplePlotData}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Plan + PlotId
          </button>
          <button
            id="btn-sample-gis"
            onClick={loadSampleGisData}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Plan + GISID
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#3F3F46]">
        {/* Left Column: Input File / Paste Area (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-[#1E1E1E]">
          {/* Header */}
          <div className="px-4 py-2.5 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#007ACC]" />
              Data Source Input
            </span>

            {/* Upload Button */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv,.txt,.tsv"
                className="hidden"
              />
              <button
                id="btn-upload-file"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white rounded flex items-center gap-1.5 transition-all shadow-sm font-medium"
              >
                <Upload className="w-3.5 h-3.5" /> Upload File (.xlsx, .csv, .txt)
              </button>
            </div>
          </div>

          {/* Active File Label */}
          {uploadedFileName && (
            <div className="px-4 py-1.5 bg-[#2D2D30] border-b border-[#3F3F46] text-xs text-emerald-400 flex items-center justify-between">
              <span className="truncate flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> File Loaded: {uploadedFileName}
              </span>
              <button
                onClick={() => {
                  setUploadedFileName('');
                  setInputText('');
                }}
                className="text-xs text-[#888888] hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          {/* Input Textarea */}
          <div className="flex-1 p-3 flex flex-col">
            <textarea
              id="input-delete-plots-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste data here or upload file...&#10;InspectionPlanId  QuestionInspectionId&#10;96991             9808165&#10;96991             9808166"
              className="w-full flex-1 bg-[#252526] text-[#E0E0E0] p-3 text-xs font-mono rounded border border-[#3F3F46] focus:outline-none focus:border-[#007ACC] resize-none leading-relaxed"
            />
          </div>

          {/* Column Detection Footer */}
          <div className="p-3 bg-[#252526] border-t border-[#3F3F46] text-xs font-mono text-[#888888]">
            <div className="flex justify-between items-center mb-1">
              <span>Parsed Rows: <strong className="text-white">{parsedRows.length}</strong></span>
              <span>Plans: <strong className="text-emerald-400">{planGroupsCount}</strong></span>
            </div>
            <div className="text-[11px] text-[#AAAAAA] truncate">
              Detected Columns: {detectedColumns.length > 0 ? detectedColumns.join(', ') : 'None'}
            </div>
          </div>
        </div>

        {/* Middle Column: Options & Controls (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col h-full bg-[#252526] overflow-y-auto">
          <div className="px-4 py-2.5 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#007ACC]" />
              Query Mode & Rules
            </span>
          </div>

          <div className="p-4 space-y-5 text-xs">
            {/* Query Mode Selection */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-2">
                Target Query Pattern:
              </label>

              <div className="space-y-2">
                <button
                  id="opt-mode-auto"
                  onClick={() => setQueryMode('auto')}
                  className={`w-full p-2.5 rounded border text-left transition-all ${
                    queryMode === 'auto'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Auto Detect</span>
                    <span className="text-[10px] opacity-80 uppercase font-mono">
                      Current: {detectedMode}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-85 mt-1 font-normal">
                    Selects QuestionInspectionId, PlotId, or GISID based on input
                  </div>
                </button>

                <button
                  id="opt-mode-qi-id"
                  onClick={() => setQueryMode('question_inspection_id')}
                  className={`w-full p-2.5 rounded border text-left transition-all ${
                    activeMode === 'question_inspection_id' && queryMode === 'question_inspection_id'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <div className="font-semibold">1. QuestionInspectionId</div>
                  <div className="text-[10px] font-mono opacity-80 mt-1">
                    WHERE Id IN (...) / where id = ...
                  </div>
                </button>

                <button
                  id="opt-mode-plot-id"
                  onClick={() => setQueryMode('plot_id')}
                  className={`w-full p-2.5 rounded border text-left transition-all ${
                    activeMode === 'plot_id' && queryMode === 'plot_id'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <div className="font-semibold">2. InspectionPlanId + PlotId</div>
                  <div className="text-[10px] font-mono opacity-80 mt-1">
                    DELETE QuestionInspection WHERE PlotId IN (...)
                  </div>
                </button>

                <button
                  id="opt-mode-gis-id"
                  onClick={() => setQueryMode('gis_id')}
                  className={`w-full p-2.5 rounded border text-left transition-all ${
                    activeMode === 'gis_id' && queryMode === 'gis_id'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <div className="font-semibold">3. InspectionPlanId + GISID</div>
                  <div className="text-[10px] font-mono opacity-80 mt-1">
                    INNER JOIN center c ON q.plotid = c.id ... c.GISID IN ('')
                  </div>
                </button>

                <button
                  id="opt-mode-plan-only"
                  onClick={() => setQueryMode('plan_only')}
                  className={`w-full p-2.5 rounded border text-left transition-all ${
                    activeMode === 'plan_only' && queryMode === 'plan_only'
                      ? 'bg-[#007ACC] text-white border-[#007ACC] font-medium'
                      : 'bg-[#1E1E1E] text-[#AAAAAA] border-[#3F3F46] hover:bg-[#2D2D30]'
                  }`}
                >
                  <div className="font-semibold">4. InspectionPlanId Only (Full Cascade)</div>
                  <div className="text-[10px] font-mono opacity-80 mt-1">
                    Delete InspectionPlan / PlanCenter / QuestionInspection
                  </div>
                </button>
              </div>
            </div>

            {/* Chunk Size Limit */}
            <div>
              <label className="block text-[#CCCCCC] font-semibold mb-1">
                Batch Chunk Limit (Items per IN clause):
              </label>
              <select
                id="select-chunk-size"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full bg-[#1E1E1E] text-[#E0E0E0] border border-[#3F3F46] rounded p-2 text-xs focus:border-[#007ACC] focus:outline-none"
              >
                <option value={1000}>1,000 items (Standard SQL Server Limit)</option>
                <option value={500}>500 items per batch</option>
                <option value={2000}>2,000 items per batch</option>
                <option value={10000}>Unlimited / 10,000 items</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="pt-3 border-t border-[#3F3F46] space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC]">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="accent-[#007ACC] rounded"
                />
                <span>Include descriptive SQL comments</span>
              </label>

              {activeMode === 'gis_id' && (
                <label className="flex items-center gap-2 cursor-pointer text-[#CCCCCC]">
                  <input
                    type="checkbox"
                    checked={customTableAlias}
                    onChange={(e) => setCustomTableAlias(e.target.checked)}
                    className="accent-[#007ACC] rounded"
                  />
                  <span>Use table alias syntax (DELETE q FROM ...)</span>
                </label>
              )}
            </div>

            {/* Structure info box */}
            <div className="p-3 bg-[#1E1E1E] border border-[#3F3F46] rounded text-[11px] text-[#AAAAAA] space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-400" /> Expected SQL Pattern:
              </div>
              {activeMode === 'question_inspection_id' ? (
                <div className="font-mono text-[10px] text-emerald-300 bg-[#252526] p-2 rounded leading-tight space-y-2">
                  <div>
                    <span className="text-purple-300 font-bold">// If PlanId attached:</span><br />
                    DELETE QuestionInspection<br />
                    WHERE InspectionPlanCenterId IN (<br />
                    &nbsp;&nbsp;SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = 96991<br />
                    )<br />
                    AND Id IN (9808165);
                  </div>
                  <div>
                    <span className="text-purple-300 font-bold">// If PlanId NOT attached:</span><br />
                    delete QuestionInspection<br />
                    where id= 9808165;
                  </div>
                </div>
              ) : activeMode === 'plot_id' ? (
                <div className="font-mono text-[10px] text-emerald-300 bg-[#252526] p-2 rounded leading-tight">
                  DELETE QuestionInspection<br />
                  WHERE InspectionPlanCenterId IN (<br />
                  &nbsp;&nbsp;SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = 76907<br />
                  ) AND PlotId IN (101, 102)
                </div>
              ) : (
                <div className="font-mono text-[10px] text-emerald-300 bg-[#252526] p-2 rounded leading-tight">
                  DELETE q FROM QuestionInspection q<br />
                  INNER JOIN center c ON q.plotid = c.id<br />
                  WHERE InspectionPlanCenterId IN (<br />
                  &nbsp;&nbsp;SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = 76907<br />
                  ) AND c.GISID IN ('G1', 'G2')
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Generated SQL Output (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#1E1E1E]">
          {/* Header */}
          <div className="px-4 py-2.5 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Generated SQL Script
            </span>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-sql"
                onClick={handleCopy}
                disabled={!sqlScript}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : sqlScript
                    ? 'bg-[#007ACC] hover:bg-[#0062A3] text-white'
                    : 'bg-[#333333] text-[#777777] cursor-not-allowed'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied SQL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy SQL
                  </>
                )}
              </button>

              <button
                id="btn-download-sql"
                onClick={handleDownloadSql}
                disabled={!sqlScript}
                className="px-3 py-1 bg-[#333333] hover:bg-[#3E3E42] text-xs text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all font-medium"
              >
                <Download className="w-3.5 h-3.5" /> Save .sql
              </button>
            </div>
          </div>

          {/* Script Display Textarea */}
          <div className="flex-1 p-3 flex flex-col">
            <textarea
              id="output-sql-script-textarea"
              readOnly
              value={sqlScript}
              className="w-full flex-1 bg-[#1E1E1E] text-emerald-300 p-3 text-xs font-mono rounded border border-[#3F3F46] focus:outline-none resize-none leading-relaxed shadow-inner"
            />
          </div>

          {/* Summary Footer */}
          <div className="p-3 bg-[#252526] border-t border-[#3F3F46] flex items-center justify-between text-xs font-mono text-[#888888]">
            <div className="flex items-center gap-3">
              <span>
                Plans: <strong className="text-white">{planGroupsCount}</strong>
              </span>
              <span>
                Total Items: <strong className="text-emerald-400">{totalItemsCount}</strong>
              </span>
            </div>
            <span>{sqlScript.length} chars</span>
          </div>
        </div>
      </div>
    </div>
  );
};
