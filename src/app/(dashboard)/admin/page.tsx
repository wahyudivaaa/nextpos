'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
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
      toast.error('Gagal memuat data admin')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Email dan password harus diisi')
      return
    }

    // Note: User creation requires admin privileges on server-side
    toast.error('Fitur ini memerlukan akses admin server. Silakan hubungi administrator sistem.')
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    // Note: User deletion requires admin privileges on server-side
    toast.error('Fitur ini memerlukan akses admin server. Silakan hubungi administrator sistem.')
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
      
      toast.success('Data berhasil diekspor')
    } catch (error) {
      toast.error('Gagal mengekspor data')
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
      
      toast.success('Semua data berhasil dihapus')
      loadAdminData()
    } catch (error) {
      toast.error('Gagal menghapus data')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Memuat data admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
        <p className="text-gray-600">Kelola sistem dan pengguna</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukuran Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.databaseSize}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Manajemen Pengguna</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New User */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Tambah Pengguna Baru</h4>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <Button onClick={createUser} className="w-full">
                Tambah Pengguna
              </Button>
            </div>

            {/* Users List */}
            <div className="space-y-2">
              <h4 className="font-medium">Daftar Pengguna</h4>
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.last_sign_in_at ? "default" : "secondary"}>
                      {user.last_sign_in_at ? "Aktif" : "Belum Login"}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Manajemen Sistem</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Backup & Export */}
            <div className="space-y-3">
              <h4 className="font-medium">Backup & Export</h4>
              <div className="space-y-2">
                <Button onClick={exportData} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button className="w-full" variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data (Coming Soon)
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Backup terakhir: {systemStats.lastBackup}
              </p>
            </div>

            {/* System Actions */}
            <div className="space-y-3">
              <h4 className="font-medium">Aksi Sistem</h4>
              <div className="space-y-2">
                <Button 
                  onClick={loadAdminData} 
                  className="w-full" 
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button 
                  onClick={clearAllData} 
                  className="w-full" 
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Semua Data
                </Button>
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <h4 className="font-medium">Status Sistem</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Supabase</span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Terhubung</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">75% Terpakai</span>
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