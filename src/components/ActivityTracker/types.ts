export type ActivityCategory =
  | 'ticket'       // Solving tickets
  | 'meeting'      // Meetings
  | 'development'  // Development / Coding
  | 'call'         // Normal calls
  | 'helping'      // Helping others
  | 'asking_help'  // Asking for help
  | 'review'       // Code review / QA
  | 'other';       // Miscellaneous

export type ActivityStatus = 'completed' | 'in_progress' | 'blocked' | 'planned';

export interface ActivityItem {
  id: string;
  date: string;           // YYYY-MM-DD
  title: string;
  category: ActivityCategory;
  durationMinutes: number; // in minutes (e.g., 30, 60)
  status: ActivityStatus;
  ticketId?: string;      // e.g. "INC-8291" or "SUP-102"
  collaborators?: string; // Who was involved / helping / asked
  notes?: string;         // Details, key takeaways, outcomes
  link?: string;          // PR link, meeting link, ticket link
  createdAt: string;      // ISO string
  updatedAt: string;      // ISO string
}

export interface ActivityCategoryConfig {
  label: string;
  description: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, ActivityCategoryConfig> = {
  ticket: {
    label: 'Ticket Solving',
    description: 'Investigating, debugging and resolving support or bug tickets',
    colorBg: 'bg-emerald-500/10',
    colorText: 'text-emerald-400',
    colorBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    iconName: 'Ticket',
  },
  meeting: {
    label: 'Meeting',
    description: 'Team standup, sprint sync, client or retrospective meeting',
    colorBg: 'bg-blue-500/10',
    colorText: 'text-blue-400',
    colorBorder: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    iconName: 'Users',
  },
  development: {
    label: 'Development',
    description: 'Writing code, features, refactoring, tests, migrations',
    colorBg: 'bg-cyan-500/10',
    colorText: 'text-cyan-400',
    colorBorder: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    iconName: 'Code',
  },
  call: {
    label: 'Normal Call',
    description: 'Quick 1-on-1 call, check-in, phone call or discussion',
    colorBg: 'bg-purple-500/10',
    colorText: 'text-purple-400',
    colorBorder: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    iconName: 'PhoneCall',
  },
  helping: {
    label: 'Helping Others',
    description: 'Assisting a coworker, unblocking team member, mentoring',
    colorBg: 'bg-amber-500/10',
    colorText: 'text-amber-400',
    colorBorder: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    iconName: 'HeartHandshake',
  },
  asking_help: {
    label: 'Asking for Help',
    description: 'Reached out to seniors, leads, or colleagues for assistance',
    colorBg: 'bg-rose-500/10',
    colorText: 'text-rose-400',
    colorBorder: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    iconName: 'HelpCircle',
  },
  review: {
    label: 'Code / Ticket Review',
    description: 'Reviewing PRs, verifying ticket resolutions, QA check',
    colorBg: 'bg-indigo-500/10',
    colorText: 'text-indigo-400',
    colorBorder: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    iconName: 'CheckSquare',
  },
  other: {
    label: 'Other Activity',
    description: 'Documentation, administration, inbox zero, learning',
    colorBg: 'bg-slate-500/10',
    colorText: 'text-slate-400',
    colorBorder: 'border-slate-500/30',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    iconName: 'Layers',
  },
};
