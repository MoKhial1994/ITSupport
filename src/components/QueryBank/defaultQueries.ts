import { QueryCardItem } from './types';

export const QUERY_CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  inspection_plots: { label: 'Inspection & Plots', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  users_auth: { label: 'Users & Permissions', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  diagnostics_performance: { label: 'Diagnostics & Locks', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  data_cleanup: { label: 'Data Cleanup & Safety', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
  audit_logs: { label: 'Audit & Telemetry', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
  general: { label: 'General Utility', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
};

export const DEFAULT_QUERY_BANK: QueryCardItem[] = [
  {
    id: 'qb-temp-table-items',
    title: 'Batch Items Lookup (#Items Temporary Table)',
    category: 'general',
    description: 'Uses a Temporary Table (#Items) where Excel data generates direct INSERT INTO #Items statements before query execution.',
    database: 'SalesDB',
    tags: ['Temp Table', '#Items', 'Excel Import', 'INSERT INTO', 'Wizard'],
    sql: `CREATE TABLE #Items
(
    ItemId INT,
    ItemCode NVARCHAR(50),
    Quantity INT
);

SELECT 
    i.ItemId,
    i.ItemCode,
    i.Quantity,
    ISNULL(p.ProductName, 'Custom Catalog Item') AS ProductName,
    ISNULL(p.Category, 'General Hardware') AS Category,
    ISNULL(p.UnitPrice, 45.00) AS UnitPrice,
    (i.Quantity * ISNULL(p.UnitPrice, 45.00)) AS ProjectedTotal
FROM #Items i
LEFT JOIN dbo.Products p WITH (NOLOCK) ON p.ProductID = i.ItemId
ORDER BY ProjectedTotal DESC;`,
  },
  {
    id: 'qb-table-var-items-pricing',
    title: 'Batch Item Inventory & Pricing Lookup (@Items Table Variable)',
    category: 'general',
    description: 'Demonstrates a Table Variable (@Items) populated with imported Excel records (ItemId, ItemCode, Quantity) joined with Products.',
    database: 'SalesDB',
    tags: ['Table Variable', 'Excel Import', 'Items', 'Quantity', 'Products'],
    sql: `DECLARE @Items TABLE
(
    ItemId INT,
    ItemCode NVARCHAR(50),
    Quantity INT
);

SELECT 
    i.ItemId,
    i.ItemCode,
    i.Quantity,
    ISNULL(p.ProductName, 'Custom Catalog Item') AS ProductName,
    ISNULL(p.Category, 'General') AS Category,
    ISNULL(p.UnitPrice, 45.00) AS UnitPrice,
    (i.Quantity * ISNULL(p.UnitPrice, 45.00)) AS ProjectedTotal
FROM @Items i
LEFT JOIN dbo.Products p WITH (NOLOCK) ON p.ProductID = i.ItemId
ORDER BY ProjectedTotal DESC;`,
  },
  {
    id: 'qb-table-var-center-sync',
    title: 'Batch Center GIS & Status Sync (@CenterUpdates Table Variable)',
    category: 'inspection_plots',
    description: 'Demonstrates a Table Variable (@CenterUpdates) with GISID, CenterName, TargetStatus mapped from Excel and matched with centers.',
    database: 'Production SQL',
    tags: ['Table Variable', 'Excel Import', 'CenterUpdates', 'GISID', 'Sync'],
    sql: `DECLARE @CenterUpdates TABLE
(
    GISID NVARCHAR(100),
    CenterName NVARCHAR(200),
    TargetStatus NVARCHAR(50)
);

SELECT 
    cu.GISID,
    cu.CenterName AS NewCenterName,
    ipc.CenterName AS CurrentCenterName,
    cu.TargetStatus,
    ipc.InspectionPlanId,
    CASE 
        WHEN ipc.ID IS NOT NULL THEN 'Matched - Ready to Sync'
        ELSE 'GISID Not Found in Database'
    END AS SyncStatus
FROM @CenterUpdates cu
LEFT JOIN InspectionPlanCenter ipc WITH (NOLOCK) ON ipc.GISID = cu.GISID;`,
  },
  {
    id: 'qb-bulk-fetch-plots-gisid',
    title: 'Bulk Fetch Plots by GISID List (IN Clause)',
    category: 'inspection_plots',
    description: 'Queries inspection centers and GIS plot metadata matching a list of GISIDs (supports Excel list import).',
    database: 'Production SQL',
    tags: ['Wizard', 'GISID', 'List', 'IN Clause', 'Excel'],
    sql: `SELECT 
    ipc.ID AS CenterId,
    ipc.InspectionPlanId,
    ipc.GISID,
    ipc.CenterName,
    ipc.IsActive,
    ipc.CreatedDate
FROM InspectionPlanCenter ipc WITH (NOLOCK)
WHERE ipc.GISID IN (@GISIDList)
ORDER BY ipc.CreatedDate DESC;`,
  },
  {
    id: 'qb-filter-customers-countries',
    title: 'Filter Customers by Status & Country List',
    category: 'general',
    description: 'Parameterized customer lookup filtering active accounts across multiple designated countries.',
    database: 'SalesDB',
    tags: ['Wizard', 'Customers', 'CountryList', 'Parameterized'],
    sql: `SELECT 
    CustomerID,
    CompanyName,
    ContactName,
    ContactEmail,
    Country,
    AccountBalance,
    IsActive
FROM dbo.Customers WITH (NOLOCK)
WHERE IsActive = @IsActive
  AND Country IN (@CountryList)
ORDER BY AccountBalance DESC;`,
  },
  {
    id: 'qb-batch-plans-lookup',
    title: 'Batch Inspection Plans by Status & Plan IDs',
    category: 'inspection_plots',
    description: 'Fetches plan details and workflow state for a designated list of plan IDs with status verification.',
    database: 'Production SQL',
    tags: ['Wizard', 'InspectionPlan', 'Status', 'PlanIds'],
    sql: `SELECT 
    ID AS PlanId,
    PlanName,
    Status,
    IsLocked,
    CreatedDate,
    ModifiedBy
FROM InspectionPlan WITH (NOLOCK)
WHERE Status = @Status
  AND ID IN (@PlanIdList);`,
  },
  {
    id: 'qb-inspection-plan-centers',
    title: 'Find Centers & Question Count by Plan ID',
    category: 'inspection_plots',
    description: 'Retrieves all inspection centers, plot counts, and question inspections attached to an InspectionPlanId.',
    database: 'Production SQL',
    tags: ['Inspection', 'Centers', 'PlanId', 'Plots'],
    sql: `SELECT 
    ipc.InspectionPlanId,
    ipc.ID AS CenterId,
    ipc.GISID,
    COUNT(qi.ID) AS QuestionInspectionCount
FROM InspectionPlanCenter ipc WITH (NOLOCK)
LEFT JOIN QuestionInspection qi WITH (NOLOCK) ON qi.InspectionPlanCenterId = ipc.ID
WHERE ipc.InspectionPlanId = /*[PLAN_ID]*/ 76907
GROUP BY ipc.InspectionPlanId, ipc.ID, ipc.GISID;`,
  },
  {
    id: 'qb-delete-corrupted-plan',
    title: 'Cascade Delete Corrupted Inspection Plan & Questions',
    category: 'data_cleanup',
    description: 'Safe multi-stage deletion script to remove broken inspection plans and cascaded questions.',
    database: 'Production SQL',
    tags: ['Delete', 'Inspection', 'Cascade', 'Cleanup'],
    sql: `BEGIN TRANSACTION;

-- 1. Delete questions first
DELETE QuestionInspection 
WHERE InspectionPlanCenterId IN (
    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = 76907
);

-- 2. Delete centers
DELETE InspectionPlanCenter 
WHERE InspectionPlanId = 76907;

-- 3. Delete root plan
DELETE InspectionPlan 
WHERE ID = 76907;

-- COMMIT TRANSACTION;`,
  },
  {
    id: 'qb-update-plan-status',
    title: 'Update Inspection Plan Status & Sync Timestamp',
    category: 'inspection_plots',
    description: 'Updates plan workflow status to InProgress and refreshes LastModifiedDate.',
    database: 'Production SQL',
    tags: ['Update', 'InspectionPlan', 'Status', 'Workflow'],
    sql: `UPDATE InspectionPlan
SET Status = 'InProgress',
    IsLocked = 0,
    LastModifiedDate = GETUTCDATE(),
    ModifiedBy = 'SupportEngineer'
WHERE ID = 76907
  AND Status = 'Pending';`,
  },
  {
    id: 'qb-insert-center-mapping',
    title: 'Insert New Center & GIS Plot Mapping',
    category: 'inspection_plots',
    description: 'Creates a new InspectionPlanCenter record linking GISID with proper audit metadata.',
    database: 'Production SQL',
    tags: ['Insert', 'Center', 'GISID', 'Mapping'],
    sql: `INSERT INTO InspectionPlanCenter (
    InspectionPlanId, 
    GISID, 
    CenterName, 
    IsActive, 
    CreatedDate
)
VALUES (
    76907, 
    'GIS-PLOT-88492', 
    'North Regional Inspection Unit', 
    1, 
    GETUTCDATE()
);`,
  },
  {
    id: 'qb-exec-sp-who2',
    title: 'Execute sp_who2 to Inspect Active DB Sessions',
    category: 'diagnostics_performance',
    description: 'Runs system stored procedure to diagnose active connections, CPU spikes, and disk I/O.',
    database: 'Master / SQL Admin',
    tags: ['Exec', 'SPID', 'Diagnostics', 'Performance'],
    sql: `EXEC sp_who2 'active';`,
  },
  {
    id: 'qb-duplicate-plots',
    title: 'Detect Duplicate GIS Plot Mappings',
    category: 'inspection_plots',
    description: 'Identifies duplicate GISIDs attached across multiple active inspection plans in the same cycle.',
    database: 'Production SQL',
    tags: ['GIS', 'Duplicates', 'Integrity', 'Plots'],
    sql: `SELECT 
    GISID, 
    COUNT(*) AS OccurrenceCount,
    STRING_AGG(InspectionPlanId, ', ') AS PlanIds
FROM InspectionPlanCenter WITH (NOLOCK)
WHERE GISID IS NOT NULL AND GISID <> ''
GROUP BY GISID
HAVING COUNT(*) > 1
ORDER BY OccurrenceCount DESC;`,
  },
  {
    id: 'qb-active-blocking-locks',
    title: 'Check Active Blocking Locks & Long Running Queries',
    category: 'diagnostics_performance',
    description: 'Finds currently blocked queries, wait types, and lead blocking spids in SQL Server.',
    database: 'Master / SQL Admin',
    tags: ['Performance', 'Locks', 'Blocking', 'SPID'],
    sql: `SELECT 
    r.session_id AS BlockedSessionId,
    r.blocking_session_id AS BlockingSessionId,
    r.wait_type,
    r.wait_time / 1000 AS WaitSeconds,
    t.text AS QueryText
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id <> 0;`,
  },
  {
    id: 'qb-user-access-roles',
    title: 'Inspect User Roles and Permissions by Email',
    category: 'users_auth',
    description: 'Fetches user profile, organization ID, security roles, and last login timestamp.',
    database: 'Auth DB',
    tags: ['Users', 'Auth', 'Roles', 'Security'],
    sql: `SELECT 
    u.Id AS UserId,
    u.Email,
    u.IsActive,
    u.LastLoginDate,
    r.RoleName
FROM Users u WITH (NOLOCK)
JOIN UserRoles ur WITH (NOLOCK) ON ur.UserId = u.Id
JOIN Roles r WITH (NOLOCK) ON r.Id = ur.RoleId
WHERE u.Email LIKE '%@example.com%';`,
  },
  {
    id: 'qb-table-rowcounts',
    title: 'Get Fast Approximate Row Counts for All Tables',
    category: 'diagnostics_performance',
    description: 'Queries partition metadata to instantly count millions of rows without locking tables.',
    database: 'Any SQL DB',
    tags: ['Diagnostics', 'RowCounts', 'Metadata'],
    sql: `SELECT 
    t.name AS TableName,
    p.rows AS TotalRows
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1)
ORDER BY p.rows DESC;`,
  },
  {
    id: 'qb-orphan-questions',
    title: 'Find Orphaned QuestionInspections',
    category: 'data_cleanup',
    description: 'Finds question inspection records pointing to non-existent center or plan records.',
    database: 'Production SQL',
    tags: ['Cleanup', 'Orphans', 'Integrity'],
    sql: `SELECT qi.ID, qi.InspectionPlanCenterId
FROM QuestionInspection qi WITH (NOLOCK)
WHERE NOT EXISTS (
    SELECT 1 FROM InspectionPlanCenter ipc WITH (NOLOCK)
    WHERE ipc.ID = qi.InspectionPlanCenterId
);`,
  },
  {
    id: 'qb-recent-audit-actions',
    title: 'Audit Log: Recent Admin & Support Modifications',
    category: 'audit_logs',
    description: 'Lists the last 100 audit events including record deletions and plan state transitions.',
    database: 'Audit DB',
    tags: ['Audit', 'Logs', 'History', 'Admin'],
    sql: `SELECT TOP 100 
    EventId,
    ActionType,
    EntityName,
    EntityId,
    PerformedBy,
    TimestampUtc
FROM AuditLog WITH (NOLOCK)
ORDER BY TimestampUtc DESC;`,
  },
];
