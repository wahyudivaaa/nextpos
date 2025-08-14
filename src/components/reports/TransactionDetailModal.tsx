'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Receipt, Calendar, CreditCard, User, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Loading } from '@/components/ui/loading'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  subtotal: number
  product: {
    name: string
    barcode?: string
  }
}

interface Order {
  id: string
  order_number?: string
  total_amount: number
  payment_method: string
  payment_amount?: number
  change_amount?: number
  created_at: string
  user_id?: string
  status: string
  user?: {
    full_name: string
    email: string
  }
  order_items: OrderItem[]
}

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

export function TransactionDetailModal({ isOpen, onClose, orderId }: TransactionDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetail()
    }
  }, [isOpen, orderId, loadOrderDetail])

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:profiles(full_name, email),
          order_items(
            *,
            product:products(name, barcode)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Error loading order detail:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'cash': 'default',
      'card': 'secondary',
      'digital': 'outline'
    }
    
    const labels: Record<string, string> = {
      'cash': 'Tunai',
      'card': 'Kartu',
      'digital': 'Digital'
    }

    return (
      <Badge variant={variants[method] || 'outline'}>
        {labels[method] || method}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <Loading message="Memuat detail transaksi..." />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">ID Transaksi</span>
                </div>
                <p className="font-mono font-semibold">#{order.id.slice(-8)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tanggal & Waktu</span>
                </div>
                <p className="text-sm">{formatDate(order.created_at)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Kasir</span>
                </div>
                <p className="text-sm">{order.user?.full_name || 'System'}</p>
                <p className="text-xs text-gray-500">{order.user?.email || '-'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Metode Pembayaran</span>
                </div>
                {getPaymentMethodBadge(order.payment_method)}
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Item Transaksi</h3>
              </div>

              <div className="space-y-3">
                {order.order_items.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      {item.product.barcode && (
                        <p className="text-xs text-gray-500 font-mono">{item.product.barcode}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold">Ringkasan Pembayaran</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Belanja</span>
                  <span className="font-semibold">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                
                {order.payment_amount && (
                  <div className="flex justify-between">
                    <span>Jumlah Bayar</span>
                    <span>Rp {order.payment_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                
                {order.change_amount && (
                  <div className="flex justify-between">
                    <span>Kembalian</span>
                    <span>Rp {order.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Transaksi tidak ditemukan
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}