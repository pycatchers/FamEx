import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Loan, LoanCreate, LoanUpdate, EMIPayment } from '@/types/loans';

export function useLoans(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['loans', { status }],
    queryFn: () => apiClient<Loan[]>(`/api/v1/loans${params}`),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => apiClient<Loan>(`/api/v1/loans/${id}`),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoanCreate) =>
      apiClient<Loan>('/api/v1/loans', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

export function useUpdateLoan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoanUpdate) =>
      apiClient<Loan>(`/api/v1/loans/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/loans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}

export function useEMIPayments(loanId: string) {
  return useQuery({
    queryKey: ['loans', loanId, 'emis'],
    queryFn: () => apiClient<EMIPayment[]>(`/api/v1/loans/${loanId}/emis`),
    enabled: !!loanId,
  });
}

export function useUpdateEMI(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ emiId, data }: { emiId: string; data: { status?: string; paid_date?: string } }) =>
      apiClient<EMIPayment>(`/api/v1/loans/${loanId}/emis/${emiId}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans', loanId, 'emis'] });
    },
  });
}
