
export enum LeadStatus {
  LEAD = 'lead',
  DEAL = 'deal',
  CLIENT = 'client'
}

export enum LeadTemperature {
  COLD = 'Cold',
  WARM = 'Warm',
  HOT = 'Hot',
  SPAM = 'Spam',
  NOT_INTERESTED = 'Not Interested'
}

export enum LeadSource {
  WEBSITE = 'Website',
  ADS = 'Ads',
  COLD_OUTREACH = 'Cold Outreach',
  REFERRAL = 'Referral'
}

export enum ServiceType {
  // Subscription Services (Recurring)
  FULL_REVENUE_SYSTEM = 'Full Revenue System',
  ADS_MANAGEMENT = 'Ads Management',
  AI_CALLERS = 'AI Callers',
  // One-time Services
  AI_AUDIT = 'AI Audit',
  CUSTOM_CRM = 'Custom CRM',
  COMPANY_WEBSITE = 'Company Website'
}

export enum ExpenseCategory {
  ADS = 'Ads',
  SOFTWARE = 'Software',
  EMPLOYEES = 'Employees\' Fee',
  OTHERS = 'Others'
}

export type TransactionType = 'expense' | 'revenue';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: any;
  period: string; // YYYY-MM
  type: TransactionType;
  createdBy: string;
  createdAt: any;
}

export type View = 'dashboard' | 'leads' | 'deals' | 'clients' | 'financials' | 'settings' | 'database' | 'team';

export type Theme = 'light' | 'dark' | 'system';

export interface ContactField {
  label: string;
  value: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  website?: string;
  industry?: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  temperature?: LeadTemperature;
  service: ServiceType;
  assignedTo: string;
  notes: string; // Used for AI analysis
  internalNotes?: string; // General purpose operations notes
  dealValue: number;
  contacts?: ContactField[];
  aiScore?: number;
  aiInsight?: string;
  aiSources?: { title: string; uri: string }[];
  createdAt: any;
  updatedAt?: any;
  lastPaymentDate?: any; // Tracks the last time a subscription was paid
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: any;
}

export interface UserProfile {
  uid: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Setter';
  email: string;
  position?: string;
  createdAt?: any;
}

export interface AgencySettings {
  agencyName: string;
  currency: string;
  monthlyGoal: number;
  yearlyGoal: number;
}

export interface FinancialSnapshot {
  id: string;
  type: 'month' | 'year';
  period: string; // e.g., "2024-05" or "2024"
  revenue: number;
  expenses: number;
  profit: number;
  updatedAt: any;
}
