'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings
} from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">NextPOS</h1>
          <p className="text-xl text-muted-foreground">
            Sistem Kasir Modern - Pilih Modul
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          <Link href="/cashier">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-48 flex flex-col justify-center border-2 hover:border-blue-500">
              <CardHeader className="text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                <CardTitle className="text-2xl">Kasir</CardTitle>
                <CardDescription className="text-lg">
                  Proses transaksi penjualan dan pembayaran
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/products">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-48 flex flex-col justify-center border-2 hover:border-green-500">
              <CardHeader className="text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <CardTitle className="text-2xl">Produk</CardTitle>
                <CardDescription className="text-lg">
                  Kelola inventori dan data produk
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-48 flex flex-col justify-center border-2 hover:border-purple-500">
              <CardHeader className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <CardTitle className="text-2xl">Laporan</CardTitle>
                <CardDescription className="text-lg">
                  Analisis penjualan dan laporan keuangan
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-48 flex flex-col justify-center border-2 hover:border-red-500">
              <CardHeader className="text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 text-red-600" />
                <CardTitle className="text-2xl">Admin</CardTitle>
                <CardDescription className="text-lg">
                  Pengaturan sistem dan manajemen pengguna
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}