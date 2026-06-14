export interface Document {
  id: string;
  user_id: string;
  family_member_id: string | null;
  document_type: string;
  document_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  family_member_id?: string | null;
  document_type: string;
  document_number?: string | null;
  issuing_authority?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file_url?: string | null;
  thumbnail_url?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

export type DocumentUpdate = Partial<DocumentCreate>;

export const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'community_certificate', label: 'Community Certificate' },
  { value: 'school_certificate', label: 'School Certificate' },
  { value: 'college_certificate', label: 'College Certificate' },
  { value: 'marriage_certificate', label: 'Marriage Certificate' },
  { value: 'property_document', label: 'Property Document' },
  { value: 'abha_card', label: 'ABHA Card' },
  { value: 'other', label: 'Other' },
] as const;
