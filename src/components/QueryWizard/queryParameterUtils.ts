import {
  QueryParameterDefinition,
  ParameterDataType,
  ParameterValueState,
  TableVariableDefinition,
  TableColumnDefinition,
} from './types';

// Convert column index (0-based) to Excel letter (A, B, ..., Z, AA, AB...)
export function indexToColumnLetter(index: number): string {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export function inferBaseTypeFromSqlType(sqlType: string): ParameterDataType {
  const upper = sqlType.toUpperCase();
  if (
    upper.includes('INT') ||
    upper.includes('DECIMAL') ||
    upper.includes('NUMERIC') ||
    upper.includes('FLOAT') ||
    upper.includes('REAL') ||
    upper.includes('MONEY') ||
    upper.includes('DOUBLE')
  ) {
    return 'number';
  }
  if (upper.includes('DATE') || upper.includes('TIME')) {
    return 'date';
  }
  if (upper.includes('BIT') || upper.includes('BOOL')) {
    return 'boolean';
  }
  return 'string';
}

// Split columns separated by comma outside of parentheses
function splitSqlColumns(colsBlock: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let depth = 0;
  for (let i = 0; i < colsBlock.length; i++) {
    const ch = colsBlock[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;

    if (ch === ',' && depth === 0) {
      if (cur.trim()) cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) cols.push(cur.trim());
  return cols;
}

// Parses table column definitions from a columns block
export function parseTableColumns(block: string): TableColumnDefinition[] {
  const colLines = splitSqlColumns(block);
  const columns: TableColumnDefinition[] = [];

  for (const line of colLines) {
    const trimmed = line.replace(/--.*$/, '').trim();
    if (!trimmed) continue;

    // Check if line is a table-level constraint like PRIMARY KEY (col) or CONSTRAINT ...
    if (/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|INDEX)\b/i.test(trimmed)) {
      continue;
    }

    // Match column name and SQL type: e.g. "ItemId INT" or "[ItemCode] NVARCHAR(50) NOT NULL"
    const colMatch = trimmed.match(/^\[?([a-zA-Z_][a-zA-Z0-9_]*)\]?\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?)/i);
    if (colMatch) {
      const colName = colMatch[1];
      const colSqlType = colMatch[2].toUpperCase();
      const baseType = inferBaseTypeFromSqlType(colSqlType);
      const isNullable = !trimmed.toUpperCase().includes('NOT NULL');

      columns.push({
        name: colName,
        type: colSqlType,
        baseType,
        isNullable,
      });
    }
  }

  return columns;
}

// Detect temporary tables: CREATE TABLE #TempTable ( ... )
export function detectTempTablesFromSql(sql: string): TableVariableDefinition[] {
  if (!sql) return [];

  const results: TableVariableDefinition[] = [];
  const tempTableRegex = /CREATE\s+TABLE\s+(#[a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\);?/gi;

  let match: RegExpExecArray | null;
  while ((match = tempTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const rawName = tableName.replace('#', '');
    const columnsBlock = match[2];

    const columns: TableColumnDefinition[] = parseTableColumns(columnsBlock);

    results.push({
      variableName: tableName,
      rawName,
      columns,
      declarationSql: match[0],
      isTemporaryTable: true,
    });
  }

  return results;
}

// Detect table variables: DECLARE @Var TABLE ( ... )
export function detectTableVariablesFromSql(sql: string): TableVariableDefinition[] {
  if (!sql) return [];

  const results: TableVariableDefinition[] = [];
  const tableVarRegex = /DECLARE\s+(@[a-zA-Z_][a-zA-Z0-9_]*)\s+TABLE\s*\(([\s\S]*?)\);?/gi;

  let match: RegExpExecArray | null;
  while ((match = tableVarRegex.exec(sql)) !== null) {
    const varName = match[1];
    const rawName = varName.replace('@', '');
    const columnsBlock = match[2];

    const columns: TableColumnDefinition[] = parseTableColumns(columnsBlock);

    results.push({
      variableName: varName,
      rawName,
      columns,
      declarationSql: match[0],
      isTemporaryTable: false,
    });
  }

  return results;
}

export function detectParametersFromSql(sql: string): QueryParameterDefinition[] {
  if (!sql) return [];

  const foundParams = new Map<string, QueryParameterDefinition>();
  const tableOrTempVarNames = new Set<string>();

  // 1. Detect Temporary Tables: CREATE TABLE #TempTable ( ... )
  const tempTables = detectTempTablesFromSql(sql);
  for (const tt of tempTables) {
    tableOrTempVarNames.add(tt.variableName.toUpperCase());
    tableOrTempVarNames.add(tt.rawName.toUpperCase());

    foundParams.set(tt.variableName, {
      id: `param-temp-${tt.rawName.toLowerCase()}`,
      name: tt.variableName,
      rawName: tt.rawName,
      label: `${formatParamLabel(tt.rawName)} (Temporary Table)`,
      kind: 'temp_table',
      type: 'string',
      isList: false,
      isTable: true,
      isTempTable: true,
      tableDefinition: tt,
      required: true,
      description: `Temporary table ${tt.variableName} with ${tt.columns.length} columns: ${tt.columns.map((c) => `${c.name} ${c.type}`).join(', ')}`,
      placeholder: `Upload Excel file to generate INSERT INTO ${tt.variableName}`,
      detectedFromSql: true,
    });
  }

  // 2. Detect Table Variables: DECLARE @Var TABLE ( ... )
  const tableVars = detectTableVariablesFromSql(sql);
  for (const tv of tableVars) {
    tableOrTempVarNames.add(tv.variableName.toUpperCase());
    tableOrTempVarNames.add(tv.rawName.toUpperCase());

    foundParams.set(tv.variableName, {
      id: `param-tbl-${tv.rawName.toLowerCase()}`,
      name: tv.variableName,
      rawName: tv.rawName,
      label: `${formatParamLabel(tv.rawName)} (Table Variable)`,
      kind: 'table',
      type: 'string',
      isList: false,
      isTable: true,
      isTempTable: false,
      tableDefinition: tv,
      required: true,
      description: `Table variable ${tv.variableName} with ${tv.columns.length} columns: ${tv.columns.map((c) => `${c.name} ${c.type}`).join(', ')}`,
      placeholder: `Upload Excel file to populate ${tv.variableName}`,
      detectedFromSql: true,
    });
  }

  // 3. Check for T-SQL style @ParamName (ignoring declared table variables or temp tables)
  const atParamRegex = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match: RegExpExecArray | null;
  while ((match = atParamRegex.exec(sql)) !== null) {
    const rawName = match[1];
    const fullName = `@${rawName}`;

    if (tableOrTempVarNames.has(fullName.toUpperCase()) || tableOrTempVarNames.has(rawName.toUpperCase())) {
      continue;
    }

    if (!foundParams.has(fullName)) {
      foundParams.set(fullName, createParamDef(fullName, rawName, sql));
    }
  }

  // 4. Check for colon style :paramName
  const colonParamRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = colonParamRegex.exec(sql)) !== null) {
    const rawName = match[1];
    const fullName = `:${rawName}`;

    if (tableOrTempVarNames.has(rawName.toUpperCase())) continue;

    if (!foundParams.has(fullName)) {
      foundParams.set(fullName, createParamDef(fullName, rawName, sql));
    }
  }

  // 5. Check for mustache style {{paramName}}
  const mustacheParamRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  while ((match = mustacheParamRegex.exec(sql)) !== null) {
    const rawName = match[1];
    const fullName = `{{${rawName}}}`;

    if (tableOrTempVarNames.has(rawName.toUpperCase())) continue;

    if (!foundParams.has(fullName)) {
      foundParams.set(fullName, createParamDef(fullName, rawName, sql));
    }
  }

  // 6. Check for comments like /*[PLAN_ID]*/ 76907
  const commentParamRegex = /\/\*\[([a-zA-Z_][a-zA-Z0-9_]*)\]\*\/\s*([^\s,;\)]+)?/g;
  while ((match = commentParamRegex.exec(sql)) !== null) {
    const rawName = match[1];
    const fullName = `/*[${rawName}]*/`;
    const defaultVal = match[2]?.trim();
    if (!foundParams.has(fullName)) {
      const def = createParamDef(fullName, rawName, sql);
      if (defaultVal) def.defaultValue = defaultVal;
      foundParams.set(fullName, def);
    }
  }

  // If no explicit parameters found in query, detect common hardcoded literals in WHERE clauses
  if (foundParams.size === 0) {
    // E.g. WHERE PlanId = 76907 or WHERE ID = 76907
    const whereIdMatch = sql.match(/WHERE\s+([a-zA-Z0-9_\.]+)\s*=\s*(\d+)/i);
    if (whereIdMatch) {
      const colName = whereIdMatch[1].split('.').pop() || 'ID';
      const defVal = whereIdMatch[2];
      const fullName = `@${colName}`;
      foundParams.set(fullName, {
        id: `param-${colName.toLowerCase()}`,
        name: fullName,
        rawName: colName,
        label: formatParamLabel(colName),
        kind: 'single',
        type: 'number',
        isList: false,
        isTable: false,
        isTempTable: false,
        required: true,
        defaultValue: defVal,
        description: `Filter by ${colName}`,
        detectedFromSql: true,
      });
    }

    // E.g. WHERE Email LIKE '%@example.com%'
    const whereEmailMatch = sql.match(/WHERE\s+([a-zA-Z0-9_\.]*Email[a-zA-Z0-9_\.]*)\s*(?:LIKE|=)\s*'([^']+)'/i);
    if (whereEmailMatch) {
      const colName = whereEmailMatch[1].split('.').pop() || 'Email';
      const defVal = whereEmailMatch[2].replace(/%/g, '');
      const fullName = `@${colName}`;
      foundParams.set(fullName, {
        id: `param-${colName.toLowerCase()}`,
        name: fullName,
        rawName: colName,
        label: formatParamLabel(colName),
        kind: 'single',
        type: 'string',
        isList: false,
        isTable: false,
        isTempTable: false,
        required: true,
        defaultValue: defVal,
        description: `Search or filter by ${colName}`,
        detectedFromSql: true,
      });
    }
  }

  return Array.from(foundParams.values());
}

