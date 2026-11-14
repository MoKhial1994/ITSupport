export type NoteColor =
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'rose'
  | 'purple'
  | 'indigo'
  | 'slate';

export interface NoteColorConfig {
  name: string;
  dotColor: string;
  bgDark: string;
  bgLight: string;
  borderDark: string;
  borderLight: string;
  accentText: string;
  badgeBg: string;
}

export const NOTE_COLOR_CONFIGS: Record<NoteColor, NoteColorConfig> = {
  amber: {
    name: 'Amber',
    dotColor: '#F59E0B',
    bgDark: 'rgba(245, 158, 11, 0.08)',
    bgLight: 'rgba(245, 158, 11, 0.12)',
    borderDark: '#B45309',
    borderLight: '#FCD34D',
    accentText: '#FBBF24',
    badgeBg: 'rgba(245, 158, 11, 0.18)',
  },
  emerald: {
    name: 'Emerald',
    dotColor: '#10B981',
    bgDark: 'rgba(16, 185, 129, 0.08)',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    borderDark: '#047857',
    borderLight: '#6EE7B7',
    accentText: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
  },
  sky: {
    name: 'Sky Blue',
    dotColor: '#0EA5E9',
    bgDark: 'rgba(14, 165, 233, 0.08)',
    bgLight: 'rgba(14, 165, 233, 0.12)',
    borderDark: '#0369A1',
    borderLight: '#7DD3FC',
    accentText: '#38BDF8',
    badgeBg: 'rgba(14, 165, 233, 0.18)',
  },
  rose: {
    name: 'Rose',
    dotColor: '#F43F5E',
    bgDark: 'rgba(244, 63, 94, 0.08)',
    bgLight: 'rgba(244, 63, 94, 0.12)',
    borderDark: '#BE123C',
    borderLight: '#FDA4AF',
    accentText: '#FB7185',
    badgeBg: 'rgba(244, 63, 94, 0.18)',
  },
  purple: {
    name: 'Purple',
    dotColor: '#A855F7',
    bgDark: 'rgba(168, 85, 247, 0.08)',
    bgLight: 'rgba(168, 85, 247, 0.12)',
    borderDark: '#7E22CE',
    borderLight: '#D8B4FE',
    accentText: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.18)',
  },
  indigo: {
    name: 'Indigo',
    dotColor: '#6366F1',
    bgDark: 'rgba(99, 102, 241, 0.08)',
    bgLight: 'rgba(99, 102, 241, 0.12)',
    borderDark: '#4338CA',
    borderLight: '#A5B4FC',
    accentText: '#818CF8',
    badgeBg: 'rgba(99, 102, 241, 0.18)',
  },
  slate: {
    name: 'Slate',
    dotColor: '#94A3B8',
    bgDark: 'rgba(148, 163, 184, 0.08)',
    bgLight: 'rgba(148, 163, 184, 0.12)',
    borderDark: '#475569',
    borderLight: '#CBD5E1',
    accentText: '#94A3B8',
    badgeBg: 'rgba(148, 163, 184, 0.18)',
  },
};

export const DEFAULT_TOPICS = [
  'Database & SQL',
  'Tickets & Incidents',
  'GIS & Plots',
  'Access & Auth',
  'Deployment & Hotfix',
  'Workarounds & Tips',
  'Personal Scratchpad',
];

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  topic: string;
  color: NoteColor;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
