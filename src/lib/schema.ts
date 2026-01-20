export interface CollectionType {
  id: number;
  name: string;
  description: string | null;
}

export type ImageOrientation = 'portrait' | 'landscape' | 'square';

export interface Item {
  id: number;
  collection_type_id: number;
  user_id: number | null;
  name: string;
  year: number | null;
  publisher: string | null;
  series: string | null;
  issue_number: string | null;
  variant: string | null;
  condition_grade: string | null;
  professional_grade: number | null;
  grading_company: string | null;
  cert_number: string | null;
  purchase_price: number | null;
  purchase_date: string | null;
  estimated_value: number | null;
  estimated_value_low: number | null;
  estimated_value_high: number | null;
  value_trend: ValueTrend | null;
  value_confidence: ValueConfidence | null;
  value_updated_at: string | null;
  image_path: string | null;
  image_orientation: ImageOrientation | null;
  notes: string | null;
  key_information: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemWithType extends Item {
  collection_type_name: string;
  image_count?: number; // Optional, populated by list queries
}

export interface ItemImage {
  id: number;
  item_id: number;
  image_path: string;
  image_orientation: ImageOrientation;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ItemWithImages extends ItemWithType {
  images: ItemImage[];
}

export interface CreateItemImageInput {
  item_id: number;
  image_path: string;
  image_orientation?: ImageOrientation;
  is_primary?: boolean;
  display_order?: number;
}

export interface UpdateItemImageInput {
  is_primary?: boolean;
  display_order?: number;
}

export interface PriceHistory {
  id: number;
  item_id: number;
  price: number;
  source: string | null;
  recorded_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface ItemTag {
  item_id: number;
  tag_id: number;
}

export interface User {
  id: number;
  name: string;
  created_at: string;
}

export interface CreateItemInput {
  collection_type_id: number;
  user_id?: number | null;
  name: string;
  year?: number | null;
  publisher?: string | null;
  series?: string | null;
  issue_number?: string | null;
  variant?: string | null;
  condition_grade?: string | null;
  professional_grade?: number | null;
  grading_company?: string | null;
  cert_number?: string | null;
  purchase_price?: number | null;
  purchase_date?: string | null;
  estimated_value?: number | null;
  estimated_value_low?: number | null;
  estimated_value_high?: number | null;
  value_trend?: ValueTrend | null;
  value_confidence?: ValueConfidence | null;
  image_path?: string | null;
  image_orientation?: ImageOrientation | null;
  notes?: string | null;
  key_information?: string | null;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  id: number;
}

export interface CollectionStats {
  totalItems: number;
  totalValue: number;
  totalInvested: number;
  itemsByType: { name: string; count: number }[];
  recentItems: ItemWithType[];
  valueByCondition: { condition: string; value: number }[];
}

export const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Recently Updated' },
  { value: 'updated_asc', label: 'Oldest Updated' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'value_desc', label: 'Value (High to Low)' },
  { value: 'value_asc', label: 'Value (Low to High)' },
  { value: 'year_desc', label: 'Year (Newest)' },
  { value: 'year_asc', label: 'Year (Oldest)' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

export interface SearchParams {
  q?: string;
  type?: number;
  minValue?: number;
  maxValue?: number;
  condition?: string;
  year?: number;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

export const CONDITION_GRADES = [
  'Mint',
  'Near Mint (NM)',
  'Very Fine (VF)',
  'Fine (F)',
  'Very Good (VG)',
  'Good (G)',
  'Fair',
  'Poor'
] as const;

export const GRADING_COMPANIES = [
  'PSA',
  'BGS',
  'CGC',
  'SGC',
  'CSG'
] as const;

export const VALUE_TRENDS = [
  'appreciating',
  'stable',
  'declining',
  'volatile'
] as const;

export const VALUE_CONFIDENCE_LEVELS = [
  'high',
  'medium',
  'low'
] as const;

export type ValueTrend = typeof VALUE_TRENDS[number];
export type ValueConfidence = typeof VALUE_CONFIDENCE_LEVELS[number];