function createParamDef(fullName: string, rawName: string, sql: string): QueryParameterDefinition {
  const lower = rawName.toLowerCase();

  const inClauseRegex = new RegExp(`IN\\s*\\([^)]*${escapeRegex(fullName)}[^)]*\\)`, 'i');
  const isInClause = inClauseRegex.test(sql);

  const isList =
    isInClause ||
    lower.endsWith('list') ||
    lower.endsWith('ids') ||
    lower.endsWith('array') ||
    lower.endsWith('values') ||
    lower.endsWith('codes') ||
    lower.includes('gisidlist') ||
    lower.includes('countrylist') ||
    lower.includes('planidlist');

  let type: ParameterDataType = 'string';
  if (lower.includes('date') || lower.includes('time')) {
    type = 'date';
  } else if (
    lower.startsWith('is') ||
    lower.startsWith('has') ||
    lower === 'active' ||
    lower === 'isactive'
  ) {
    type = 'boolean';
  } else if (
    (lower.includes('id') && !lower.includes('gis')) ||
    lower.includes('count') ||
    lower.includes('num') ||
    lower.includes('amount') ||
    lower.includes('price') ||
    lower.includes('total')
  ) {
    type = 'number';
  }

  let defaultValue: string | undefined = undefined;
  if (lower.includes('gisid')) {
    defaultValue = 'GIS-PLOT-88492, GIS-PLOT-88493, GIS-PLOT-88494';
  } else if (lower.includes('country')) {
    defaultValue = 'USA, UK, Germany';
  } else if (lower.includes('planid') && isList) {
    defaultValue = '76907, 76908, 76909';
  } else if (lower.includes('planid') || lower === 'plan_id') {
    defaultValue = '76907';
  } else if (lower.includes('status')) {
    defaultValue = 'InProgress';
  } else if (type === 'boolean') {
    defaultValue = 'true';
  }

  return {
    id: `param-${rawName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`,
    name: fullName,
    rawName,
    label: formatParamLabel(rawName),
    kind: isList ? 'list' : 'single',
    type,
    isList,
    isTable: false,
    isTempTable: false,
    required: true,
    defaultValue,
    description: isList
      ? `List of values for ${formatParamLabel(rawName)} (supports manual entry or Excel import)`
      : `Value for parameter ${formatParamLabel(rawName)}`,
    placeholder: isList ? 'e.g. VAL001, VAL002 or upload Excel' : `Enter ${formatParamLabel(rawName)}`,
    detectedFromSql: true,
  };
}

