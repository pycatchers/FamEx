import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Document, DocumentCreate, DocumentUpdate } from '@/types/documents';

export function useDocuments(familyMemberId?: string, documentType?: string) {
  const params = new URLSearchParams();
  if (familyMemberId) params.set('family_member_id', familyMemberId);
  if (documentType) params.set('document_type', documentType);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery({
    queryKey: ['documents', { familyMemberId, documentType }],
    queryFn: () => apiClient<Document[]>(`/api/v1/documents${query}`),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => apiClient<Document>(`/api/v1/documents/${id}`),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentCreate) =>
      apiClient<Document>('/api/v1/documents', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentUpdate) =>
      apiClient<Document>(`/api/v1/documents/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
