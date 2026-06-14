export interface Loan {
  id: string;
  user_id: string;
  family_member_id: string | null;
  loan_type: string;
  lender_name: string;
  loan_account_number: string | null;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  end_date: string;
  emi_day_of_month: number | null;
  outstanding_amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanCreate {
  family_member_id?: string | null;
  loan_type: string;
  lender_name: string;
  loan_account_number?: string | null;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  end_date: string;
  emi_day_of_month?: number | null;
  outstanding_amount?: number | null;
  status?: string;
  notes?: string | null;
}

export type LoanUpdate = Partial<LoanCreate>;

export interface EMIPayment {
  id: string;
  loan_id: string;
  due_date: string;
  paid_date: string | null;
  amount: number;
  principal_component: number | null;
  interest_component: number | null;
  status: string;
  receipt_url: string | null;
  created_at: string;
}

export const LOAN_TYPES = [
  { value: 'home', label: 'Home Loan' },
  { value: 'vehicle', label: 'Vehicle Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'education', label: 'Education Loan' },
  { value: 'gold', label: 'Gold Loan' },
  { value: 'business', label: 'Business Loan' },
  { value: 'other', label: 'Other' },
] as const;
