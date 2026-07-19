export interface Shop {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  gstin: string | null;
  category: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecentShop {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  gstin: string | null;
  last_visit_date: string | null;
  bill_count: number;
  total_spent: number;
}

export interface ShopCreate {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  gstin?: string | null;
  category?: string | null;
  is_favorite?: boolean;
  notes?: string | null;
}

export interface PurchaseItem {
  id: string;
  bill_id: string;
  item_name: string;
  brand_name: string | null;
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
  brand_name?: string | null;
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
  purchase_mode: string;
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
  purchase_mode?: string;
  image_url?: string | null;
  entry_method?: string;
  notes?: string | null;
  items: PurchaseItemCreate[];
}

export interface BillUpdate {
  shop_id?: string | null;
  bill_number?: string | null;
  bill_date?: string;
  total_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method?: string | null;
  purchase_mode?: string;
  image_url?: string | null;
  notes?: string | null;
  items?: PurchaseItemCreate[];
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

export interface ItemPriceComparison {
  shop_name: string;
  shop_id: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  last_bought_date: string;
  last_price: number;
}

// OCR extraction result (before saving)
export interface OCRBillItem {
  item_name: string;
  brand_name?: string | null;
  quantity: number | null;
  unit: string | null;
  mrp: number | null;
  discount: number | null;
  bought_price: number;
}

export interface OCRBillResult {
  shop_name: string | null;
  shop_address: string | null;
  shop_phone: string | null;
  shop_gstin: string | null;
  bill_date: string | null;
  items: OCRBillItem[];
  total_amount: number | null;
  raw_text: string | null;
}

export const SHOP_CATEGORIES = [
  'Grocery', 'Vegetables', 'Fruits', 'Dairy', 'Medical', 'Electronics',
  'Clothing', 'Hardware', 'Stationery', 'Other',
] as const;

export const SHOPPING_UNITS = ['kg', 'g', 'L', 'pcs', 'pack'] as const;

export const PURCHASE_MODES = ['offline', 'online'] as const;

// --- Bill Draft ---
export const BILL_DRAFT_VERSION = 1;

export interface BillDraft {
  id: string;
  entry_method: string;
  draft_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BillDraftCreate {
  entry_method?: string;
  draft_data: Record<string, unknown>;
}

export interface BillDraftUpdate {
  draft_data: Record<string, unknown>;
}
