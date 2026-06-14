export interface InsurancePolicy {
  id: string;
  user_id: string;
  family_member_id: string | null;
  policy_type: string;
  provider_name: string;
  policy_number: string;
  sum_insured: number | null;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  end_date: string;
  next_premium_date: string | null;
  nominee_name: string | null;
  nominee_relation: string | null;
  vehicle_number: string | null;
  vehicle_make_model: string | null;
  agent_name: string | null;
  agent_phone: string | null;
  document_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsuranceCreate {
  family_member_id?: string | null;
  policy_type: string;
  provider_name: string;
  policy_number: string;
  sum_insured?: number | null;
  premium_amount: number;
  premium_frequency: string;
  start_date: string;
  end_date: string;
  next_premium_date?: string | null;
  nominee_name?: string | null;
  nominee_relation?: string | null;
  vehicle_number?: string | null;
  vehicle_make_model?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  document_url?: string | null;
  status?: string;
  notes?: string | null;
}

export type InsuranceUpdate = Partial<InsuranceCreate>;

export const POLICY_TYPES = [
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'vehicle', label: 'Vehicle Insurance' },
  { value: 'home', label: 'Home Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'personal_accident', label: 'Personal Accident' },
  { value: 'other', label: 'Other' },
] as const;

export const PREMIUM_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half Yearly' },
  { value: 'yearly', label: 'Yearly' },
] as const;
