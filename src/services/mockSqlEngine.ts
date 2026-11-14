import { QueryResult } from '../types';
import { initialTablesData } from '../data/sampleDbData';

// Maintain in-memory copy of tables data that users can query, insert into, update, delete!
const dbTablesStore: Record<string, Record<string, unknown>[]> = JSON.parse(
  JSON.stringify(initialTablesData)
);

export function executeSqlSimulated(sqlText: string, connectionName: string): QueryResult {
  const startTime = performance.now();
  const trimmed = sqlText.trim();
  const upper = trimmed.toUpperCase();

  // Simulate network latency delay
  const durationMs = Math.floor(Math.random() * 25) + 8;

  if (!trimmed) {
    return {
      isSuccess: false,
      rowsAffected: 0,
      executionTimeMs: durationMs,
      message: 'Empty SQL query statement.',
      errorDetails: 'Cannot execute an empty SQL string.',
    };
  }

  // Handle Temporary Table (#Items) or Table Variable (@Items) combined scripts
  if (
    upper.includes('#ITEMS') ||
    upper.includes('@ITEMS') ||
    upper.includes('FROM #ITEMS') ||
    upper.includes('FROM @ITEMS') ||
    upper.includes('JOIN #ITEMS') ||
    upper.includes('JOIN @ITEMS')
  ) {
    let itemsTable: Record<string, unknown>[] = [];
    const insertMatch = trimmed.match(/INSERT\s+INTO\s+[#@]Items[^(]*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/i);
    if (insertMatch) {
      const colNames = insertMatch[1].split(',').map((c) => c.trim().replace(/[\[\]]/g, ''));
      const valuesRaw = insertMatch[2];
      const rowMatches = valuesRaw.match(/\(([^)]+)\)/g);
      if (rowMatches) {
        itemsTable = rowMatches.map((rowStr) => {
          const inner = rowStr.replace(/^\(|\)$/g, '');
          const vals = inner.split(',').map((v) => v.trim().replace(/^'|'$/g, ''));
          const obj: Record<string, unknown> = {};
          colNames.forEach((col, i) => {
            obj[col] = vals[i];
          });
          return obj;
        });
      }
    }

    if (itemsTable.length === 0) {
      itemsTable = [
        { ItemId: 1001, ItemCode: 'ABC001', Quantity: 5 },
        { ItemId: 1002, ItemCode: 'ABC002', Quantity: 10 },
        { ItemId: 1003, ItemCode: 'ABC003', Quantity: 7 },
      ];
    }

    const products = dbTablesStore['dbo.Products'] || [];
    const resultRows = itemsTable.map((item) => {
      const itemId = item.ItemId !== undefined ? Number(item.ItemId) : 1;
      const matchedProduct = products.find((p) => Number(p.ProductID) === itemId);
      const unitPrice = matchedProduct ? Number(matchedProduct.UnitPrice) : 45.0;
      const qty = item.Quantity !== undefined ? Number(item.Quantity) : 1;
      return {
        ItemId: item.ItemId,
        ItemCode: item.ItemCode || `ITEM-${itemId}`,
        Quantity: qty,
        ProductName: matchedProduct ? matchedProduct.ProductName : 'Custom Catalog Item',
        Category: matchedProduct ? matchedProduct.Category : 'General Hardware',
        UnitPrice: unitPrice,
        ProjectedTotal: Number((qty * unitPrice).toFixed(2)),
      };
    });

    const isTemp = upper.includes('#ITEMS');
    return {
      isSuccess: true,
      data: resultRows,
      columns: Object.keys(resultRows[0]),
      rowsAffected: resultRows.length,
      executionTimeMs: durationMs,
      message: `Batch executed successfully on ${connectionName}. ${isTemp ? 'Temporary table #Items' : 'Table variable @Items'} loaded and queried (${resultRows.length} row(s)).`,
    };
  }

  // Handle SELECT statements
  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
    // Check if selecting from a known table
    let matchedTable: string | null = null;
    for (const tableName of Object.keys(dbTablesStore)) {
      const cleanName = tableName.replace('dbo.', '');
      if (
        upper.includes(tableName.toUpperCase()) ||
        upper.includes(cleanName.toUpperCase())
      ) {
        matchedTable = tableName;
        break;
      }
    }

    if (matchedTable && dbTablesStore[matchedTable]) {
      let rows = [...dbTablesStore[matchedTable]];

      // Handle simple WHERE filter simulation
      if (upper.includes('WHERE')) {
        if (upper.includes("ACTIVE = 1") || upper.includes("ISACTIVE = TRUE") || upper.includes("ISACTIVE = 1")) {
          rows = rows.filter((r) => r.IsActive === true);
        } else if (upper.includes('COUNTRY') && upper.includes('USA')) {
          rows = rows.filter((r) => r.Country === 'USA');
        }
      }

      // Handle TOP N
      const topMatch = upper.match(/TOP\s+(\d+)/);
      if (topMatch && topMatch[1]) {
        const topLimit = parseInt(topMatch[1], 10);
        rows = rows.slice(0, topLimit);
      }

      const columns = rows.length > 0 ? Object.keys(rows[0]) : ['Message'];
      const endTime = performance.now();

      return {
        isSuccess: true,
        data: rows,
        columns,
        rowsAffected: rows.length,
        executionTimeMs: Math.round((endTime - startTime) + durationMs),
        message: `Query executed successfully on ${connectionName}. Returned ${rows.length} row(s).`,
      };
    }

    // Generic fallback for custom query like SELECT 1 or sys queries
    if (upper.includes('SYS.TABLES') || upper.includes('INFORMATION_SCHEMA')) {
      const mockSysRows = Object.keys(dbTablesStore).map((t, idx) => ({
        object_id: 1000 + idx,
        schema_name: 'dbo',
        name: t.replace('dbo.', ''),
        type_desc: 'USER_TABLE',
        create_date: '2025-01-01 00:00:00',
        modify_date: '2026-07-28 12:00:00',
      }));

      return {
        isSuccess: true,
        data: mockSysRows,
        columns: Object.keys(mockSysRows[0]),
        rowsAffected: mockSysRows.length,
        executionTimeMs: durationMs,
        message: `Command completed successfully. 4 system table(s) listed.`,
      };
    }

    // Default mock select response
    const mockDefault = [
      { Result: 'Success', ServerTime: new Date().toISOString(), ConnectedDatabase: connectionName },
    ];
    return {
      isSuccess: true,
      data: mockDefault,
      columns: Object.keys(mockDefault[0]),
      rowsAffected: 1,
      executionTimeMs: durationMs,
      message: `Query executed successfully. 1 row returned.`,
    };
  }

  // Handle INSERT statements
  if (upper.startsWith('INSERT')) {
    let matchedTable: string | null = null;
    for (const tableName of Object.keys(dbTablesStore)) {
      if (upper.includes(tableName.toUpperCase()) || upper.includes(tableName.replace('dbo.', '').toUpperCase())) {
        matchedTable = tableName;
        break;
      }
    }

    if (matchedTable && dbTablesStore[matchedTable]) {
      const newId = Math.floor(Math.random() * 9000) + 1000;
      if (matchedTable === 'dbo.Customers') {
        dbTablesStore['dbo.Customers'].push({
          CustomerID: newId,
          CompanyName: 'New Client Enterprise',
          ContactName: 'Alex Mercer',
          ContactEmail: 'alex.m@newclient.org',
          Country: 'USA',
          AccountBalance: 5000.0,
          IsActive: true,
          CreatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
      } else if (matchedTable === 'dbo.AuditLogs') {
        dbTablesStore['dbo.AuditLogs'].push({
          LogID: newId,
          Timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          UserName: 'DOMAIN\\it_admin',
          ActionType: 'CUSTOM_INSERT',
          Details: 'User executed custom INSERT statement',
        });
      }

      return {
        isSuccess: true,
        rowsAffected: 1,
        executionTimeMs: durationMs + 10,
        message: `(1 row affected) inserted into ${matchedTable || 'table'}.`,
      };
    }

    return {
      isSuccess: true,
      rowsAffected: 1,
      executionTimeMs: durationMs + 10,
      message: `(1 row affected) successfully inserted.`,
    };
  }

  // Handle UPDATE / DELETE
  if (upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
    const action = upper.startsWith('UPDATE') ? 'updated' : 'deleted';
    return {
      isSuccess: true,
      rowsAffected: 1,
      executionTimeMs: durationMs + 8,
      message: `(1 row affected) ${action} successfully.`,
    };
  }

  // Handle EXEC / STORED PROCEDURE
  if (upper.startsWith('EXEC') || upper.startsWith('EXECUTE')) {
    const mockReportData = [
      { Metric: 'Total Executions', Value: '1,420', LastUpdated: '2026-07-29 03:00' },
      { Metric: 'Avg Query Duration', Value: '18.4 ms', LastUpdated: '2026-07-29 03:00' },
      { Metric: 'Failed Queries', Value: '0', LastUpdated: '2026-07-29 03:00' },
    ];
    return {
      isSuccess: true,
      data: mockReportData,
      columns: Object.keys(mockReportData[0]),
      rowsAffected: mockReportData.length,
      executionTimeMs: durationMs + 25,
      message: `Stored procedure executed successfully. 3 result row(s) returned.`,
    };
  }

  // Handle DDL (CREATE, ALTER, DROP)
  if (upper.startsWith('CREATE') || upper.startsWith('ALTER') || upper.startsWith('DROP')) {
    return {
      isSuccess: true,
      rowsAffected: 0,
      executionTimeMs: durationMs + 15,
      message: `Commands completed successfully. Schema modification applied.`,
    };
  }

  // Syntax error simulation if prompt contains ERROR or bad syntax
  if (upper.includes('INVALID') || upper.includes('SYNTAX_ERROR')) {
    return {
      isSuccess: false,
      rowsAffected: 0,
      executionTimeMs: durationMs,
      message: 'Execution error occurred.',
      errorDetails: `Msg 102, Level 15, State 1, Line 1\nIncorrect syntax near '${trimmed.substring(0, 15)}'. Check SQL Server syntax documentation.`,
    };
  }

  // Fallback default response for any command
  return {
    isSuccess: true,
    rowsAffected: 1,
    executionTimeMs: durationMs,
    message: `Command completed successfully.`,
  };
}

export function executeParameterizedSqlSimulated(
  sqlTemplate: string,
  parameters: Record<string, unknown>,
  connectionName: string = 'Production SQL Server (SalesDB)'
): QueryResult {
  const startTime = performance.now();
  const trimmed = sqlTemplate.trim();
  const upper = trimmed.toUpperCase();
  const durationMs = Math.floor(Math.random() * 20) + 12;

  if (!trimmed) {
    return {
      isSuccess: false,
      rowsAffected: 0,
      executionTimeMs: durationMs,
      message: 'Empty SQL query statement.',
      errorDetails: 'Cannot execute an empty parameterized SQL string.',
    };
  }

  // Handle #Items Temporary Table or @Items Table Variable Queries
  if (
    upper.includes('#ITEMS') ||
    upper.includes('@ITEMS') ||
    upper.includes('FROM #ITEMS') ||
    upper.includes('FROM @ITEMS') ||
    upper.includes('JOIN #ITEMS') ||
    upper.includes('JOIN @ITEMS')
  ) {
    let itemsTable = (parameters['#Items'] || parameters['@Items'] || parameters['Items']) as Record<string, unknown>[];

    // If not found in parameters, try to parse from INSERT INTO #Items / @Items in sqlTemplate
    if (!itemsTable || itemsTable.length === 0) {
      const insertMatch = sqlTemplate.match(/INSERT\s+INTO\s+[#@]Items[^(]*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/i);
      if (insertMatch) {
        const colNames = insertMatch[1].split(',').map((c) => c.trim().replace(/[\[\]]/g, ''));
        const valuesRaw = insertMatch[2];
        const rowMatches = valuesRaw.match(/\(([^)]+)\)/g);
        if (rowMatches) {
          itemsTable = rowMatches.map((rowStr) => {
            const inner = rowStr.replace(/^\(|\)$/g, '');
            const vals = inner.split(',').map((v) => v.trim().replace(/^'|'$/g, ''));
            const obj: Record<string, unknown> = {};
            colNames.forEach((col, i) => {
              obj[col] = vals[i];
            });
            return obj;
          });
        }
      }
    }

    if (Array.isArray(itemsTable) && itemsTable.length > 0 && typeof itemsTable[0] === 'object') {
      const products = dbTablesStore['dbo.Products'] || [];
      const resultRows = itemsTable.map((item) => {
        const itemId = item.ItemId !== undefined ? Number(item.ItemId) : 1;
        const matchedProduct = products.find((p) => Number(p.ProductID) === itemId);
        const unitPrice = matchedProduct ? Number(matchedProduct.UnitPrice) : 45.0;
        const qty = item.Quantity !== undefined ? Number(item.Quantity) : 1;
        return {
          ItemId: item.ItemId,
          ItemCode: item.ItemCode || `ITEM-${itemId}`,
          Quantity: qty,
          ProductName: matchedProduct ? matchedProduct.ProductName : 'Custom Catalog Item',
          Category: matchedProduct ? matchedProduct.Category : 'General Hardware',
          UnitPrice: unitPrice,
          ProjectedTotal: Number((qty * unitPrice).toFixed(2)),
        };
      });

      const isTemp = upper.includes('#ITEMS');
      return {
        isSuccess: true,
        data: resultRows,
        columns: Object.keys(resultRows[0]),
        rowsAffected: resultRows.length,
        executionTimeMs: durationMs,
        message: `Query with ${isTemp ? 'temporary table #Items' : 'table variable @Items'} executed successfully on ${connectionName}. Returned ${resultRows.length} record(s).`,
      };
    }
  }

  // Handle @CenterUpdates Table Variable Queries
  if (upper.includes('@CENTERUPDATES') || upper.includes('FROM @CENTERUPDATES')) {
    const centerTable = (parameters['@CenterUpdates'] || parameters['CenterUpdates']) as Record<string, unknown>[];
    if (Array.isArray(centerTable) && centerTable.length > 0 && typeof centerTable[0] === 'object') {
      const centers = dbTablesStore['dbo.InspectionPlanCenter'] || [];
      const resultRows = centerTable.map((row) => {
        const gis = String(row.GISID || '').trim().toUpperCase();
        const matched = centers.find((c) => String(c.GISID).trim().toUpperCase() === gis);
        return {
          GISID: row.GISID,
          NewCenterName: row.CenterName || 'Updated Center Name',
          CurrentCenterName: matched ? matched.CenterName : '<Not Registered>',
          TargetStatus: row.TargetStatus || 'Active',
          InspectionPlanId: matched ? matched.InspectionPlanId : null,
          SyncStatus: matched ? 'Matched - Ready to Sync' : 'GISID Not Found in Database',
        };
      });

      return {
        isSuccess: true,
        data: resultRows,
        columns: Object.keys(resultRows[0]),
        rowsAffected: resultRows.length,
        executionTimeMs: durationMs,
        message: `Query with table variable @CenterUpdates executed successfully on ${connectionName}. Processed ${resultRows.length} record(s).`,
      };
    }
  }

  // Generic check for any custom Table Variable passed in parameters
  for (const [key, val] of Object.entries(parameters)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      const recordArray = val as Record<string, unknown>[];
      if (upper.includes(key.toUpperCase()) || upper.includes(key.replace('@', '').toUpperCase())) {
        return {
          isSuccess: true,
          data: recordArray,
          columns: Object.keys(recordArray[0]),
          rowsAffected: recordArray.length,
          executionTimeMs: durationMs,
          message: `Query with table variable ${key} executed successfully on ${connectionName}. Processed ${recordArray.length} record(s).`,
        };
      }
    }
  }

  // Handle InspectionPlanCenter queries
  if (upper.includes('INSPECTIONPLANCENTER')) {
    let rows = [...(dbTablesStore['dbo.InspectionPlanCenter'] || [])];

    // Filter by GISID list or single GISID
    const gisParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('GIS')
    );
    if (gisParam) {
      const [_, val] = gisParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim().toUpperCase()));
        rows = rows.filter((r) => valSet.has(String(r.GISID).toUpperCase()));
      } else if (val) {
        rows = rows.filter((r) => String(r.GISID).toUpperCase() === String(val).trim().toUpperCase());
      }
    }

    // Filter by InspectionPlanId
    const planParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('PLAN')
    );
    if (planParam) {
      const [_, val] = planParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim()));
        rows = rows.filter((r) => valSet.has(String(r.InspectionPlanId)));
      } else if (val !== undefined && val !== '') {
        rows = rows.filter((r) => String(r.InspectionPlanId) === String(val).trim());
      }
    }

    // If QuestionInspection join is requested, augment with question counts
    if (upper.includes('QUESTIONINSPECTION')) {
      const questions = dbTablesStore['dbo.QuestionInspection'] || [];
      rows = rows.map((center) => {
        const count = questions.filter((q) => q.InspectionPlanCenterId === center.ID).length;
        return {
          InspectionPlanId: center.InspectionPlanId,
          CenterId: center.ID,
          GISID: center.GISID,
          CenterName: center.CenterName,
          IsActive: center.IsActive,
          QuestionInspectionCount: count,
        };
      });
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['InspectionPlanId', 'CenterId', 'GISID', 'CenterName', 'IsActive'];
    const endTime = performance.now();

    return {
      isSuccess: true,
      data: rows,
      columns,
      rowsAffected: rows.length,
      executionTimeMs: Math.round((endTime - startTime) + durationMs),
      message: `Parameterized query executed successfully on ${connectionName}. Returned ${rows.length} row(s).`,
    };
  }

  // Handle InspectionPlan queries
  if (upper.includes('INSPECTIONPLAN') && !upper.includes('INSPECTIONPLANCENTER')) {
    let rows = [...(dbTablesStore['dbo.InspectionPlan'] || [])];

    const planParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('PLAN') || k.toUpperCase().includes('ID')
    );
    if (planParam) {
      const [_, val] = planParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim()));
        rows = rows.filter((r) => valSet.has(String(r.ID)));
      } else if (val) {
        rows = rows.filter((r) => String(r.ID) === String(val).trim());
      }
    }

    const statusParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('STATUS')
    );
    if (statusParam && statusParam[1]) {
      rows = rows.filter((r) => String(r.Status).toUpperCase() === String(statusParam[1]).toUpperCase());
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['ID', 'PlanName', 'Status', 'CreatedDate', 'ModifiedBy'];
    return {
      isSuccess: true,
      data: rows,
      columns,
      rowsAffected: rows.length,
      executionTimeMs: durationMs,
      message: `Parameterized query executed successfully on ${connectionName}. Returned ${rows.length} row(s).`,
    };
  }

  // Handle Customers queries
  if (upper.includes('CUSTOMERS')) {
    let rows = [...(dbTablesStore['dbo.Customers'] || [])];

    const countryParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('COUNTRY')
    );
    if (countryParam) {
      const [_, val] = countryParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim().toUpperCase()));
        rows = rows.filter((r) => valSet.has(String(r.Country).toUpperCase()));
      } else if (val) {
        rows = rows.filter((r) => String(r.Country).toUpperCase() === String(val).trim().toUpperCase());
      }
    }

    const custParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('CUSTOMER') || k.toUpperCase().includes('ID')
    );
    if (custParam) {
      const [_, val] = custParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim()));
        rows = rows.filter((r) => valSet.has(String(r.CustomerID)));
      } else if (val) {
        rows = rows.filter((r) => String(r.CustomerID) === String(val).trim());
      }
    }

    const activeParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('ACTIVE')
    );
    if (activeParam && activeParam[1] !== undefined) {
      const activeBool = String(activeParam[1]).toLowerCase() === 'true' || activeParam[1] === 1;
      rows = rows.filter((r) => r.IsActive === activeBool);
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['CustomerID', 'CompanyName', 'ContactName', 'Country', 'IsActive'];
    return {
      isSuccess: true,
      data: rows,
      columns,
      rowsAffected: rows.length,
      executionTimeMs: durationMs,
      message: `Parameterized query executed successfully on ${connectionName}. Returned ${rows.length} row(s).`,
    };
  }

  // Handle Users queries
  if (upper.includes('USERS')) {
    let rows = [...(dbTablesStore['dbo.Users'] || [])];

    const emailParam = Object.entries(parameters).find(([k]) =>
      k.toUpperCase().includes('EMAIL')
    );
    if (emailParam) {
      const [_, val] = emailParam;
      if (Array.isArray(val) && val.length > 0) {
        const valSet = new Set(val.map((v) => String(v).trim().toLowerCase()));
        rows = rows.filter((r) => valSet.has(String(r.Email).toLowerCase()));
      } else if (val) {
        rows = rows.filter((r) => String(r.Email).toLowerCase().includes(String(val).trim().toLowerCase()));
      }
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : ['Id', 'Email', 'IsActive', 'LastLoginDate', 'RoleName'];
    return {
      isSuccess: true,
      data: rows,
      columns,
      rowsAffected: rows.length,
      executionTimeMs: durationMs,
      message: `Parameterized query executed successfully on ${connectionName}. Returned ${rows.length} row(s).`,
    };
  }

  // Handle UPDATE or DELETE statements with parameterized input
  if (upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
    const isDelete = upper.startsWith('DELETE');
    // Calculate simulated rows affected based on list values count if available
    let affected = 1;
    for (const val of Object.values(parameters)) {
      if (Array.isArray(val)) {
        affected = Math.max(affected, val.length);
      }
    }
    return {
      isSuccess: true,
      rowsAffected: affected,
      executionTimeMs: durationMs + 10,
      message: `(${affected} row(s) affected). Statement executed safely via parameterized transaction on ${connectionName}.`,
    };
  }

  // General fallback for any other query:
  // Dynamically generate meaningful result rows reflecting the parameters provided
  const paramEntries = Object.entries(parameters);
  const sampleRows: Record<string, unknown>[] = [];

  // Check if any parameter is an array/list
  const listEntry = paramEntries.find(([_, val]) => Array.isArray(val) && val.length > 0);
  if (listEntry) {
    const [listKey, listVal] = listEntry;
    const items = listVal as unknown[];
    items.slice(0, 100).forEach((item, idx) => {
      const row: Record<string, unknown> = {
        RowIndex: idx + 1,
        [listKey.replace(/^[@:{}]*/, '')]: item,
      };
      // Add scalar params to row
      paramEntries.forEach(([k, v]) => {
        if (!Array.isArray(v)) {
          row[k.replace(/^[@:{}]*/, '')] = v;
        }
      });
      row['Status'] = 'Processed';
      row['LastSynced'] = new Date().toISOString().replace('T', ' ').substring(0, 19);
      sampleRows.push(row);
    });
  } else {
    // Single row with provided parameters
    const row: Record<string, unknown> = {
      ExecutionId: Math.floor(Math.random() * 90000) + 10000,
    };
    paramEntries.forEach(([k, v]) => {
      row[k.replace(/^[@:{}]*/, '')] = v;
    });
    row['ExecutionResult'] = 'Success';
    row['ExecutedAt'] = new Date().toISOString().replace('T', ' ').substring(0, 19);
    sampleRows.push(row);
  }

  const columns = sampleRows.length > 0 ? Object.keys(sampleRows[0]) : ['Result', 'Status'];
  return {
    isSuccess: true,
    data: sampleRows,
    columns,
    rowsAffected: sampleRows.length,
    executionTimeMs: durationMs,
    message: `Parameterized command completed successfully on ${connectionName}. Returned ${sampleRows.length} record(s).`,
  };
}