function formatParamLabel(raw: string): string {
  return raw
    .replace(/^#/, '')
    .replace(/^@/, '')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateParameterValues(
  paramDefs: QueryParameterDefinition[],
  values: Record<string, ParameterValueState>
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};

  for (const def of paramDefs) {
    const valState = values[def.id];
    if (!valState) {
      if (def.required) errors[def.id] = `${def.label} is required.`;
      continue;
    }

    if (def.isTable || def.isTempTable || def.kind === 'table' || def.kind === 'temp_table') {
      const rows = valState.tableRows || [];
      if (def.required && rows.length === 0) {
        errors[def.id] = `At least one record is required for table ${def.name}. Please upload an Excel workbook to generate INSERT statements.`;
        continue;
      }
      if (def.tableDefinition) {
        const requiredCols = def.tableDefinition.columns.filter((c) => !c.isNullable);
        let hasColError = false;
        for (const col of requiredCols) {
          const invalidRow = rows.find(
            (r) => r[col.name] === undefined || r[col.name] === null || String(r[col.name]).trim() === ''
          );
          if (invalidRow) {
            errors[def.id] = `Column "${col.name}" has missing required values in imported records.`;
            hasColError = true;
            break;
          }
        }
        if (hasColError) continue;
      }
    } else if (def.isList) {
      const items = valState.listValues || [];
      if (def.required && items.length === 0) {
        errors[def.id] = `At least one value is required for ${def.label}. Enter manually or upload an Excel file.`;
        continue;
      }
      if (def.type === 'number') {
        const invalid = items.filter((item) => isNaN(Number(item)));
        if (invalid.length > 0) {
          errors[def.id] = `All items in list must be numeric. Found invalid: ${invalid.slice(0, 3).join(', ')}`;
          continue;
        }
      }
    } else {
      const val = valState.value?.trim();
      if (def.required && (!val || val === '')) {
        errors[def.id] = `${def.label} is required.`;
        continue;
      }
      if (val && def.type === 'number' && isNaN(Number(val))) {
        errors[def.id] = `${def.label} must be a valid number.`;
        continue;
      }
    }

    errors[def.id] = null;
  }

  return errors;
}

export interface ParameterizedSqlResult {
  parameterizedSql: string;
  sqlParamsDeclaration: string;
  spExecuteSqlScript: string;
  executionBindings: Record<string, unknown>;
  expandedParameters: Array<{
    key: string;
    type: string;
    value: unknown;
    source: string;
  }>;
}

// Format SQL literal values for INSERT statements generated from Excel data
export function formatSqlLiteralValue(val: unknown, baseType: ParameterDataType): string {
  if (val === undefined || val === null || val === '') return 'NULL';
  if (baseType === 'number') {
    const num = Number(val);
    return isNaN(num) ? '0' : String(num);
  }
  if (baseType === 'boolean') {
    const bool = String(val).toLowerCase() === 'true' || val === 1 || String(val).toLowerCase() === 'yes';
    return bool ? '1' : '0';
  }
  // String or Date: single quoted and escaped
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generateParameterizedSql(
  baseSql: string,
  paramDefs: QueryParameterDefinition[],
  paramValues: Record<string, ParameterValueState>
): ParameterizedSqlResult {
  let workingSql = baseSql;
  const executionBindings: Record<string, unknown> = {};
  const expandedParameters: Array<{
    key: string;
    type: string;
    value: unknown;
    source: string;
  }> = [];
  const declareStatements: string[] = [];
  const spParamsDeclList: string[] = [];
  const spParamsValuesList: string[] = [];

  for (const def of paramDefs) {
    const valState = paramValues[def.id];
    const sourceLabel =
      valState?.source === 'excel'
        ? `Excel: ${valState.excelSourceInfo?.fileName || 'File'}`
        : 'Manual';

    // 1. Handle TEMPORARY TABLE (#TempTable) or TABLE VARIABLE (@TableVar)
    // Excel file is used ONLY as source for generating clean SQL INSERT INTO statements
    // Do NOT create a variable/parameter for every Excel row.
    if (def.isTable || def.isTempTable || def.kind === 'temp_table' || def.kind === 'table') {
      const tv = def.tableDefinition;
      const rows = valState?.tableRows || [];
      const tableName = def.name; // e.g. "#Items" or "@Items"
      const columns = tv?.columns || (rows.length > 0 ? Object.keys(rows[0]).map((k) => ({ name: k, type: 'NVARCHAR(100)', baseType: 'string' as ParameterDataType })) : []);

      executionBindings[def.name] = rows;
      executionBindings[def.rawName] = rows;

      expandedParameters.push({
        key: tableName,
        type: def.isTempTable ? 'TEMPORARY TABLE' : 'TABLE VARIABLE',
        value: `${rows.length} rows to INSERT`,
        source: sourceLabel,
      });

      if (rows.length > 0 && columns.length > 0) {
        const colNamesStr = columns.map((c) => c.name).join(', ');
        const rowValueTuples: string[] = [];

        rows.forEach((row) => {
          const valuesList = columns.map((col) => {
            const rawVal = row[col.name];
            return formatSqlLiteralValue(rawVal, col.baseType);
          });
          rowValueTuples.push(`(${valuesList.join(', ')})`);
        });

        // Exact INSERT INTO statement generated from Excel
        const insertBlock = `\n-- Generated from Excel\nINSERT INTO ${tableName} (${colNamesStr})\nVALUES\n${rowValueTuples.join(',\n')};\n`;

        // Check if query contains CREATE TABLE #TempTable (...) or DECLARE @Var TABLE (...)
        const createTableRegex = new RegExp(`(CREATE\\s+TABLE\\s+${escapeRegex(tableName)}\\s*\\([\\s\\S]*?\\);?)`, 'i');
        const declareTableRegex = new RegExp(`(DECLARE\\s+${escapeRegex(tableName)}\\s+TABLE\\s*\\([\\s\\S]*?\\);?)`, 'i');

        if (createTableRegex.test(workingSql)) {
          // Place insert statements immediately after the CREATE TABLE statement
          workingSql = workingSql.replace(createTableRegex, `$1\n${insertBlock}`);
        } else if (declareTableRegex.test(workingSql)) {
          // Place insert statements immediately after the DECLARE TABLE statement
          workingSql = workingSql.replace(declareTableRegex, `$1\n${insertBlock}`);
        } else {
          // If query didn't have CREATE TABLE, create it and prepend
          if (def.isTempTable) {
            const createBlock = `CREATE TABLE ${tableName}\n(\n${columns.map((c) => `    ${c.name} ${c.type}`).join(',\n')}\n);\n${insertBlock}`;
            workingSql = `${createBlock}\n${workingSql}`;
          } else {
            const declBlock = `DECLARE ${tableName} TABLE\n(\n${columns.map((c) => `    ${c.name} ${c.type}`).join(',\n')}\n);\n${insertBlock}`;
            workingSql = `${declBlock}\n${workingSql}`;
          }
        }
      }
    } else if (def.isList) {
      // 2. Handle LIST PARAMETER (IN clause)
      const items = valState?.listValues || [];
      const paramBaseName = def.rawName;
      const placeholderList: string[] = [];

      items.forEach((item, idx) => {
        const itemParamName = `@${paramBaseName}_${idx}`;
        placeholderList.push(itemParamName);

        const sqlDataType =
          def.type === 'number' ? 'int' : def.type === 'date' ? 'datetime2' : 'nvarchar(100)';
        const formattedVal =
          def.type === 'number' ? Number(item) : String(item);

        expandedParameters.push({
          key: itemParamName,
          type: sqlDataType,
          value: formattedVal,
          source: sourceLabel,
        });

        declareStatements.push(
          `DECLARE ${itemParamName} ${sqlDataType} = ${
            def.type === 'number' ? formattedVal : `N'${escapeSqlLiteral(String(item))}'`
          };`
        );

        spParamsDeclList.push(`${itemParamName} ${sqlDataType}`);
        spParamsValuesList.push(
          `${itemParamName} = ${
            def.type === 'number' ? formattedVal : `N'${escapeSqlLiteral(String(item))}'`
          }`
        );
      });

      executionBindings[def.name] = items;
      executionBindings[def.rawName] = items;

      const expandedInClause =
        placeholderList.length > 0 ? placeholderList.join(', ') : 'NULL';

      const inWithParamRegex = new RegExp(
        `IN\\s*\\(\\s*${escapeRegex(def.name)}\\s*\\)`,
        'gi'
      );
      if (inWithParamRegex.test(workingSql)) {
        workingSql = workingSql.replace(inWithParamRegex, `IN (${expandedInClause})`);
      } else {
        workingSql = workingSql.replace(
          new RegExp(escapeRegex(def.name), 'g'),
          expandedInClause
        );
      }
    } else {
      // 3. Handle SCALAR PARAMETER
      const paramName = def.name.startsWith('@') ? def.name : `@${def.rawName}`;
      const rawVal = valState?.value ?? def.defaultValue ?? '';
      const sqlDataType =
        def.type === 'number'
          ? 'int'
          : def.type === 'boolean'
          ? 'bit'
          : def.type === 'date'
          ? 'datetime2'
          : 'nvarchar(255)';

      let boundVal: unknown = rawVal;
      let sqlLiteral = `'${escapeSqlLiteral(rawVal)}'`;

      if (def.type === 'number') {
        boundVal = Number(rawVal);
        sqlLiteral = String(boundVal);
      } else if (def.type === 'boolean') {
        boundVal = rawVal === 'true' || rawVal === '1';
        sqlLiteral = boundVal ? '1' : '0';
      }

      expandedParameters.push({
        key: paramName,
        type: sqlDataType,
        value: boundVal,
        source: 'Manual',
      });

      executionBindings[def.name] = boundVal;
      executionBindings[def.rawName] = boundVal;

      declareStatements.push(
        `DECLARE ${paramName} ${sqlDataType} = ${sqlLiteral};`
      );
      spParamsDeclList.push(`${paramName} ${sqlDataType}`);
      spParamsValuesList.push(`${paramName} = ${sqlLiteral}`);

      if (def.name.startsWith('/*[')) {
        const commentPattern = new RegExp(
          `${escapeRegex(def.name)}\\s*[^\\s,;\\)]+`,
          'g'
        );
        workingSql = workingSql.replace(commentPattern, paramName);
      } else if (def.name.startsWith('{{')) {
        workingSql = workingSql.replace(
          new RegExp(escapeRegex(def.name), 'g'),
          paramName
        );
      } else if (def.name.startsWith(':')) {
        workingSql = workingSql.replace(
          new RegExp(escapeRegex(def.name), 'g'),
          paramName
        );
      }
    }
  }

  // Combined final executable SQL script
  let spExecuteSqlScript = '';
  if (declareStatements.length > 0) {
    const escapedQueryForSp = workingSql.replace(/'/g, "''");
    spExecuteSqlScript = `-- Parameterized Execution Plan
${declareStatements.join('\n')}

-- Executing combined batch with parameters:
EXEC sp_executesql
    N'${escapedQueryForSp}',
    N'${spParamsDeclList.join(', ')}',
    ${spParamsValuesList.join(',\n    ')};`;
  } else {
    // If no scalar parameters, display the clean combined SQL execution script directly
    spExecuteSqlScript = workingSql;
  }

  return {
    parameterizedSql: workingSql,
    sqlParamsDeclaration: declareStatements.join('\n'),
    spExecuteSqlScript,
    executionBindings,
    expandedParameters,
  };
}

function escapeSqlLiteral(val: string): string {
  return val.replace(/'/g, "''");
}
