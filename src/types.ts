export enum DatabaseObjectType {
  Database = 'Database',
  Folder = 'Folder',
  Table = 'Table',
  View = 'View',
  StoredProcedure = 'StoredProcedure',
  Function = 'Function',
  Column = 'Column',
}

export interface ColumnSchemaInfo {
  columnName: string;
  dataType: string;
  maxLength: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isIdentity: boolean;
  displayText?: string;
}

export interface TableSchemaInfo {
  schemaName: string;
  tableName: string;
  tableType: 'BASE TABLE' | 'VIEW';
  columns: ColumnSchemaInfo[];
  fullName?: string;
}

export interface DatabaseObject {
  id: string;
  name: string;
  details: string;
  type: DatabaseObjectType;
  children?: DatabaseObject[];
  isExpanded?: boolean;
  isVisible?: boolean;
}

export interface ConnectionConfig {
  id: string;
  name: string;
  server: string;
  database: string;
  integratedSecurity: boolean;
  username: string;
  password?: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
  timeout: number;
  isDefault: boolean;
  dbProvider?: 'SQL Server' | 'PostgreSQL';
}

export interface QueryResult {
  isSuccess: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  rowsAffected: number;
  executionTimeMs: number;
  message: string;
  errorDetails?: string;
}

export interface QueryHistoryItem {
  id: string;
  executedAt: string;
  queryText: string;
  isSuccess: boolean;
  durationMs: number;
  rowsAffected: number;
  connectionName: string;
}

export interface SystemInfoModel {
  machineName: string;
  userName: string;
  osVersion: string;
  dotNetRuntime: string;
  ipAddress: string;
  processor: string;
  totalMemory: string;
  cpuUsagePct: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  uptimeSeconds: number;
}

export interface CSharpFile {
  path: string;
  name: string;
  language: 'csharp' | 'xml' | 'json';
  content: string;
}
