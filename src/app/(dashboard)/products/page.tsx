'use client'

import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast-provider'
import { Loading } from '@/components/ui/loading'
import AddProductModal from '@/components/products/AddProductModal'
import EditProductModal from '@/components/products/EditProductModal'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  barcode: string | null
  category_id: string | null
  category?: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter produk berdasarkan pencarian
    if (searchQuery) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [products, searchQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(name)
          `)
          .order('name'),
        supabase
          .from('categories')
          .select('*')
          .order('name')
      ])

      if (productsResponse.error) throw productsResponse.error
      if (categoriesResponse.error) throw categoriesResponse.error

      setProducts(productsResponse.data || [])
      setCategories(categoriesResponse.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      addToast('Gagal memuat data produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    console.log('handleDeleteProduct called for product:', productId)
    
    if (!confirm('Yakin ingin menghapus produk ini?')) {
      console.log('Delete cancelled by user')
      return
    }

    try {
      console.log('Deleting product from database...')
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Database error during delete:', error)
        throw error
      }

      console.log('Product deleted successfully')
      addToast('Produk berhasil dihapus', 'success')
      loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
      addToast('Gagal menghapus produk', 'error')
    }
  }

  const handleEditProduct = (product: Product) => {
    console.log('handleEditProduct called for product:', product)
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  if (loading) {
    return <Loading message="Memuat data produk..." />
  }

  // Hitung statistik produk
  const activeProducts = filteredProducts.filter(p => p.stock > 0).length
  const lowStockProducts = filteredProducts.filter(p => p.stock > 0 && p.stock <= 5).length
  const outOfStockProducts = filteredProducts.filter(p => p.stock === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-sm sm:text-base text-gray-600">Kelola produk dan inventori toko Anda</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          onClick={() => {
            console.log('Add Product button clicked')
            setShowAddModal(true)
          }}
        >
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
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                {filteredProducts.map((product) => (
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
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
            {filteredProducts.map((product) => (
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
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

          {filteredProducts.length === 0 && (
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

      {/* Modals */}
      <AddProductModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
        categories={categories}
      />
      
      <EditProductModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadData}
        product={selectedProduct}
        categories={categories}
      />
    </div>
  )
}