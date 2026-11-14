import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  X,
  Check,
  Filter,
  Trash2,
  Sparkles,
  AlertCircle,
  Table,
  Layers,
  ArrowRight,
  Info,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  QueryParameterDefinition,
  TableColumnDefinition,
  TableVariableRowItem,
  ExcelColumnInfo,
} from './types';
import { indexToColumnLetter } from './queryParameterUtils';

interface TableVariableExcelModalProps {
  isOpen: boolean;
  parameter: QueryParameterDefinition;
  onClose: () => void;
  onConfirmImport: (
    records: Record<string, unknown>[],
    meta: {
      fileName: string;
      sheetName: string;
      mappedColumns: Record<string, string>;
      totalImported: number;
      duplicatesRemoved: number;
      invalidRowsCount: number;
    }
  ) => void;
}

export const TableVariableExcelModal: React.FC<TableVariableExcelModalProps> = ({
  isOpen,
  parameter,
  onClose,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableDef = parameter.tableDefinition;
  const targetColumns = useMemo(() => tableDef?.columns || [], [tableDef]);

  // File & Sheet state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelColumns, setExcelColumns] = useState<ExcelColumnInfo[]>([]);
  const [rawSheetData, setRawSheetData] = useState<(string | number | boolean | null)[][]>([]);

  // Column Mapping state: { [tableColName]: excelColIndex }
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});

  // Cleaning options
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);

  // Excluded row indices
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setParseError(null);
      setExcludedRowIndices(new Set());
      setPreviewSearch('');
    }
  }, [isOpen]);

  const handleFileChange = async (selectedFile: File) => {
    setParseError(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        setParseError('The uploaded workbook contains no readable sheets.');
        return;
      }

      setFile(selectedFile);
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      processWorksheet(wb, wb.SheetNames[0], hasHeader);
    } catch (err) {
      setParseError(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const processWorksheet = (wb: XLSX.WorkBook, sheetName: string, headerFlag: boolean) => {
    try {
      const ws = wb.Sheets[sheetName];
      if (!ws) return;

      const data: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
      });

      setRawSheetData(data);
      if (data.length === 0) {
        setExcelColumns([]);
        return;
      }

      const maxCols = Math.min(
        50,
        Math.max(...data.slice(0, 10).map((row) => (Array.isArray(row) ? row.length : 0)), 1)
      );

      const detectedCols: ExcelColumnInfo[] = [];

      for (let c = 0; c < maxCols; c++) {
        const letter = indexToColumnLetter(c);
        const headerRowVal = data[0] && data[0][c] !== undefined ? String(data[0][c]).trim() : '';
        const headerName = headerFlag && headerRowVal ? headerRowVal : `Column ${letter}`;

        const dataRows = headerFlag ? data.slice(1) : data;
        const colVals = dataRows
          .map((r) => (r && r[c] !== undefined ? String(r[c]).trim() : ''))
          .filter((v) => v !== '');

        detectedCols.push({
          index: c,
          letter,
          headerName,
          sampleValues: colVals.slice(0, 3),
          nonEmptyCount: colVals.length,
        });
      }

      setExcelColumns(detectedCols);

      // Smart auto-mapping: match Excel column headers with Table Variable columns
      const autoMap: Record<string, number> = {};
      targetColumns.forEach((targetCol) => {
        const targetClean = targetCol.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        // 1. Exact or cleaned header match
        let matchedIndex = detectedCols.findIndex((ec) => {
          const ecClean = ec.headerName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return ecClean === targetClean;
        });

        // 2. Partial match if no exact match
        if (matchedIndex === -1) {
          matchedIndex = detectedCols.findIndex((ec) => {
            const ecClean = ec.headerName.toLowerCase().replace(/[^a-z0-9]/g, '');
            return ecClean.includes(targetClean) || targetClean.includes(ecClean);
          });
        }

        if (matchedIndex !== -1) {
          autoMap[targetCol.name] = matchedIndex;
        }
      });

      setColumnMapping(autoMap);
      setExcludedRowIndices(new Set());
    } catch (err) {
      setParseError(`Error analyzing worksheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processWorksheet(workbook, sheetName, hasHeader);
    }
  };

  const handleToggleHeader = (checked: boolean) => {
    setHasHeader(checked);
    if (workbook && selectedSheet) {
      processWorksheet(workbook, selectedSheet, checked);
    }
  };

  // Quick load sample data for easy testing
  const handleLoadSampleData = () => {
    let sampleRows: (string | number | boolean)[][] = [];

    if (targetColumns.some((c) => c.name.toLowerCase().includes('item'))) {
      sampleRows = [
        ['ItemId', 'ItemCode', 'Quantity'],
        [1001, 'ABC001', 5],
        [1002, 'ABC002', 10],
        [1003, 'ABC003', 7],
        [1004, 'XYZ099', 15],
        [1005, 'PRO-881', 3],
      ];
    } else if (targetColumns.some((c) => c.name.toLowerCase().includes('gis'))) {
      sampleRows = [
        ['GISID', 'CenterName', 'TargetStatus'],
        ['GIS-PLOT-88492', 'North Regional Inspection Unit', 'Active'],
        ['GIS-PLOT-88493', 'East Industrial Survey Point', 'Verified'],
        ['GIS-PLOT-88494', 'West Terminal Facility', 'Active'],
        ['GIS-PLOT-88495', 'South Agricultural Zone A', 'Pending'],
      ];
    } else {
      const headers = targetColumns.map((c) => c.name);
      sampleRows = [
        headers,
        targetColumns.map((c, i) => (c.baseType === 'number' ? 100 + i : `Sample_${c.name}_1`)),
        targetColumns.map((c, i) => (c.baseType === 'number' ? 200 + i : `Sample_${c.name}_2`)),
        targetColumns.map((c, i) => (c.baseType === 'number' ? 300 + i : `Sample_${c.name}_3`)),
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, 'SampleData');

    setFile(new File([], 'sample_table_records.xlsx'));
    setWorkbook(wb);
    setSheetNames(['SampleData']);
    setSelectedSheet('SampleData');
    processWorksheet(wb, 'SampleData', true);
  };

  // Compute processed records and stats
  const { processedItems, validCount, duplicateCount, invalidTypeCount } = useMemo(() => {
    if (!rawSheetData || rawSheetData.length === 0) {
      return { processedItems: [], validCount: 0, duplicateCount: 0, invalidTypeCount: 0 };
    }

    const dataRows = hasHeader ? rawSheetData.slice(1) : rawSheetData;
    const items: TableVariableRowItem[] = [];
    const seenSignatures = new Set<string>();

    let dups = 0;
    let invalids = 0;

    dataRows.forEach((row, idx) => {
      const originalRowIndex = hasHeader ? idx + 2 : idx + 1;
      const rawRecord: Record<string, string> = {};
      const cleanedRecord: Record<string, unknown> = {};
      const fieldErrors: Record<string, string | null> = {};

      let hasFieldError = false;
      let isEntirelyEmpty = true;

      targetColumns.forEach((col) => {
        const mappedColIndex = columnMapping[col.name];
        const rawCell =
          mappedColIndex !== undefined && row && row[mappedColIndex] !== undefined
            ? String(row[mappedColIndex])
            : '';

        let valStr = trimWhitespace ? rawCell.trim() : rawCell;
        rawRecord[col.name] = rawCell;

        if (valStr !== '') isEntirelyEmpty = false;

        // Validate by column baseType
        if (col.baseType === 'number') {
          if (valStr === '') {
            if (!col.isNullable) {
              fieldErrors[col.name] = 'Required number';
              hasFieldError = true;
            } else {
              cleanedRecord[col.name] = null;
            }
          } else if (isNaN(Number(valStr))) {
            fieldErrors[col.name] = `Must be ${col.type}`;
            hasFieldError = true;
          } else {
            cleanedRecord[col.name] = Number(valStr);
            fieldErrors[col.name] = null;
          }
        } else if (col.baseType === 'boolean') {
          if (valStr === '') {
            cleanedRecord[col.name] = col.isNullable ? null : false;
          } else {
            const boolVal = valStr === '1' || valStr.toLowerCase() === 'true' || valStr.toLowerCase() === 'yes';
            cleanedRecord[col.name] = boolVal;
          }
          fieldErrors[col.name] = null;
        } else {
          // String or Date
          if (valStr === '' && !col.isNullable) {
            fieldErrors[col.name] = 'Required field';
            hasFieldError = true;
          } else {
            cleanedRecord[col.name] = valStr;
            fieldErrors[col.name] = null;
          }
        }
      });

      if (hasFieldError) invalids++;

      // Check duplicates
      const signature = JSON.stringify(cleanedRecord);
      const isDuplicate = !isEntirelyEmpty && seenSignatures.has(signature);
      if (!isEntirelyEmpty) {
        if (isDuplicate) dups++;
        else seenSignatures.add(signature);
      }

      const isValid = !isEntirelyEmpty && !hasFieldError && (!removeDuplicates || !isDuplicate);
      const isExcluded = excludedRowIndices.has(idx);

      items.push({
        id: `row-${idx}`,
        originalIndex: originalRowIndex,
        rawRecord,
        cleanedRecord,
        fieldErrors,
        isDuplicate,
        isEmpty: isEntirelyEmpty,
        isValid,
        excluded: isExcluded,
      });
    });

    const valids = items.filter(
      (item) =>
        !item.excluded &&
        !item.isEmpty &&
        (!skipInvalidRows || !Object.values(item.fieldErrors).some((e) => e !== null)) &&
        (!removeDuplicates || !item.isDuplicate)
    ).length;

    return {
      processedItems: items,
      validCount: valids,
      duplicateCount: dups,
      invalidTypeCount: invalids,
    };
  }, [
    rawSheetData,
    hasHeader,
    targetColumns,
    columnMapping,
    trimWhitespace,
    removeDuplicates,
    skipInvalidRows,
    excludedRowIndices,
  ]);

  // Search filter for preview
  const visibleItems = useMemo(() => {
    let rows = processedItems.filter((item) => !item.isEmpty);
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      rows = rows.filter(
        (item) =>
          Object.values(item.rawRecord).some((v) => String(v).toLowerCase().includes(q)) ||
          String(item.originalIndex).includes(q)
      );
    }
    return rows;
  }, [processedItems, previewSearch]);

  const handleToggleExcludeRow = (rowIdx: number) => {
    setExcludedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(rowIdx)) next.delete(rowIdx);
      else next.add(rowIdx);
      return next;
    });
  };

  const handleConfirm = () => {
    const finalRecords: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    processedItems.forEach((item) => {
      if (item.excluded || item.isEmpty) return;
      if (skipInvalidRows && Object.values(item.fieldErrors).some((e) => e !== null)) return;

      const sig = JSON.stringify(item.cleanedRecord);
      if (removeDuplicates) {
        if (seen.has(sig)) return;
        seen.add(sig);
      }

      finalRecords.push(item.cleanedRecord);
    });

    const mappedNames: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([tCol, ecIdx]) => {
      const ec = excelColumns.find((c) => c.index === ecIdx);
      mappedNames[tCol] = ec ? `[${ec.letter}] ${ec.headerName}` : `Col ${ecIdx}`;
    });

    onConfirmImport(finalRecords, {
      fileName: file?.name || 'TableData.xlsx',
      sheetName: selectedSheet,
      mappedColumns: mappedNames,
      totalImported: finalRecords.length,
      duplicatesRemoved: duplicateCount,
      invalidRowsCount: invalidTypeCount,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-[#252526] border border-[#3F3F46] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#E0E0E0]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E1E1E] border-b border-[#3F3F46] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                {parameter.isTempTable ? 'Import Excel to Temporary Table' : 'Import Excel to Table Variable'}
                <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {parameter.name}
                </span>
              </h2>
              <p className="text-xs text-[#888888]">
                Map Excel columns to {parameter.name} ({targetColumns.map((c) => c.name).join(', ')}), validate types, and generate SQL INSERT INTO {parameter.name} statements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white hover:bg-[#2D2D30] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Upload / Dropzone */}
          {!file ? (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#3F3F46] hover:border-[#007ACC] bg-[#1E1E1E]/60 hover:bg-[#1E1E1E]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">
                    Click to browse or drag & drop Excel file
                  </div>
                  <div className="text-xs text-[#888888] mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV spreadsheets
                  </div>
                </div>

                {/* Target Table Variable Columns Badge */}
                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-[#2D2D30] rounded-md border border-[#3F3F46] text-xs text-[#CCCCCC]">
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Columns needed: {targetColumns.map((c) => `${c.name} (${c.type})`).join(', ')}
                  </span>
                </div>
              </div>

              {/* Quick load sample button */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[#888888]">Don't have an Excel file on hand?</span>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Spreadsheet Data for {parameter.name}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Uploaded file bar */
            <div className="p-3 bg-[#1E1E1E] border border-[#3F3F46] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    {file.name}
                    <span className="text-[10px] text-[#888888] font-mono">
                      ({sheetNames.length} Sheet(s))
                    </span>
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    {excelColumns.length} columns detected in active sheet
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-950/30"
                >
                  Load Sample Data
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setWorkbook(null);
                    setRawSheetData([]);
                    setExcelColumns([]);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#888888] hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-800/40 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Change File</span>
                </button>
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {file && excelColumns.length > 0 && (
            <div className="space-y-6">
              {/* Sheet & Header toggle bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Select Worksheet
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSelectSheet(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded-md px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#007ACC]"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => handleToggleHeader(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC]"
                    />
                    <span>First row in sheet contains column headers</span>
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* STEP: COLUMN MAPPING                                     */}
              {/* ======================================================== */}
              <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#3F3F46] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white flex items-center gap-2 uppercase tracking-wider text-[11px]">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Column Mapping to {parameter.name}
                  </div>
                  <span className="text-[11px] text-[#888888]">
                    Map each table variable column to a spreadsheet column
                  </span>
                </div>

                <div className="border border-[#333338] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#2D2D30] text-[#AAAAAA] border-b border-[#3F3F46]">
                      <tr>
                        <th className="py-2.5 px-3">Table Column</th>
                        <th className="py-2.5 px-3">SQL Data Type</th>
                        <th className="py-2.5 px-3">Mapped Excel Column</th>
                        <th className="py-2.5 px-3">Sample Preview</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2D30]">
                      {targetColumns.map((col) => {
                        const mappedIdx = columnMapping[col.name];
                        const isMapped = mappedIdx !== undefined && mappedIdx >= 0;
                        const mappedCol = isMapped ? excelColumns.find((c) => c.index === mappedIdx) : null;

                        return (
                          <tr key={col.name} className="hover:bg-[#252526] transition-colors">
                            <td className="py-2 px-3 font-mono font-semibold text-cyan-300">
                              {col.name}
                              {!col.isNullable && <span className="text-red-400 ml-1">*</span>}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-[#AAAAAA]">
                              {col.type}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={mappedIdx !== undefined ? mappedIdx : ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                                  setColumnMapping((prev) => {
                                    const next = { ...prev };
                                    if (val === undefined) delete next[col.name];
                                    else next[col.name] = val;
                                    return next;
                                  });
                                }}
                                className={`w-full bg-[#181818] border rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#007ACC] ${
                                  !isMapped ? 'border-amber-500/60' : 'border-[#3F3F46]'
                                }`}
                              >
                                <option value="">-- Select Excel Column --</option>
                                {excelColumns.map((ec) => (
                                  <option key={ec.index} value={ec.index}>
                                    [{ec.letter}] {ec.headerName} ({ec.nonEmptyCount} items)
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-[#888888] truncate max-w-xs">
                              {mappedCol && mappedCol.sampleValues.length > 0
                                ? mappedCol.sampleValues.join(', ')
                                : '<no sample>'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isMapped ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> Mapped
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Unmapped
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Cleaning Settings */}
              <div className="p-4 bg-[#1E1E1E] border border-[#3F3F46] rounded-xl space-y-2">
                <div className="text-[11px] font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  Validation Rules & Data Cleaning
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeDuplicates}
                      onChange={(e) => setRemoveDuplicates(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC]"
                    />
                    <span>Remove Duplicate Records</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalidRows}
                      onChange={(e) => setSkipInvalidRows(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC]"
                    />
                    <span>Skip Rows with Type Errors</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trimWhitespace}
                      onChange={(e) => setTrimWhitespace(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC]"
                    />
                    <span>Trim Whitespace</span>
                  </label>
                </div>
              </div>

              {/* ======================================================== */}
              {/* STEP: LIVE DATA PREVIEW                                  */}
              {/* ======================================================== */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-semibold text-white">
                      Live Record Preview & Validation
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {validCount} Ready to Insert
                    </span>
                    {duplicateCount > 0 && removeDuplicates && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {duplicateCount} Duplicates Skipped
                      </span>
                    )}
                    {invalidTypeCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                        {invalidTypeCount} Type Errors
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Search preview records..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1 text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#007ACC] sm:w-48"
                  />
                </div>

                <div className="border border-[#3F3F46] rounded-lg overflow-hidden bg-[#1E1E1E] max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[#2D2D30] text-[#AAAAAA] sticky top-0 border-b border-[#3F3F46]">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">Use</th>
                        <th className="py-2 px-3 w-14">Row #</th>
                        {targetColumns.map((col) => (
                          <th key={col.name} className="py-2 px-3 font-semibold text-cyan-300">
                            {col.name}
                          </th>
                        ))}
                        <th className="py-2 px-3 w-28 text-center">Status</th>
                        <th className="py-2 px-3 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2D30]">
                      {visibleItems.length === 0 ? (
                        <tr>
                          <td colSpan={targetColumns.length + 4} className="py-8 text-center text-[#888888]">
                            No preview records available. Please check column mappings.
                          </td>
                        </tr>
                      ) : (
                        visibleItems.map((item, idx) => {
                          const hasErr = Object.values(item.fieldErrors).some((e) => e !== null);
                          const isDisabled = item.isEmpty || (removeDuplicates && item.isDuplicate) || (skipInvalidRows && hasErr);

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-[#252526] transition-colors ${
                                item.excluded || isDisabled ? 'opacity-40 bg-[#181818]' : ''
                              }`}
                            >
                              <td className="py-1.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!item.excluded && !isDisabled}
                                  disabled={isDisabled}
                                  onChange={() => handleToggleExcludeRow(idx)}
                                  className="w-3.5 h-3.5 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC]"
                                />
                              </td>
                              <td className="py-1.5 px-3 text-[#777777]">
                                {item.originalIndex}
                              </td>

                              {targetColumns.map((col) => {
                                const val = item.cleanedRecord[col.name];
                                const err = item.fieldErrors[col.name];

                                return (
                                  <td
                                    key={col.name}
                                    className={`py-1.5 px-3 ${
                                      err
                                        ? 'text-red-400 font-bold bg-red-950/20'
                                        : val !== null && val !== undefined
                                        ? 'text-white'
                                        : 'text-[#666666] italic'
                                    }`}
                                    title={err || undefined}
                                  >
                                    {val !== null && val !== undefined ? String(val) : '<NULL>'}
                                    {err && <span className="ml-1 text-[10px] text-red-400">({err})</span>}
                                  </td>
                                );
                              })}

                              <td className="py-1.5 px-3 text-center">
                                {hasErr ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                                    Type Error
                                  </span>
                                ) : item.isDuplicate ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Duplicate
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Valid
                                  </span>
                                )}
                              </td>

                              <td className="py-1.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleExcludeRow(idx)}
                                  title={item.excluded ? 'Include' : 'Exclude'}
                                  className="p-1 text-[#888888] hover:text-red-400 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#1E1E1E] border-t border-[#3F3F46] flex items-center justify-between">
          <div className="text-xs text-[#888888] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Excel records will be used to generate SQL INSERT INTO {parameter.name} statements.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-[#CCCCCC] hover:text-white hover:bg-[#2D2D30] border border-[#3F3F46] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || validCount === 0}
              onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate INSERT INTO {parameter.name} ({validCount} rows)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
