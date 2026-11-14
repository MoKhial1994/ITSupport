import { ActivityItem } from './types';

// Helper to generate today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-sample-1',
    date: getTodayDateString(),
    title: 'Morning Engineering & Support Standup',
    category: 'meeting',
    durationMinutes: 30,
    status: 'completed',
    collaborators: 'Support & Dev Team (Ahmed, Sarah)',
    notes: 'Covered blockers for release v8.2, agreed on daily critical ticket rotation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-sample-2',
    date: getTodayDateString(),
    title: 'Investigate SQL Timeout in Production Order Query',
    category: 'ticket',
    durationMinutes: 90,
    status: 'completed',
    ticketId: 'SUP-4921',
    collaborators: 'DBA Team',
    notes: 'Identified missing index on OrderStatusId & DateCreated. Applied index and verified execution time dropped from 14s to 220ms.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-sample-3',
    date: getTodayDateString(),
    title: 'Feature dev: Add custom prefix & suffix formatting',
    category: 'development',
    durationMinutes: 75,
    status: 'completed',
    ticketId: 'DEV-1088',
    notes: 'Implemented prefix and suffix wrapping logic to produce tuple outputs like (1),(2),(3) with full unit coverage.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-sample-4',
    date: getTodayDateString(),
    title: 'Helped junior colleague debug JWT claims authentication',
    category: 'helping',
    durationMinutes: 45,
    status: 'completed',
    collaborators: 'Omar K.',
    notes: 'Guided Omar through verifying expired exp claims and base64url padding discrepancy in signature validation.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-sample-5',
    date: getTodayDateString(),
    title: 'Consulted Lead Architect on database partition strategy',
    category: 'asking_help',
    durationMinutes: 30,
    status: 'completed',
    collaborators: 'Dr. Tariq (Lead Architect)',
    notes: 'Asked about best partition scheme for 50M+ plots table without interrupting live transactional lock.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-sample-6',
    date: getTodayDateString(),
    title: 'Quick phone alignment with Ops manager on SLA escalation',
    category: 'call',
    durationMinutes: 20,
    status: 'completed',
    collaborators: 'Mona (Ops Manager)',
    notes: 'Agreed on priority handling for customer VIP tickets and assigned standby engineer.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
