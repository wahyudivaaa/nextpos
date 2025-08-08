'use client'

import { useCartStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'

export default function Cart() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalAmount, 
    getTotalItems 
  } = useCartStore()

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Keranjang</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Keranjang kosong</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Keranjang
            {items.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getTotalItems()}
              </span>
            )}
          </h3>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Kosongkan
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product.id} className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">{item.product.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Rp {item.product.price?.toLocaleString('id-ID') || '0'} per item
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.product.id)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="h-7 w-7 p-0"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center text-sm font-medium bg-white px-2 py-1 rounded border">
                    {item.quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    Rp {((item.product.price || 0) * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Total Item:</span>
              <span className="font-medium">{getTotalItems()} item</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Total Harga:</span>
              <span className="text-blue-600">Rp {(getTotalAmount() || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}