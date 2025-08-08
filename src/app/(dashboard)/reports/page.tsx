import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  BarChart3
} from 'lucide-react'

async function getReportsData() {
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
    const { data, error } = await supabase
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

    const ordersData = data || []

    // Hitung statistik
    const totalSales = ordersData.reduce((sum, order) => sum + order.total_amount, 0)
    const totalOrders = ordersData.length
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0

    // Statistik hari ini
    const today = new Date().toISOString().split('T')[0]
    const todayOrders = ordersData.filter(order => 
      order.created_at.startsWith(today)
    )
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total_amount, 0)

    return {
      totalSales,
      totalOrders,
      averageOrder,
      todaySales,
      todayOrders: todayOrders.length,
      transactions: ordersData
    }

  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

export default async function ReportsPage() {
  const data = await getReportsData()
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
        <p className="text-gray-600">Analisis performa penjualan dan transaksi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  Rp {(totalSales || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">Total Penjualan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-gray-600">Total Transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  Rp {(averageOrder || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">Rata-rata Transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  Rp {(todaySales || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">Penjualan Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{todayOrders}</p>
                <p className="text-sm text-gray-600">Transaksi Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {todayOrders > 0 ? ((todaySales || 0) / todayOrders).toLocaleString('id-ID') : '0'}
                </p>
                <p className="text-sm text-gray-600">Rata-rata Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Metode Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Item</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>

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