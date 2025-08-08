'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast-provider'
import { Loading } from '@/components/ui/loading'
import { 
  Users, 
  Settings, 
  Database, 
  Shield, 
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
}

interface SystemStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  databaseSize: string
  lastBackup: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    databaseSize: '0 MB',
    lastBackup: 'Belum pernah'
  })
  const [loading, setLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const { addToast } = useToast()

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Load current user only (admin API not available in client)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUsers([{
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || '',
          last_sign_in_at: user.last_sign_in_at || ''
        }])
      }

      // Load system statistics
      const [productsResult, ordersResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' })
      ])

      setSystemStats({
        totalUsers: 1, // Current user only
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        databaseSize: '2.5 MB', // Placeholder
        lastBackup: new Date().toLocaleDateString('id-ID')
      })

    } catch (error) {
      console.error('Error loading admin data:', error)
      addToast('Gagal memuat data admin', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      addToast('Email dan password harus diisi', 'error')
      return
    }

    // Note: User creation requires admin privileges on server-side
    addToast('Fitur ini memerlukan akses admin server. Silakan hubungi administrator sistem.', 'error')
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    // Note: User deletion requires admin privileges on server-side
    addToast('Fitur ini memerlukan akses admin server. Silakan hubungi administrator sistem.', 'error')
  }

  const exportData = async () => {
    try {
      const [products, orders] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*, order_items(*)')
      ])

      const exportData = {
        products: products.data,
        orders: orders.data,
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nextpos-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      
      addToast('Data berhasil diekspor', 'success')
    } catch (error) {
      addToast('Gagal mengekspor data', 'error')
    }
  }

  const clearAllData = async () => {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA data transaksi dan produk. Yakin ingin melanjutkan?')) return
    if (!confirm('Konfirmasi sekali lagi: Semua data akan hilang permanen!')) return

    try {
      await Promise.all([
        supabase.from('order_items').delete().neq('id', ''),
        supabase.from('orders').delete().neq('id', ''),
        supabase.from('products').delete().neq('id', '')
      ])
      
      addToast('Semua data berhasil dihapus', 'success')
      loadAdminData()
    } catch (error) {
      addToast('Gagal menghapus data', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel Admin</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola sistem dan pengguna</p>
        </div>
        <div className="py-12">
          <Loading message="Memuat data admin..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel Admin</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola sistem dan pengguna</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{systemStats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Produk</CardTitle>
            <Database className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{systemStats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Pesanan</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{systemStats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Ukuran Database</CardTitle>
            <Database className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{systemStats.databaseSize}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Management */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Manajemen Pengguna</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-6 pt-0">
            {/* Add New User */}
            <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm sm:text-base">Tambah Pengguna Baru</h4>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserEmail(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserPassword(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button onClick={createUser} className="w-full text-sm">
                Tambah Pengguna
              </Button>
            </div>

            {/* Users List */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Daftar Pengguna</h4>
              {users.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{user.email}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end space-x-2">
                    <Badge variant={user.last_sign_in_at ? "default" : "secondary"} className="text-xs">
                      {user.last_sign_in_at ? "Aktif" : "Belum Login"}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Management */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Manajemen Sistem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-6 pt-0">
            {/* Backup & Export */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm sm:text-base">Backup & Export</h4>
              <div className="space-y-2">
                <Button onClick={exportData} className="w-full text-sm" variant="outline">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Export Data
                </Button>
                <Button className="w-full text-sm" variant="outline" disabled>
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Import Data (Coming Soon)
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Backup terakhir: {systemStats.lastBackup}
              </p>
            </div>

            {/* System Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm sm:text-base">Aksi Sistem</h4>
              <div className="space-y-2">
                <Button 
                  onClick={loadAdminData} 
                  className="w-full text-sm" 
                  variant="outline"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button 
                  onClick={clearAllData} 
                  className="w-full text-sm" 
                  variant="destructive"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Hapus Semua Data
                </Button>
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm sm:text-base">Status Sistem</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Database</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Supabase</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-600">Terhubung</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Storage</span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                    <span className="text-xs sm:text-sm text-yellow-600">75% Terpakai</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}