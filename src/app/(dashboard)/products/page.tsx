import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Filter
} from 'lucide-react'

async function getProductsAndCategories() {
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
    const [productsResponse, categoriesResponse] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name'),
      supabase
        .from('categories')
        .select('*')
        .order('name')
    ])

    if (productsResponse.error) throw productsResponse.error
    if (categoriesResponse.error) throw categoriesResponse.error

    return {
      products: productsResponse.data || [],
      categories: categoriesResponse.data || []
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

export default async function ProductsPage() {
  const { products, categories } = await getProductsAndCategories()



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-600">Kelola produk dan kategori</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Tambah Produk</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-600">Total Produk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stock > 0).length}
                </p>
                <p className="text-sm text-gray-600">Stok Tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stock === 0).length}
                </p>
                <p className="text-sm text-gray-600">Stok Habis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.stock > 0 && p.stock <= 5).length}
                </p>
                <p className="text-sm text-gray-600">Stok Menipis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari produk berdasarkan nama atau barcode..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category.name}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.barcode || '-'}
                  </TableCell>
                  <TableCell>Rp {(product.price || 0).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    {product.stock === 0 ? (
                      <Badge variant="destructive">Habis</Badge>
                    ) : product.stock <= 5 ? (
                      <Badge variant="secondary">Menipis</Badge>
                    ) : (
                      <Badge variant="default">Tersedia</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada produk</h3>
              <p className="mt-1 text-sm text-gray-500">
                Mulai dengan menambahkan produk baru.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}