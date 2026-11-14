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
} from 'lucide-react';
import { ExcelColumnInfo, ExcelImportOptions, ExcelRowItem, QueryParameterDefinition } from './types';
import { indexToColumnLetter } from './queryParameterUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  parameter: QueryParameterDefinition;
  onClose: () => void;
  onConfirmImport: (
    items: string[],
    meta: {
      fileName: string;
      sheetName: string;
      columnName: string;
      totalImported: number;
      duplicatesRemoved: number;
    }
  ) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  parameter,
  onClose,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [columns, setColumns] = useState<ExcelColumnInfo[]>([]);
  const [selectedColIndex, setSelectedColIndex] = useState<number>(0);
  const [rawSheetData, setRawSheetData] = useState<(string | number | boolean | null)[][]>([]);

  // Cleaning options
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(true);
  const [caseOption, setCaseOption] = useState<'none' | 'uppercase' | 'lowercase'>('none');

  // Manual exclusions
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());
  const [previewSearch, setPreviewSearch] = useState<string>('');

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
        setColumns([]);
        return;
      }

      // Detect number of columns from first 10 rows
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

      setColumns(detectedCols);

      // Auto-select best column: check if header name matches parameter name or label
      const paramNameLower = parameter.rawName.toLowerCase();
      let bestIndex = 0;
      for (const col of detectedCols) {
        const colNameLower = col.headerName.toLowerCase();
        if (
          colNameLower.includes(paramNameLower) ||
          paramNameLower.includes(colNameLower) ||
          (paramNameLower.includes('gis') && colNameLower.includes('gis')) ||
          (paramNameLower.includes('plan') && colNameLower.includes('plan')) ||
          (paramNameLower.includes('id') && colNameLower.includes('id'))
        ) {
          bestIndex = col.index;
          break;
        }
      }
      setSelectedColIndex(bestIndex);
      setExcludedRowIndices(new Set());
    } catch (err) {
      setParseError(`Error analyzing worksheet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Switch sheet
  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processWorksheet(workbook, sheetName, hasHeader);
    }
  };

  // Toggle header row
  const handleToggleHeader = (checked: boolean) => {
    setHasHeader(checked);
    if (workbook && selectedSheet) {
      processWorksheet(workbook, selectedSheet, checked);
    }
  };

  // Compute processed rows and stats
  const { processedRows, totalRaw, validCount, duplicateCount, emptyCount } = useMemo(() => {
    if (!rawSheetData || rawSheetData.length === 0) {
      return { processedRows: [], totalRaw: 0, validCount: 0, duplicateCount: 0, emptyCount: 0 };
    }

    const rows = hasHeader ? rawSheetData.slice(1) : rawSheetData;
    const items: ExcelRowItem[] = [];
    const seenValues = new Set<string>();

    let dups = 0;
    let empties = 0;

    rows.forEach((row, idx) => {
      const originalRowIndex = hasHeader ? idx + 2 : idx + 1;
      const rawVal = row && row[selectedColIndex] !== undefined ? String(row[selectedColIndex]) : '';

      let cleaned = rawVal;
      if (trimWhitespace) cleaned = cleaned.trim();

      if (caseOption === 'uppercase') cleaned = cleaned.toUpperCase();
      if (caseOption === 'lowercase') cleaned = cleaned.toLowerCase();

      const isEmpty = cleaned === '';
      if (isEmpty) empties++;

      const isDuplicate = !isEmpty && seenValues.has(cleaned);
      if (!isEmpty) {
        if (isDuplicate) {
          dups++;
        } else {
          seenValues.add(cleaned);
        }
      }

      // Check parameter type validation
      let isValidType = true;
      if (parameter.type === 'number' && !isEmpty) {
        isValidType = !isNaN(Number(cleaned));
      }

      const isValid = !isEmpty && (!removeDuplicates || !isDuplicate) && isValidType;
      const isExcluded = excludedRowIndices.has(idx);

      items.push({
        id: `row-${idx}`,
        originalIndex: originalRowIndex,
        raw: rawVal,
        cleaned,
        isDuplicate,
        isEmpty,
        isValid,
        excluded: isExcluded,
      });
    });

    const valids = items.filter(
      (item) =>
        !item.excluded &&
        !item.isEmpty &&
        (!removeDuplicates || !item.isDuplicate) &&
        (parameter.type !== 'number' || !isNaN(Number(item.cleaned)))
    ).length;

    return {
      processedRows: items,
      totalRaw: rows.length,
      validCount: valids,
      duplicateCount: dups,
      emptyCount: empties,
    };
  }, [
    rawSheetData,
    hasHeader,
    selectedColIndex,
    trimWhitespace,
    removeDuplicates,
    caseOption,
    excludedRowIndices,
    parameter.type,
  ]);

  // Filtered preview rows based on search
  const visiblePreviewRows = useMemo(() => {
    let rows = processedRows;
    if (removeEmpty) {
      rows = rows.filter((r) => !r.isEmpty);
    }
    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.cleaned.toLowerCase().includes(q) ||
          r.raw.toLowerCase().includes(q) ||
          String(r.originalIndex).includes(q)
      );
    }
    return rows;
  }, [processedRows, removeEmpty, previewSearch]);

  const handleToggleExcludeRow = (rowIdx: number) => {
    setExcludedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(rowIdx)) {
        next.delete(rowIdx);
      } else {
        next.add(rowIdx);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    // Extract final list of values
    const finalValues: string[] = [];
    const seen = new Set<string>();

    processedRows.forEach((item, idx) => {
      if (item.excluded) return;
      if (removeEmpty && item.isEmpty) return;
      if (item.isEmpty) return;

      if (removeDuplicates) {
        if (seen.has(item.cleaned)) return;
        seen.add(item.cleaned);
      }

      if (parameter.type === 'number' && isNaN(Number(item.cleaned))) {
        return;
      }

      finalValues.push(item.cleaned);
    });

    onConfirmImport(finalValues, {
      fileName: file?.name || 'ImportedData.xlsx',
      sheetName: selectedSheet,
      columnName: columns[selectedColIndex]?.headerName || `Column ${indexToColumnLetter(selectedColIndex)}`,
      totalImported: finalValues.length,
      duplicatesRemoved: duplicateCount,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#252526] border border-[#3F3F46] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#E0E0E0]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1E1E1E] border-b border-[#3F3F46] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Import List Values from Excel
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {parameter.name}
                </span>
              </h2>
              <p className="text-xs text-[#888888]">
                Upload an Excel workbook, select the column, validate duplicates, and preview before applying.
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
                  Click to browse or drag & drop Excel workbook
                </div>
                <div className="text-xs text-[#888888] mt-1">
                  Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2D2D30] border border-[#3F3F46] rounded-md text-xs text-[#CCCCCC] mt-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Targeting column for {parameter.label}
              </div>
            </div>
          ) : (
            /* Uploaded File Info Bar */
            <div className="p-3 bg-[#1E1E1E] border border-[#3F3F46] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    {file.name}
                    <span className="text-[10px] text-[#888888] font-mono">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <div className="text-[11px] text-[#888888]">
                    {sheetNames.length} Sheet(s) detected • {totalRaw} row(s) read
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setWorkbook(null);
                  setRawSheetData([]);
                  setColumns([]);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#888888] hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-800/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change File</span>
              </button>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {file && columns.length > 0 && (
            <div className="space-y-5">
              {/* Sheet & Column Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sheet Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Select Worksheet
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSelectSheet(e.target.value)}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded-md px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#007ACC]"
                  >
                    {sheetNames.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Column Selector */}
                <div>
                  <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5">
                    Select Column to Extract
                  </label>
                  <select
                    value={selectedColIndex}
                    onChange={(e) => setSelectedColIndex(Number(e.target.value))}
                    className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded-md px-3 py-2 text-xs text-white focus:outline-hidden focus:border-[#007ACC]"
                  >
                    {columns.map((col) => (
                      <option key={col.index} value={col.index}>
                        [{col.letter}] {col.headerName} ({col.nonEmptyCount} non-empty items)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Cleaning & Validation Settings */}
              <div className="p-4 bg-[#1E1E1E] border border-[#3F3F46] rounded-lg space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2 uppercase tracking-wider text-[10px]">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  Validation & Cleaning Filters
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* First row is header */}
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => handleToggleHeader(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC] focus:ring-0"
                    />
                    <span>First row is header</span>
                  </label>

                  {/* Remove duplicates */}
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeDuplicates}
                      onChange={(e) => setRemoveDuplicates(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC] focus:ring-0"
                    />
                    <span className="flex items-center gap-1.5">
                      <span>Remove duplicates</span>
                      {duplicateCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono border border-amber-500/30">
                          {duplicateCount}
                        </span>
                      )}
                    </span>
                  </label>

                  {/* Trim whitespace */}
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trimWhitespace}
                      onChange={(e) => setTrimWhitespace(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC] focus:ring-0"
                    />
                    <span>Trim whitespace</span>
                  </label>

                  {/* Remove empty cells */}
                  <label className="flex items-center gap-2 text-xs text-[#CCCCCC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeEmpty}
                      onChange={(e) => setRemoveEmpty(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC] focus:ring-0"
                    />
                    <span>Exclude empty cells</span>
                  </label>
                </div>

                {/* Case transform pills */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#2D2D30]">
                  <span className="text-[11px] text-[#888888]">Letter Case:</span>
                  <div className="flex items-center gap-1 bg-[#2D2D30] p-0.5 rounded border border-[#3F3F46]">
                    <button
                      type="button"
                      onClick={() => setCaseOption('none')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        caseOption === 'none'
                          ? 'bg-[#007ACC] text-white'
                          : 'text-[#888888] hover:text-[#CCCCCC]'
                      }`}
                    >
                      As in File
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaseOption('uppercase')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        caseOption === 'uppercase'
                          ? 'bg-[#007ACC] text-white'
                          : 'text-[#888888] hover:text-[#CCCCCC]'
                      }`}
                    >
                      UPPERCASE
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaseOption('lowercase')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        caseOption === 'lowercase'
                          ? 'bg-[#007ACC] text-white'
                          : 'text-[#888888] hover:text-[#CCCCCC]'
                      }`}
                    >
                      lowercase
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Header & Stats */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-white">
                      Live Preview & Item Confirmation
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs font-mono font-medium border border-emerald-500/30">
                      {validCount} Ready to Import
                    </span>
                    {duplicateCount > 0 && removeDuplicates && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs font-mono border border-amber-500/30">
                        {duplicateCount} Duplicates Skipped
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Search preview values..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1 text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#007ACC] sm:w-48"
                  />
                </div>

                {/* Table Preview Container */}
                <div className="border border-[#3F3F46] rounded-lg overflow-hidden bg-[#1E1E1E] max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#2D2D30] text-[#AAAAAA] sticky top-0 border-b border-[#3F3F46]">
                      <tr>
                        <th className="py-2 px-3 w-12 text-center">Use</th>
                        <th className="py-2 px-3 w-16">Row #</th>
                        <th className="py-2 px-3">Cleaned Value</th>
                        <th className="py-2 px-3">Original Raw Value</th>
                        <th className="py-2 px-3 w-28 text-center">Status</th>
                        <th className="py-2 px-3 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2D30]">
                      {visiblePreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[#888888]">
                            No values matching criteria.
                          </td>
                        </tr>
                      ) : (
                        visiblePreviewRows.map((item, idx) => {
                          const isInvalidNumber =
                            parameter.type === 'number' && !item.isEmpty && isNaN(Number(item.cleaned));

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-[#252526] transition-colors ${
                                item.excluded || item.isEmpty || (removeDuplicates && item.isDuplicate)
                                  ? 'opacity-40 bg-[#1A1A1A]'
                                  : ''
                              }`}
                            >
                              <td className="py-1.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!item.excluded && !item.isEmpty && (!removeDuplicates || !item.isDuplicate)}
                                  disabled={item.isEmpty || (removeDuplicates && item.isDuplicate)}
                                  onChange={() => handleToggleExcludeRow(idx)}
                                  className="w-3.5 h-3.5 rounded bg-[#2D2D30] border-[#3F3F46] text-[#007ACC]"
                                />
                              </td>
                              <td className="py-1.5 px-3 font-mono text-[#888888]">
                                {item.originalIndex}
                              </td>
                              <td className="py-1.5 px-3 font-mono text-cyan-300 font-medium">
                                {item.cleaned || <span className="italic text-[#666666]">&lt;Empty&gt;</span>}
                              </td>
                              <td className="py-1.5 px-3 text-[#888888] font-mono truncate max-w-[200px]">
                                {item.raw || <span className="italic text-[#555555]">&lt;Empty&gt;</span>}
                              </td>
                              <td className="py-1.5 px-3 text-center">
                                {item.isEmpty ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                    Empty
                                  </span>
                                ) : item.isDuplicate ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Duplicate
                                  </span>
                                ) : isInvalidNumber ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                                    Not a Number
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
                                  title={item.excluded ? 'Include row' : 'Exclude row'}
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
            <Info className="w-3.5 h-3.5 text-[#007ACC]" />
            <span>Values will populate the list parameter for parameterized execution.</span>
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
              className="flex items-center gap-2 px-5 py-2 bg-[#007ACC] hover:bg-[#0098FF] disabled:bg-gray-700 disabled:opacity-50 text-white rounded-md text-xs font-medium shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confirm & Import ({validCount} values)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
