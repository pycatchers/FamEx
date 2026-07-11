import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Shop, ShopCreate, RecentShop, ShoppingBill, BillCreate, BillUpdate, ShoppingChecklist, ShoppingAnalytics, ItemPriceComparison } from '@/types/shopping';

// Recent Shops (main Shopping tab)
export function useRecentShops() {
  return useQuery({
    queryKey: ['shops', 'recent'],
    queryFn: () => apiClient<RecentShop[]>('/api/v1/shopping/shops/recent'),
  });
}

// Shops
export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn: () => apiClient<Shop[]>('/api/v1/shopping/shops'),
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShopCreate) =>
      apiClient<Shop>('/api/v1/shopping/shops', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}

export function useDeleteShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/shopping/shops/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}

// Bills
export function useBills(shopId?: string) {
  const params = shopId ? `?shop_id=${shopId}` : '';
  return useQuery({
    queryKey: ['bills', { shopId }],
    queryFn: () => apiClient<ShoppingBill[]>(`/api/v1/shopping/bills${params}`),
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ['bills', id],
    queryFn: () => apiClient<ShoppingBill>(`/api/v1/shopping/bills/${id}`),
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BillCreate) =>
      apiClient<ShoppingBill>('/api/v1/shopping/bills', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BillUpdate }) =>
      apiClient<ShoppingBill>(`/api/v1/shopping/bills/${id}`, { method: 'PUT', body: data }),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bills', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/shopping/bills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// Analytics
export function useShoppingAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient<ShoppingAnalytics>('/api/v1/shopping/analytics'),
  });
}

// Checklists
export function useChecklists() {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: () => apiClient<ShoppingChecklist[]>('/api/v1/shopping/checklists'),
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; items: { item_name: string; quantity?: string }[] }) =>
      apiClient<ShoppingChecklist>('/api/v1/shopping/checklists', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: string; itemId: string }) =>
      apiClient(`/api/v1/shopping/checklists/${checklistId}/items/${itemId}/toggle`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/shopping/checklists/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, item_name, quantity }: { checklistId: string; item_name: string; quantity?: string }) =>
      apiClient(`/api/v1/shopping/checklists/${checklistId}/items`, { method: 'POST', body: { item_name, quantity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: string; itemId: string }) =>
      apiClient(`/api/v1/shopping/checklists/${checklistId}/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

// Item Price Comparison
export function useItemPriceComparison(itemName: string) {
  return useQuery({
    queryKey: ['item-prices', itemName],
    queryFn: () => apiClient<ItemPriceComparison[]>(`/api/v1/shopping/items/${encodeURIComponent(itemName)}/prices`),
    enabled: !!itemName && itemName.length >= 2,
  });
}
