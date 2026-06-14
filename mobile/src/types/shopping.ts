export interface Shop {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  category: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopCreate {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  category?: string | null;
  is_favorite?: boolean;
  notes?: string | null;
}

export interface PurchaseItem {
  id: string;
  bill_id: string;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  mrp: number | null;
  discount: number | null;
  bought_price: number;
  created_at: string;
}

export interface PurchaseItemCreate {
  item_name: string;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  mrp?: number | null;
  discount?: number;
  bought_price: number;
}

export interface ShoppingBill {
  id: string;
  user_id: string;
  shop_id: string | null;
  bill_number: string | null;
  bill_date: string;
  total_amount: number;
  discount_amount: number | null;
  tax_amount: number | null;
  payment_method: string | null;
  image_url: string | null;
  entry_method: string;
  notes: string | null;
  items: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface BillCreate {
  shop_id?: string | null;
  bill_number?: string | null;
  bill_date: string;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method?: string | null;
  image_url?: string | null;
  entry_method?: string;
  notes?: string | null;
  items: PurchaseItemCreate[];
}

export interface ShoppingChecklist {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  item_name: string;
  quantity: string | null;
  is_checked: boolean;
  sort_order: number;
  created_at: string;
}

export interface ShoppingAnalytics {
  monthly_spending: { month: string; total: number }[];
  shop_spending: { shop_id: string; shop_name: string; total: number; bill_count: number }[];
  top_items: { item_name: string; count: number; avg_price: number }[];
  total_this_month: number;
  total_last_month: number;
}

export const SHOP_CATEGORIES = [
  'Grocery', 'Vegetables', 'Fruits', 'Dairy', 'Medical', 'Electronics',
  'Clothing', 'Hardware', 'Stationery', 'Other',
] as const;
