import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Hospital, HospitalCreate, HospitalDetail, Doctor, DoctorCreate, DoctorDetail, Prescription, PrescriptionCreate, ActiveMedicine, VisitSummary } from '@/types/medical';

// Visits (Medical tab main list)
export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: () => apiClient<VisitSummary[]>('/api/v1/medical/visits'),
  });
}

// Hospitals
export function useHospitals() {
  return useQuery({
    queryKey: ['hospitals'],
    queryFn: () => apiClient<Hospital[]>('/api/v1/medical/hospitals'),
  });
}

export function useCreateHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HospitalCreate) =>
      apiClient<Hospital>('/api/v1/medical/hospitals', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
}

export function useDeleteHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/medical/hospitals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
}

// Hospital Details (with visit stats)
export function useHospitalDetails() {
  return useQuery({
    queryKey: ['hospitals', 'details'],
    queryFn: () => apiClient<HospitalDetail[]>('/api/v1/medical/hospitals/details'),
  });
}

// Doctors
export function useDoctors(hospitalId?: string) {
  const params = hospitalId ? `?hospital_id=${hospitalId}` : '';
  return useQuery({
    queryKey: ['doctors', { hospitalId }],
    queryFn: () => apiClient<Doctor[]>(`/api/v1/medical/doctors${params}`),
  });
}

// Doctor Details (with visit stats)
export function useDoctorDetails(hospitalId?: string) {
  const params = hospitalId ? `?hospital_id=${hospitalId}` : '';
  return useQuery({
    queryKey: ['doctors', 'details', { hospitalId }],
    queryFn: () => apiClient<DoctorDetail[]>(`/api/v1/medical/doctors/details${params}`),
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DoctorCreate) =>
      apiClient<Doctor>('/api/v1/medical/doctors', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/medical/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    },
  });
}

// Prescriptions
export function usePrescriptions(familyMemberId?: string) {
  const params = familyMemberId ? `?family_member_id=${familyMemberId}` : '';
  return useQuery({
    queryKey: ['prescriptions', { familyMemberId }],
    queryFn: () => apiClient<Prescription[]>(`/api/v1/medical/prescriptions${params}`),
  });
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => apiClient<Prescription>(`/api/v1/medical/prescriptions/${id}`),
    enabled: !!id,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionCreate) =>
      apiClient<Prescription>('/api/v1/medical/prescriptions', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['active-medicines'] });
    },
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/medical/prescriptions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['active-medicines'] });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prescriptionId: string) =>
      apiClient(`/api/v1/medical/prescriptions/${prescriptionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['active-medicines'] });
    },
  });
}

// Active Medicines
export function useActiveMedicines() {
  return useQuery({
    queryKey: ['active-medicines'],
    queryFn: () => apiClient<ActiveMedicine[]>('/api/v1/medical/medicines/active'),
  });
}
