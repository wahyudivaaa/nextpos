'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Loading } from '@/components/ui/loading'
import { TransactionDetailModal } from '@/components/reports/TransactionDetailModal'

interface Order {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  order_items?: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }>
}

interface ReportsData {
  totalSales: number
  totalOrders: number
  averageOrder: number
  todaySales: number
  todayOrders: number
  transactions: Order[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData>({
    totalSales: 0,
    totalOrders: 0,
    averageOrder: 0,
    todaySales: 0,
    todayOrders: 0,
    transactions: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    setLoading(true)
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const orders = ordersData || []

      // Hitung statistik
      const totalSales = orders.reduce((sum, order) => sum + order.total_amount, 0)
      const totalOrders = orders.length
      const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0

      // Statistik hari ini
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = orders.filter(order => 
        order.created_at.startsWith(today)
      )
      const todaySales = todayOrders.reduce((sum, order) => sum + order.total_amount, 0)

      setData({
        totalSales,
        totalOrders,
        averageOrder,
        todaySales,
        todayOrders: todayOrders.length,
        transactions: orders
      })

    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowDetailModal(true)
  }

  const { totalSales, totalOrders, averageOrder, todaySales, todayOrders, transactions } = data

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Badge variant="default">Tunai</Badge>
      case 'CARD':
        return <Badge variant="secondary">Kartu</Badge>
      case 'DIGITAL':
        return <Badge variant="outline">Digital</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
            <p className="text-sm sm:text-base text-gray-600">Analisis performa penjualan dan transaksi</p>
          </div>
        </div>
        <div className="py-12">
          <Loading message="Memuat data laporan..." />
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-sm sm:text-base text-gray-600">Analisis performa penjualan dan transaksi</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  Rp {(totalSales || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Penjualan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  Rp {(averageOrder || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Rata-rata Transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  Rp {(todaySales || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Penjualan Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{todayOrders}</p>
                <p className="text-xs sm:text-sm text-gray-600">Transaksi Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {todayOrders > 0 ? ((todaySales || 0) / todayOrders).toLocaleString('id-ID') : '0'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Rata-rata Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      Rp {(order.total_amount || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(order.payment_method)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                      >
                        {order.status === 'COMPLETED' ? 'Selesai' : order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {order.order_items?.length || 0} item
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(order.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.map((order) => (
              <Card key={order.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-mono text-sm text-gray-600">#{order.id.slice(-8)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        Rp {(order.total_amount || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.order_items?.length || 0} item
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {getPaymentMethodBadge(order.payment_method)}
                      <Badge 
                        variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status === 'COMPLETED' ? 'Selesai' : order.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(order.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada transaksi</h3>
              <p className="mt-1 text-sm text-gray-500">
                Transaksi akan muncul di sini setelah ada penjualan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}