import { createBrowserClient } from '@supabase/ssr'

// Validasi environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_url_here' || 
    supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error('Supabase URL dan Anon Key harus dikonfigurasi di file .env.local')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Types untuk database
export type UserRole = 'admin' | 'cashier'
export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
}

export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  sku: string | null
  price: number
  cost: number | null
  stock: number
  category_id: number | null
  created_at: string
  category?: Category
}

export interface Order {
  id: number
  total_amount: number
  payment_method: PaymentMethod
  created_by: string
  created_at: string
  profile?: Profile
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price_per_item: number
  product?: Product
}