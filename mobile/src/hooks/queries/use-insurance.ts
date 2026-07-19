import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { InsurancePolicy, InsuranceCreate, InsuranceUpdate, PremiumPayment } from '@/types/insurance';

export function useInsurancePolicies(policyType?: string) {
  const params = policyType ? `?policy_type=${policyType}` : '';
  return useQuery({
    queryKey: ['insurance', { policyType }],
    queryFn: () => apiClient<InsurancePolicy[]>(`/api/v1/insurance${params}`),
  });
}

export function useInsurancePolicy(id: string) {
  return useQuery({
    queryKey: ['insurance', id],
    queryFn: () => apiClient<InsurancePolicy>(`/api/v1/insurance/${id}`),
    enabled: !!id,
  });
}

export function useCreateInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsuranceCreate) =>
      apiClient<InsurancePolicy>('/api/v1/insurance', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useUpdateInsurance(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsuranceUpdate) =>
      apiClient<InsurancePolicy>(`/api/v1/insurance/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useDeleteInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/insurance/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function usePremiumPayments(policyId: string) {
  return useQuery({
    queryKey: ['insurance', policyId, 'premiums'],
    queryFn: () => apiClient<PremiumPayment[]>(`/api/v1/insurance/${policyId}/premiums`),
    enabled: !!policyId,
  });
}

export function useUpdatePremium(policyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ premiumId, data }: { premiumId: string; data: { status?: string; paid_date?: string } }) =>
      apiClient<PremiumPayment>(`/api/v1/insurance/${policyId}/premiums/${premiumId}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance', policyId, 'premiums'] });
    },
  });
}
