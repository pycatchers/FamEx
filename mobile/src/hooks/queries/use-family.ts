import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { FamilyMember, FamilyMemberCreate, FamilyMemberUpdate } from '@/types/family';

export function useFamilyMembers() {
  return useQuery({
    queryKey: ['family-members'],
    queryFn: () => apiClient<FamilyMember[]>('/api/v1/family'),
  });
}

export function useFamilyMember(id: string) {
  return useQuery({
    queryKey: ['family-members', id],
    queryFn: () => apiClient<FamilyMember>(`/api/v1/family/${id}`),
    enabled: !!id,
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyMemberCreate) =>
      apiClient<FamilyMember>('/api/v1/family', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

export function useUpdateFamilyMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FamilyMemberUpdate) =>
      apiClient<FamilyMember>(`/api/v1/family/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      queryClient.invalidateQueries({ queryKey: ['family-members', id] });
    },
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/family/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}
