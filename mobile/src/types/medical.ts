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
  qualification: string | null;
  specialization: string | null;
  phone: string | null;
  registration_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorCreate {
  hospital_id?: string | null;
  name: string;
  specialization?: string | null;
  phone?: string | null;
  registration_id?: string | null;
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
  reason_for_visit: string | null;
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
  reason_for_visit?: string | null;
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

export interface HospitalDetail extends Hospital {
  last_visit_date: string | null;
  visit_count: number;
  doctors: Doctor[];
}

export interface VisitSummary {
  prescription_id: string;
  hospital_id: string | null;
  hospital_name: string | null;
  hospital_address: string | null;
  hospital_phone: string | null;
  visit_date: string;
  patient_name: string | null;
  reason_for_visit: string | null;
  diagnosis: string | null;
  doctor_name: string | null;
  doctor_qualification: string | null;
  doctor_registration_id: string | null;
  medicines: Medicine[];
}

export interface DoctorDetail extends Doctor {
  last_visit_date: string | null;
  visit_count: number;
}

// OCR extraction result (before saving)
export interface OCRMedicine {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  timing: string | null;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface OCRPrescriptionResult {
  doctor_name: string | null;
  doctor_qualification: string | null;
  doctor_registration_id: string | null;
  hospital_name: string | null;
  hospital_address: string | null;
  hospital_phone: string | null;
  visit_date: string | null;
  diagnosis: string | null;
  reason_for_visit: string | null;
  medicines: OCRMedicine[];
  follow_up_date: string | null;
  raw_text: string | null;
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
