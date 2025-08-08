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
        product.category?.id === parseInt(selectedCategory)
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
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="h-8 text-xs sm:h-9 sm:text-sm px-2 sm:px-3"
              >
                Semua
              </Button>
              {categories.map((category) => (
                <Button
                  key={category?.id}
                  variant={selectedCategory === category?.id?.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category?.id?.toString() || null)}
                  className="h-8 text-xs sm:h-9 sm:text-sm px-2 sm:px-3"
                >
                  {category?.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Panel Produk */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-3 sm:space-y-4">
          {/* Info Hasil */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <span>
              Menampilkan {filteredProducts.length} dari {products.length} produk
            </span>
            {searchQuery && (
              <span className="text-blue-600 font-medium">
                Hasil: "{searchQuery}"
              </span>
            )}
          </div>

          {/* Grid Produk */}
          <ProductGrid products={filteredProducts} />
        </div>

        {/* Panel Keranjang */}
        <div className="lg:col-span-1 xl:col-span-1 order-first lg:order-last">
          {/* Mobile: Keranjang di atas, Desktop: Keranjang di samping */}
          <div className="lg:sticky lg:top-4">
            <div className="lg:pb-24">
              <Cart />
            </div>
            
            {/* Sticky Checkout Section - Mobile: Fixed bottom, Desktop: Sticky dalam container */}
            <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 bg-white p-3 sm:p-4 rounded-t-lg lg:rounded-lg shadow-lg border-t-2 lg:border-2 border-gray-200 space-y-2 sm:space-y-3 z-50 lg:z-auto">
              <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">Rp {(getTotalAmount() || 0).toLocaleString('id-ID')}</span>
              </div>
              
              <Button 
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm sm:text-base"
                size="lg"
              >
                Checkout ({items.length} item)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer untuk mobile agar content tidak tertutup sticky checkout */}
      <div className="h-24 lg:hidden"></div>

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