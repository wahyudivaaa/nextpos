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
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle
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

  // Hitung statistik produk
  const activeProducts = products.filter(p => p.stock > 0).length
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStockProducts = products.filter(p => p.stock === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-sm sm:text-base text-gray-600">Kelola produk dan inventori toko Anda</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Statistik Produk */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Produk</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Produk Aktif</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{activeProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Stok Rendah</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{lowStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Stok Habis</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{outOfStockProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search dan Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari produk..."
            className="pl-10 w-full sm:w-80"
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Products List - Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                      {product.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Harga:</span>
                      <p className="font-medium">Rp {(product.price || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stok:</span>
                      <p className="font-medium">{product.stock}</p>
                    </div>
                    {product.barcode && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Barcode:</span>
                        <p className="font-mono text-xs">{product.barcode}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      {product.stock === 0 ? (
                        <Badge variant="destructive" className="text-xs">Habis</Badge>
                      ) : product.stock <= 5 ? (
                        <Badge variant="secondary" className="text-xs">Menipis</Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">Tersedia</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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