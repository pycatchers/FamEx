export interface Hospital {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HospitalCreate {
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

export interface Doctor {
  id: string;
  user_id: string;
  hospital_id: string | null;
  name: string;
  specialization: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorCreate {
  hospital_id?: string | null;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface Medicine {
  id: string;
  prescription_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  timing: string | null;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MedicineCreate {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration_days?: number | null;
  timing?: string | null;
  morning?: boolean;
  afternoon?: boolean;
  night?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
}

export interface Prescription {
  id: string;
  user_id: string;
  family_member_id: string | null;
  doctor_id: string | null;
  hospital_id: string | null;
  prescription_date: string;
  diagnosis: string | null;
  image_url: string | null;
  follow_up_date: string | null;
  notes: string | null;
  medicines: Medicine[];
  created_at: string;
  updated_at: string;
}

export interface PrescriptionCreate {
  family_member_id?: string | null;
  doctor_id?: string | null;
  hospital_id?: string | null;
  prescription_date: string;
  diagnosis?: string | null;
  image_url?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  medicines: MedicineCreate[];
}

export interface ActiveMedicine {
  id: string;
  prescription_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  start_date: string | null;
  end_date: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
}

export const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'ENT',
  'Gynecologist', 'Neurologist', 'Ophthalmologist', 'Orthopedic',
  'Pediatrician', 'Psychiatrist', 'Pulmonologist', 'Urologist', 'Other',
] as const;

export const TIMINGS = [
  { value: 'before_food', label: 'Before Food' },
  { value: 'after_food', label: 'After Food' },
  { value: 'with_food', label: 'With Food' },
] as const;
