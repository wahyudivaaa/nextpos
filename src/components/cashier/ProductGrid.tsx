'use client'

import { Product } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    try {
      if (!product) {
        toast.error('Data produk tidak valid')
        return
      }

      if (product.stock <= 0) {
        toast.error(`${product.name} sedang habis`)
        return
      }

      addItem(product)
      toast.success(`${product.name} ditambahkan ke keranjang`, {
        icon: <ShoppingCart className="h-4 w-4" />
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Gagal menambahkan produk ke keranjang')
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada produk</h3>
        <p className="mt-2 text-sm text-gray-500">
          Tidak ada produk yang sesuai dengan pencarian Anda.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
            product.stock <= 0 ? 'opacity-60' : 'cursor-pointer'
          }`}
          onClick={() => product.stock > 0 && handleAddToCart(product)}
        >
          {/* Status Badge */}
          {product.stock <= 0 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="destructive" className="text-xs">HABIS</Badge>
            </div>
          )}
          
          <CardHeader className="p-0">
            {/* Gambar Produk */}
            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {/* Nama Produk */}
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-gray-900 min-h-[2.5rem] flex items-center">
                {product.name}
              </h3>
              
              {/* Kategori */}
              {product.category && (
                <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200">
                  {product.category.name}
                </Badge>
              )}
            </div>

            {/* Harga */}
            <div className="space-y-2">
              <div className="text-xl font-bold text-blue-600">
                Rp {(product.price || 0).toLocaleString('id-ID')}
              </div>
              
              {/* Stok */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Stok:</span>
                <div>
                  {product.stock <= 0 ? (
                    <Badge variant="destructive" className="text-xs">Habis</Badge>
                  ) : product.stock <= 5 ? (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      Sisa {product.stock}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {product.stock}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Add */}
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={product.stock <= 0}
              onClick={(e) => handleAddToCart(product, e)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {product.stock <= 0 ? 'Habis' : 'Tambah ke Keranjang'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}