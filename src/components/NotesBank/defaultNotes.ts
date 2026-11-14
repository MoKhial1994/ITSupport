import { NoteItem } from './types';

export const DEFAULT_NOTES_BANK: NoteItem[] = [
  {
    id: 'note-gis-sync-err',
    title: 'GIS Sync Timeout & 504 Resolution Procedure',
    topic: 'GIS & Plots',
    color: 'amber',
    isPinned: true,
    tags: ['GIS', 'Timeout', 'Error504', 'Sync', 'SOP'],
    content: `When GIS map plots fail to sync with error HTTP 504 (Gateway Timeout):
1. Verify ArcGIS Enterprise feature server status on port 6443.
2. Check if InspectionPlanCenter has orphaned GISID records with empty coordinates.
3. Run diagnostic query:
   SELECT GISID, COUNT(*) FROM InspectionPlanCenter GROUP BY GISID HAVING COUNT(*) > 1;
4. If sync batch is > 500 plots, partition into chunks of 100 via GIS batch updater.
5. Notify GIS team on Slack #gis-ops if map service latency exceeds 8000ms.`,
    createdAt: '2026-08-20T08:30:00.000Z',
    updatedAt: '2026-08-25T14:15:00.000Z',
  },
  {
    id: 'note-db-read-replica',
    title: 'Production DB Read Replica & Bastion Details',
    topic: 'Database & SQL',
    color: 'sky',
    isPinned: true,
    tags: ['Database', 'Replica', 'Bastion', 'ReadOnly', 'IP'],
    content: `Always run analytical and heavy report queries against Read Replica:
- Server Name: sql-prod-readreplica.internal.net
- Port: 1433 (Default SQL Server)
- Database: InspectionDB_Mirror
- ApplicationIntent=ReadOnly in connection string.
- Max query timeout limit: 60 seconds (prevents replica lag).
- Bastion SSH Jump Host: bastion.support.internal:2222 (User: support-ops)`,
    createdAt: '2026-08-18T10:00:00.000Z',
    updatedAt: '2026-08-24T09:20:00.000Z',
  },
  {
    id: 'note-p1-escalation-bridge',
    title: 'P1 Incident Escalation & Bridge Protocol',
    topic: 'Tickets & Incidents',
    color: 'rose',
    isPinned: true,
    tags: ['P1', 'Incident', 'Bridge', 'SLA', 'Phone'],
    content: `Emergency Response for Sev-1 Outages (< 15 min SLA):
1. Open Incident Zoom Bridge: https://incident.internal/bridge-room-1
2. Page On-Call Database DBA: (555) 019-8831 (PagerDuty #dba-primary)
3. Page Infrastructure Lead: (555) 019-9942
4. Post initial incident broadcast message on #incidents-public within 15 minutes.
5. Update ticket status every 30 minutes until mitigation confirmed.`,
    createdAt: '2026-08-15T07:12:00.000Z',
    updatedAt: '2026-08-26T01:00:00.000Z',
  },
  {
    id: 'note-cascade-delete-checklist',
    title: 'Safe Cascade Delete Checklist for Corrupted Plans',
    topic: 'Database & SQL',
    color: 'emerald',
    isPinned: false,
    tags: ['SQL', 'Delete', 'Cascade', 'Checklist', 'Safety'],
    content: `Mandatory safety steps before executing any deletion script:
1. Always wrap script in BEGIN TRANSACTION and inspect @@ROWCOUNT.
2. Confirm InspectionPlan status is NOT in 'Approved' or 'Completed' state.
3. Backup table rows to temporary table:
   SELECT * INTO #Backup_QI_76907 FROM QuestionInspection WHERE InspectionPlanCenterId IN (...);
4. Execute child deletes first (QuestionInspection -> InspectionPlanCenter -> InspectionPlan).
5. Only execute COMMIT TRANSACTION after sanity check; otherwise ROLLBACK.`,
    createdAt: '2026-08-21T11:45:00.000Z',
    updatedAt: '2026-08-25T16:40:00.000Z',
  },
  {
    id: 'note-jwt-debugging-tip',
    title: 'JWT Auth Token Validation & Claims Tips',
    topic: 'Access & Auth',
    color: 'purple',
    isPinned: false,
    tags: ['JWT', 'Auth', 'Claims', 'Roles', 'Debugger'],
    content: `Key claims to check in JWT Token Deserializer:
- 'exp': Expiration epoch timestamp. If token expired, client app triggers 401 loop.
- 'role' / 'roles': Verify user has 'SupportEngineer' or 'FieldInspector'.
- 'org_id': Must match tenant organization.
- 'iss': https://auth.support-system.com/oauth/v2/
- If user claims missing permissions after role upgrade, client must refresh token.`,
    createdAt: '2026-08-22T13:10:00.000Z',
    updatedAt: '2026-08-23T11:05:00.000Z',
  },
  {
    id: 'note-customer-reply-template',
    title: 'Customer Communication Template: Missing Plots',
    topic: 'Tickets & Incidents',
    color: 'indigo',
    isPinned: false,
    tags: ['Customer', 'Template', 'Email', 'Communication'],
    content: `Template response for tickets reporting missing GIS plots on mobile app:

"Hello [Customer Name],

Thank you for contacting Technical Support. We have investigated the synchronization for Plan #[PlanID] and identified that GIS Plot [PlotNumber] was queued for geometry validation.

Our team has re-indexed the spatial coordinates in the central registry. Please have the field inspector swipe down to refresh the mobile app sync queue while connected to Wi-Fi.

Please let us know if you observe any further discrepancies."`,
    createdAt: '2026-08-19T15:20:00.000Z',
    updatedAt: '2026-08-24T18:30:00.000Z',
  },
  {
    id: 'note-hotfix-deploy-steps',
    title: 'Hotfix Deployment & Cache Invalidation Steps',
    topic: 'Deployment & Hotfix',
    color: 'slate',
    isPinned: false,
    tags: ['Deploy', 'Hotfix', 'Redis', 'Cache', 'CDN'],
    content: `Post-Deployment Verification:
1. Check health check endpoint: /api/health (HTTP 200 required).
2. Purge Redis inspection plan cache for modified tenants:
   redis-cli -h cache-prod EVAL "return redis.call('del', unpack(redis.call('keys', 'plan:cache:*')))" 0
3. Invalidate Cloudflare edge CDN cache for /static/app-bundle.js.
4. Monitor Error Spikes in Sentry / App Insights for 15 minutes.`,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-25T10:00:00.000Z',
  },
];
