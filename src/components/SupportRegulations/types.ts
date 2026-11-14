export type RegulationCategory =
  | 'ticket_creation'
  | 'incident_escalation'
  | 'database_safety'
  | 'troubleshooting'
  | 'security_access'
  | 'customer_communication'
  | 'general';

export type RegulationPriority = 'critical' | 'high' | 'medium' | 'standard';

export interface RegulationItem {
  id: string;
  title: string;
  category: RegulationCategory;
  priority: RegulationPriority;
  summary: string;
  description: string;
  steps: string[];
  templateText?: string;
  tags: string[];
  lastUpdated: string;
  department?: string;
}
