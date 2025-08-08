'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/lib/supabase'
import { useCartStore } from '@/lib/store'
import ProductGrid from './ProductGrid'
import Cart from './Cart'
import PaymentModal from './PaymentModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter } from 'lucide-react'

interface CashierInterfaceProps {
  initialProducts: Product[]
}

export default function CashierInterface({ initialProducts }: CashierInterfaceProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  const { items, getTotalAmount } = useCartStore()

  // Filter produk berdasarkan pencarian dan kategori
  useEffect(() => {
    let filtered = products

    // Filter berdasarkan pencarian
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter berdasarkan kategori
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category?.id === selectedCategory
      )
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory])

  // Dapatkan daftar kategori unik
  const categories = Array.from(
    new Set(products.map(p => p.category).filter(Boolean))
  ).filter((category, index, self) => 
    self.findIndex(c => c?.id === category?.id) === index
  )

  const handleCheckout = () => {
    if (items.length === 0) return
    setShowPaymentModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Search dan Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-9"
              >
                Semua
              </Button>
              {categories.map((category) => (
                <Button
                  key={category?.id}
                  variant={selectedCategory === category?.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category?.id || null)}
                  className="h-9"
                >
                  {category?.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Panel Produk */}
        <div className="xl:col-span-3 space-y-4">
          {/* Info Hasil */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Menampilkan {filteredProducts.length} dari {products.length} produk
            </span>
            {searchQuery && (
              <span>
                Hasil pencarian: "{searchQuery}"
              </span>
            )}
          </div>

          {/* Grid Produk */}
          <ProductGrid products={filteredProducts} />
        </div>

        {/* Panel Keranjang */}
        <div className="xl:col-span-1 relative">
          {/* Container Keranjang dengan padding bottom untuk sticky checkout */}
          <div className="pb-24">
            <Cart />
          </div>
          
          {/* Sticky Checkout Section */}
          <div className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">Rp {(getTotalAmount() || 0).toLocaleString('id-ID')}</span>
            </div>
            
            <Button 
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="lg"
            >
              Checkout ({items.length} item)
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Pembayaran */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}