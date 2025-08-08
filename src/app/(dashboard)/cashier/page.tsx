import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import CashierInterface from '@/components/cashier/CashierInterface'

async function getProducts() {
  const cookieStore = await cookies()
  
  // Validate Supabase environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL') || 
      supabaseKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    throw new Error('Supabase belum dikonfigurasi. Silakan update file .env.local dengan kredensial Supabase yang valid.')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .order('name')

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Gagal mengambil data produk dari database')
    }

    return products || []
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export default async function CashierPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kasir</h1>
        <p className="text-gray-600">Kelola transaksi penjualan</p>
      </div>
      
      <CashierInterface initialProducts={products} />
    </div>
  )
}