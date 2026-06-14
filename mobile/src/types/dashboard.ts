export interface UpcomingEMI {
  loan_id: string;
  lender_name: string;
  amount: number;
  due_date: string;
  status: string;
}

export interface UpcomingInsurance {
  policy_id: string;
  provider_name: string;
  policy_type: string;
  premium_amount: number;
  next_premium_date: string;
}

export interface UpcomingFollowUp {
  prescription_id: string;
  diagnosis: string | null;
  doctor_name: string | null;
  follow_up_date: string;
}

export interface RecentDocument {
  id: string;
  document_type: string;
  document_number: string | null;
  created_at: string;
}

export interface DashboardData {
  upcoming_emis: UpcomingEMI[];
  upcoming_insurance: UpcomingInsurance[];
  upcoming_follow_ups: UpcomingFollowUp[];
  recent_documents: RecentDocument[];
  monthly_spending: { total: number; bill_count: number };
  active_medicines_count: number;
  family_members_count: number;
  active_loans_count: number;
}

export interface SearchResult {
  module: string;
  id: string;
  title: string;
  subtitle: string | null;
  match_field: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}
