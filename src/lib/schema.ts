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
  value_updated_at: string | null;
  image_path: string | null;
  image_orientation: ImageOrientation | null;
  notes: string | null;
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
  image_path?: string | null;
  image_orientation?: ImageOrientation | null;
  notes?: string | null;
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

export interface SearchParams {
  q?: string;
  type?: number;
  minValue?: number;
  maxValue?: number;
  condition?: string;
  year?: number;
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
