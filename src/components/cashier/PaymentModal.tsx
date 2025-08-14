'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store'
import { supabase, PaymentMethod } from '@/lib/supabase'
import { addOfflineTransaction } from '@/lib/offline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  X,
  Receipt
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { items, getTotalAmount, clearCart } = useCartStore()
  const { addToast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH' as PaymentMethod)
  const [cashReceived, setCashReceived] = useState('')
  const [processing, setProcessing] = useState(false)

  const totalAmount = getTotalAmount()
  const cashAmount = parseFloat(cashReceived) || 0
  const change = cashAmount - totalAmount

  if (!isOpen) return null

  const paymentMethods = [
    { value: 'CASH' as PaymentMethod, label: 'Tunai', icon: Banknote },
    { value: 'CARD' as PaymentMethod, label: 'Kartu', icon: CreditCard },
    { value: 'DIGITAL' as PaymentMethod, label: 'Digital', icon: Smartphone },
  ]

  const handlePayment = async () => {
    if (paymentMethod === 'CASH' && cashAmount < totalAmount) {
      addToast('Jumlah uang tidak mencukupi', 'error')
      return
    }

    setProcessing(true)

    try {
      // Data transaksi
      const orderData = {
        total_amount: totalAmount,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'CASH' ? cashAmount : totalAmount,
        change_amount: paymentMethod === 'CASH' ? change : 0,
        status: 'COMPLETED' as const,
        items: items.map(item => ({
          product_id: item.product.id.toString(),
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity
        }))
      }

      // Cek koneksi internet
      if (navigator.onLine) {
        // Simpan ke Supabase
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            total_amount: orderData.total_amount,
            payment_method: orderData.payment_method,
            cash_received: orderData.cash_received,
            change_amount: orderData.change_amount,
            status: orderData.status
          })
          .select()
          .single()

        if (orderError) throw orderError

        // Simpan order items
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // Update stok produk menggunakan stored function
        console.log('Memulai update stok untuk', orderData.items.length, 'item')
        for (const item of orderData.items) {
          console.log(`Updating stock untuk produk ${item.product_id}, quantity: ${item.quantity}`)
          
          const { error: stockError } = await supabase
            .rpc('update_product_stock', {
              product_id: item.product_id,
              quantity_sold: item.quantity
            })
            
          if (stockError) {
            console.error('Error updating stock:', stockError)
            throw stockError // Throw error jika update stok gagal
          } else {
            console.log(`Stok berhasil diupdate untuk produk ${item.product_id}`)
          }
        }
        console.log('Semua stok berhasil diupdate')

        addToast('Transaksi berhasil disimpan', 'success')
        
        // Bersihkan keranjang dan tutup modal setelah semua operasi berhasil
        clearCart()
        onClose()

        // Tampilkan struk (opsional)
        showReceipt(orderData)

        // Reload halaman setelah semua operasi selesai
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        // Mode offline - simpan ke IndexedDB
        await addOfflineTransaction({
          userId: 'offline-user', // Default user untuk mode offline
          paymentMethod: orderData.payment_method,
          items: orderData.items.map((item: { product_id: string; quantity: number; price?: number; subtotal?: number }) => ({
            productId: parseInt(item.product_id),
            quantity: item.quantity
          })),
          timestamp: Date.now()
        })

        // Bersihkan keranjang dan tutup modal setelah operasi offline berhasil
        clearCart()
        onClose()

        // Tampilkan struk (opsional)
        showReceipt(orderData)

        addToast('Transaksi disimpan offline', 'success')
      }

    } catch (error) {
      console.error('Payment error:', error)
      addToast('Gagal memproses pembayaran', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const showReceipt = (orderData: { items: Array<{ product_id: string; quantity: number; price?: number; subtotal?: number }>; total_amount?: number; payment_method: string; cash_received?: number; change_amount?: number }) => {
    // Implementasi sederhana untuk menampilkan struk
    const receiptWindow = window.open('', '_blank', 'width=300,height=600')
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Struk Pembayaran</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="center">
              <h2>NextPOS Cashier</h2>
              <p>${new Date().toLocaleString('id-ID')}</p>
            </div>
            <div class="line"></div>
            ${orderData.items.map((item: { product_id: string; quantity: number; price?: number; subtotal?: number }) => `
              <div>
                ${item.product_id} x${item.quantity}<br>
                @ Rp ${(item.price || 0).toLocaleString('id-ID')}<br>
                Subtotal: Rp ${(item.subtotal || 0).toLocaleString('id-ID')}
              </div>
              <br>
            `).join('')}
            <div class="line"></div>
            <div class="total">
              Total: Rp ${(orderData.total_amount || 0).toLocaleString('id-ID')}<br>
              ${orderData.payment_method === 'CASH' ? `
                Bayar: Rp ${(orderData.cash_received || 0).toLocaleString('id-ID')}<br>
                Kembali: Rp ${(orderData.change_amount || 0).toLocaleString('id-ID')}
              ` : `Pembayaran: ${orderData.payment_method}`}
            </div>
            <div class="center" style="margin-top: 20px;">
              <p>Terima kasih!</p>
            </div>
          </body>
        </html>
      `)
      receiptWindow.document.close()
      receiptWindow.print()
    }
  }

  const quickCashAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 20000) * 20000,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000
  ].filter((amount, index, arr) => arr.indexOf(amount) === index)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Pembayaran</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Pembayaran</p>
            <p className="text-2xl font-bold">
              Rp {(totalAmount || 0).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="text-sm font-medium">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <Button
                    key={method.value}
                    variant={paymentMethod === method.value ? "default" : "outline"}
                    onClick={() => setPaymentMethod(method.value)}
                    className="flex flex-col items-center space-y-1 h-auto py-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Input Tunai */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Jumlah Uang Diterima</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCashReceived(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div>
                <label className="text-sm font-medium">Uang Pas</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {quickCashAmounts.slice(0, 4).map((amount, index) => (
                    <Button
                      key={`quick-cash-${amount}-${index}`}
                      variant="outline"
                      size="sm"
                      onClick={() => setCashReceived(amount.toString())}
                    >
                      Rp {(amount || 0).toLocaleString('id-ID')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Kembalian */}
              {cashAmount > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kembalian:</span>
                    <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rp {Math.max(0, change || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {change < 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Kurang Rp {Math.abs(change || 0).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tombol Proses */}
          <Button
            onClick={handlePayment}
            disabled={processing || (paymentMethod === 'CASH' && cashAmount < totalAmount)}
            className="w-full"
            size="lg"
          >
            {processing ? 'Memproses...' : 'Proses Pembayaran'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}