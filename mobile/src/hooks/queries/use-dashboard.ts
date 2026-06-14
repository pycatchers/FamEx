import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { DashboardData, SearchResponse } from '@/types/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardData>('/api/v1/dashboard'),
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiClient<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
