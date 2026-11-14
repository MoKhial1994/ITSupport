import { RegulationItem } from './types';

export const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ticket_creation: { label: 'Ticket Creation SOP', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  incident_escalation: { label: 'Incident & Escalation', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' },
  database_safety: { label: 'Database & Data Safety', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  troubleshooting: { label: 'Troubleshooting Guides', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
  security_access: { label: 'Security & Access Control', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  customer_communication: { label: 'Communication & SLAs', color: '#FB7185', bg: 'rgba(251, 113, 133, 0.15)' },
  general: { label: 'General Policy', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
};

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical / Mandatory', color: '#EF4444', bg: 'bg-red-950/40 text-red-400 border-red-800/60' },
  high: { label: 'High Priority', color: '#F59E0B', bg: 'bg-amber-950/40 text-amber-400 border-amber-800/60' },
  medium: { label: 'Medium', color: '#3B82F6', bg: 'bg-blue-950/40 text-blue-400 border-blue-800/60' },
  standard: { label: 'Standard SOP', color: '#10B981', bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' },
};

export const DEFAULT_REGULATIONS: RegulationItem[] = [
  {
    id: 'sop-ticket-standard',
    title: 'Standard Support Ticket Creation Guidelines',
    category: 'ticket_creation',
    priority: 'critical',
    summary: 'Mandatory fields, format, and diagnostic information required before logging or escalating any customer ticket.',
    description:
      'Every support agent must adhere to this structured format when logging tickets. Vague descriptions or missing system identifiers cause delayed resolutions and redundant back-and-forth.',
    steps: [
      '1. Explicit Subject Line: Use [Module/System] - [Brief Summary of Issue] (e.g., "[Inspection] - Unable to sync GIS Plot #88492").',
      '2. Required System Identifiers: Always capture InspectionPlanId, CenterId, PlotId, GISID, or User Account ID.',
      '3. Step-by-Step Reproduction: Document exact user steps taken (1. Navigated to X, 2. Clicked Y, 3. Observed error Z).',
      '4. Actual vs Expected Behavior: State what occurred vs what should have occurred.',
      '5. Evidence & Telemetry: Attach screenshots, browser console logs (F12), SQL error messages, and network payloads.',
      '6. Environment & Scope: Specify Environment (Production / Staging), Browser/OS, and whether issue affects single or all users.',
    ],
    templateText: `[TICKET TEMPLATE]
System/Module: 
Impact Level: [P1 - Critical / P2 - High / P3 - Normal / P4 - Low]
Affected User(s): 
InspectionPlanId(s): 
PlotId / GISID: 

Summary:
[Brief description of the problem]

Steps to Reproduce:
1. Navigate to ...
2. Select ...
3. Click on ...

Expected Behavior:
[What should happen]

Actual Behavior & Error Message:
[What actually happened + exact error text]

Console/Log Attachments:
[Paste logs or attach screenshots]`,
    tags: ['Ticket Creation', 'Mandatory', 'SOP', 'Template'],
    lastUpdated: '2026-08-18',
    department: 'Support & Operations',
  },
  {
    id: 'sop-incident-escalation',
    title: 'Critical Incident (P1/P2) Escalation Procedure',
    category: 'incident_escalation',
    priority: 'critical',
    summary: 'Immediate action path, on-call paging, customer notification intervals, and war room protocols for major outages.',
    description:
      'P1 Incidents represent complete system unavailability or core database lockups impacting multiple production customers.',
    steps: [
      '1. Immediate Paging: Trigger the on-call Engineering Lead via primary Slack/Teams alert channel within 5 minutes.',
      '2. War Room Activation: Open a bridge call and invite Support Lead, DevOps on-call, and Core Dev.',
      '3. Customer Comms Cadence: Post an initial status advisory within 15 minutes; follow up every 30 minutes until resolution.',
      '4. Blocker Triage: Do not run speculative database update/delete scripts without senior approval.',
      '5. Post-Mortem Requirement: A formal Root Cause Analysis (RCA) must be published within 24 hours of incident closure.',
    ],
    templateText: `[INCIDENT ESCALATION ADVISORY]
Incident ID: INC-
Severity: P1 - Critical
Time Detected: ${new Date().toISOString()}
Affected Services: 
User Impact Scope: 
Current Lead Engineer: 
Bridge Link: 
Next Update Expected: In 30 minutes`,
    tags: ['Incident', 'Escalation', 'P1', 'Outage', 'On-Call'],
    lastUpdated: '2026-08-15',
    department: 'Incident Response Team',
  },
  {
    id: 'sop-db-deletion-safety',
    title: 'Database Data Deletion & Script Execution Safety Regulation',
    category: 'database_safety',
    priority: 'critical',
    summary: 'Strict zero-tolerance safety rules for executing SQL Delete/Update scripts on live databases.',
    description:
      'Running manual SQL modifications or plot deletions poses high risk of cascading data loss. All support engineers must follow these safeguards.',
    steps: [
      '1. Verify Target IDs: Double-check all InspectionPlanIds, PlotIds, and GISIDs with the customer ticket prior to execution.',
      '2. Always Run SELECT First: Execute SELECT count(*) or review the exact rows to be affected before issuing DELETE statements.',
      '3. Transaction Wrapping: Always wrap manual scripts in a BEGIN TRAN ... ROLLBACK / COMMIT block with rowcount verification.',
      '4. Pre-Execution Backup: Confirm recent automated database backup snapshot exists before running multi-table deletions.',
      '5. Audit Logging: Save the executed SQL script and output rowcount logs directly inside the customer ticket for auditability.',
    ],
    templateText: `-- SAFE SQL EXECUTION TEMPLATE
BEGIN TRANSACTION;

-- 1. Check affected rows first
SELECT COUNT(*) AS TargetCount 
FROM QuestionInspection 
WHERE InspectionPlanCenterId IN (
    SELECT ID FROM InspectionPlanCenter WHERE InspectionPlanId = [ID]
);

-- 2. Execute deletion safely
-- DELETE ...

-- 3. Verify before commit
-- ROLLBACK TRANSACTION; -- Run if counts mismatch
-- COMMIT TRANSACTION;   -- Run only after verified!`,
    tags: ['Database', 'SQL', 'Safety', 'Delete Plots', 'Compliance'],
    lastUpdated: '2026-08-10',
    department: 'Database & Infra Team',
  },
  {
    id: 'sop-plot-gis-troubleshooting',
    title: 'Plot & GIS ID Desynchronization Troubleshooting SOP',
    category: 'troubleshooting',
    priority: 'high',
    summary: 'Standard diagnostic steps when plots fail to render, center IDs disconnect, or GIS coordinates conflict.',
    description:
      'Common symptoms include blank inspection maps, error 404 on plot coordinate lookups, and duplicate center entries.',
    steps: [
      '1. Check Inspection Plan Status: Ensure the plan is not in "Archived" or "Locked" state.',
      '2. Validate Center Mapping: Verify InspectionPlanCenter contains valid center records linked to the InspectionPlanId.',
      '3. Check QuestionInspection IDs: Ensure plot IDs referenced in QuestionInspection map to active records.',
      '4. Delimiter Check: When querying multiple IDs in SQL, utilize the SupportToolkit List Formatter to single-quote values.',
      '5. Generate Clean Delete Script: If records are corrupted beyond repair, use the Delete Plots Generator to produce clean cascade scripts.',
    ],
    tags: ['GIS', 'Plots', 'Inspection', 'Troubleshooting'],
    lastUpdated: '2026-08-05',
    department: 'Tier 2 Technical Support',
  },
  {
    id: 'sop-security-access-request',
    title: 'User Privilege Escalation & Access Control Policy',
    category: 'security_access',
    priority: 'high',
    summary: 'Verification protocols before resetting user passwords, changing roles, or granting administrative permissions.',
    description:
      'Protects customer environments against social engineering and unauthorized account takeovers.',
    steps: [
      '1. Authorized Requestor Verification: Verify request originates from an authorized Organization Admin on file.',
      '2. Manager Approval: Role elevation to "Admin" requires written approval from the designated department head.',
      '3. Never Send Passwords in Plaintext: Utilize temporary secure one-time reset links only.',
      '4. Audit Ticket Attachment: Keep approval emails or sign-offs attached to the support ticket indefinitely.',
    ],
    tags: ['Security', 'Access Control', 'Authentication', 'Audit'],
    lastUpdated: '2026-07-28',
    department: 'Security & Compliance',
  },
  {
    id: 'sop-sla-communication',
    title: 'SLA Response Times & Customer Communication Standards',
    category: 'customer_communication',
    priority: 'standard',
    summary: 'Guidelines on response times, professional empathy, status updates, and closing confirmations.',
    description:
      'Provides clarity on customer-facing communication standards and resolution SLA expectations.',
    steps: [
      '1. First Response SLAs: P1 (15 min), P2 (1 hour), P3 (4 hours), P4 (8 hours).',
      '2. Professional Tone: Acknowledge user inconvenience with empathy and maintain proactive, transparent updates.',
      '3. Jargon Translation: Avoid internal developer jargon; explain causes and resolutions in user-accessible terminology.',
      '4. Resolution Confirmation: Never close a ticket without explicit confirmation from the user that the issue is resolved.',
    ],
    tags: ['SLA', 'Communication', 'Customer Service', 'Best Practices'],
    lastUpdated: '2026-07-20',
    department: 'Customer Success',
  },
];
