export type WizardStep = 'select_query' | 'enter_variables' | 'review' | 'execution';

export type ParameterDataType = 'string' | 'number' | 'date' | 'boolean';

export type ParameterKind = 'single' | 'list' | 'table' | 'temp_table';

export interface TableColumnDefinition {
  name: string;
  type: string; // e.g. INT, NVARCHAR(50), DECIMAL(18,2)
  baseType: ParameterDataType;
  isNullable?: boolean;
}

export interface TableVariableDefinition {
  variableName: string; // e.g., "@Items" or "#Items"
  rawName: string; // "Items"
  columns: TableColumnDefinition[];
  declarationSql?: string;
  isTemporaryTable?: boolean; // true for #TempTable, false for @TableVar
}

export interface QueryParameterDefinition {
  id: string;
  name: string; // e.g., "@GISIDList", "@Status", "#Items", "@Items"
  rawName: string; // cleaned without @, #, :, {{
  label: string;
  kind: ParameterKind;
  type: ParameterDataType; // for single/list
  isList: boolean;
  isTable: boolean; // true for table variable or temp table
  isTempTable: boolean; // true for #TempTable
  tableDefinition?: TableVariableDefinition;
  required: boolean;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  detectedFromSql: boolean;
}

export interface ParameterValueState {
  paramId: string;
  paramName: string;
  kind: ParameterKind;
  value: string;
  listValues: string[];
  tableRows: Record<string, unknown>[]; // for temporary table or table variable
  isList: boolean;
  isTable: boolean;
  isTempTable: boolean;
  type: ParameterDataType;
  source: 'manual' | 'excel';
  excelSourceInfo?: {
    fileName: string;
    sheetName: string;
    columnName?: string;
    mappedColumns?: Record<string, string>; // { "ItemId": "Col A", "ItemCode": "Col B" }
    totalImported: number;
    duplicatesRemoved?: number;
    invalidRowsCount?: number;
  };
}

export interface ExcelColumnInfo {
  index: number;
  letter: string;
  headerName: string;
  sampleValues: string[];
  nonEmptyCount: number;
}

export interface ExcelImportOptions {
  hasHeader: boolean;
  trimWhitespace: boolean;
  removeDuplicates: boolean;
  removeEmpty: boolean;
  caseOption: 'none' | 'uppercase' | 'lowercase';
}

export interface ExcelRowItem {
  id: string;
  originalIndex: number;
  raw: string;
  cleaned: string;
  isDuplicate: boolean;
  isEmpty: boolean;
  isValid: boolean;
  excluded: boolean;
}

export interface TableVariableRowItem {
  id: string;
  originalIndex: number;
  rawRecord: Record<string, string>;
  cleanedRecord: Record<string, unknown>;
  fieldErrors: Record<string, string | null>;
  isDuplicate: boolean;
  isEmpty: boolean;
  isValid: boolean;
  excluded: boolean;
}
