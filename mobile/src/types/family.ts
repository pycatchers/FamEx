export interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  blood_group: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberCreate {
  full_name: string;
  relationship: string;
  date_of_birth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  photo_url?: string | null;
  blood_group?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  notes?: string | null;
}

export type FamilyMemberUpdate = Partial<FamilyMemberCreate>;
