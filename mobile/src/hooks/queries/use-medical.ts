import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Hospital, HospitalCreate, Doctor, DoctorCreate, Prescription, PrescriptionCreate, ActiveMedicine } from '@/types/medical';

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

// Doctors
export function useDoctors(hospitalId?: string) {
  const params = hospitalId ? `?hospital_id=${hospitalId}` : '';
  return useQuery({
    queryKey: ['doctors', { hospitalId }],
    queryFn: () => apiClient<Doctor[]>(`/api/v1/medical/doctors${params}`),
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

// Active Medicines
export function useActiveMedicines() {
  return useQuery({
    queryKey: ['active-medicines'],
    queryFn: () => apiClient<ActiveMedicine[]>('/api/v1/medical/medicines/active'),
  });
}
