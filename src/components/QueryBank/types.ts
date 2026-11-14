export type QueryCategory =
  | 'inspection_plots'
  | 'users_auth'
  | 'diagnostics_performance'
  | 'data_cleanup'
  | 'audit_logs'
  | 'general';

export type SqlOperationType =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'EXEC'
  | 'TRANSACTION'
  | 'DDL'
  | 'OTHER';

export interface QueryCardItem {
  id: string;
  title: string;
  category: QueryCategory;
  description: string;
  sql: string;
  tags: string[];
  database?: string;
  lastUsed?: string;
  operationType?: SqlOperationType;
}

export interface SqlOperationConfig {
  label: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  cardBorder: string;
  glowColor: string;
  tagClass: string;
}

export const SQL_OPERATION_STYLES: Record<SqlOperationType, SqlOperationConfig> = {
  SELECT: {
    label: 'SELECT',
    color: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
    cardBorder: 'border-sky-500/40 hover:border-sky-400',
    glowColor: 'shadow-sky-950/40',
    tagClass: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
  },
  INSERT: {
    label: 'INSERT',
    color: '#34D399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34D399',
    cardBorder: 'border-emerald-500/40 hover:border-emerald-400',
    glowColor: 'shadow-emerald-950/40',
    tagClass: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  },
  UPDATE: {
    label: 'UPDATE',
    color: '#FBBF24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#FBBF24',
    cardBorder: 'border-amber-500/40 hover:border-amber-400',
    glowColor: 'shadow-amber-950/40',
    tagClass: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  },
  DELETE: {
    label: 'DELETE',
    color: '#F87171',
    badgeBg: 'rgba(248, 113, 113, 0.18)',
    borderColor: '#F87171',
    cardBorder: 'border-rose-500/50 hover:border-rose-400',
    glowColor: 'shadow-rose-950/40',
    tagClass: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  },
  EXEC: {
    label: 'EXEC',
    color: '#C084FC',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    borderColor: '#C084FC',
    cardBorder: 'border-purple-500/40 hover:border-purple-400',
    glowColor: 'shadow-purple-950/40',
    tagClass: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
  },
  TRANSACTION: {
    label: 'TRANSACTION',
    color: '#818CF8',
    badgeBg: 'rgba(129, 140, 248, 0.15)',
    borderColor: '#818CF8',
    cardBorder: 'border-indigo-500/40 hover:border-indigo-400',
    glowColor: 'shadow-indigo-950/40',
    tagClass: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60',
  },
  DDL: {
    label: 'DDL / SCHEMA',
    color: '#2DD4BF',
    badgeBg: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2DD4BF',
    cardBorder: 'border-teal-500/40 hover:border-teal-400',
    glowColor: 'shadow-teal-950/40',
    tagClass: 'bg-teal-950/60 text-teal-400 border-teal-800/60',
  },
  OTHER: {
    label: 'SQL',
    color: '#9CA3AF',
    badgeBg: 'rgba(156, 163, 175, 0.15)',
    borderColor: '#9CA3AF',
    cardBorder: 'border-[#3F3F46] hover:border-[#555555]',
    glowColor: 'shadow-black/20',
    tagClass: 'bg-[#2D2D30] text-[#AAAAAA] border-[#3F3F46]',
  },
};

export function detectSqlOperation(sql: string): SqlOperationType {
  if (!sql) return 'OTHER';
  
  // Clean comments and find the first meaningful SQL keyword
  const cleaned = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  const upper = cleaned.toUpperCase();

  if (upper.startsWith('BEGIN TRAN') || upper.startsWith('BEGIN TRANSACTION')) {
    if (upper.includes('DELETE')) return 'DELETE';
    if (upper.includes('UPDATE')) return 'UPDATE';
    if (upper.includes('INSERT')) return 'INSERT';
    return 'TRANSACTION';
  }

  if (/^\s*SELECT\b/i.test(cleaned)) return 'SELECT';
  if (/^\s*DELETE\b/i.test(cleaned)) return 'DELETE';
  if (/^\s*UPDATE\b/i.test(cleaned)) return 'UPDATE';
  if (/^\s*INSERT\b/i.test(cleaned)) return 'INSERT';
  if (/^\s*(EXEC|EXECUTE)\b/i.test(cleaned)) return 'EXEC';
  if (/^\s*(CREATE|ALTER|DROP|TRUNCATE)\b/i.test(cleaned)) {
    if (/^\s*(DROP|TRUNCATE)\b/i.test(cleaned)) return 'DELETE';
    return 'DDL';
  }

  // Fallback pattern scanning if preamble exists
  if (/\bDELETE\s+FROM\b|\bDELETE\s+\w+/i.test(cleaned)) return 'DELETE';
  if (/\bUPDATE\s+\w+\s+SET\b/i.test(cleaned)) return 'UPDATE';
  if (/\bINSERT\s+INTO\b/i.test(cleaned)) return 'INSERT';
  if (/\bSELECT\s+.+\s+FROM\b/i.test(cleaned)) return 'SELECT';
  if (/\bEXEC\s+\w+/i.test(cleaned)) return 'EXEC';

  return 'OTHER';
}

