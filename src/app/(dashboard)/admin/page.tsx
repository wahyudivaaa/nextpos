'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { updateUserEmail } from '@/lib/supabase-admin'
import { useToast } from '@/components/ui/toast-provider'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserRole, ROLE_DESCRIPTIONS, hasPermission } from '@/lib/permissions'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import * as XLSX from 'xlsx'
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
  XCircle,
  Edit,
  FileSpreadsheet
} from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
}

interface UserProfile {
  id: string
  user_id: string
  email: string // Email langsung dari profile
  role: UserRole // Backward compatibility
  roles: UserRole[] // New multi-role support
  created_at: string
  updated_at: string
  last_sign_in_at?: string // Data login terakhir
  users?: {
    email: string
    created_at: string
    last_sign_in_at: string
  }
}

interface SystemStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  databaseSize: string
  lastBackup: string
}

function AdminPageContent() {
  const [users, setUsers] = useState<User[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
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
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['CASHIER'])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editUserEmail, setEditUserEmail] = useState('')
  const [editUserPassword, setEditUserPassword] = useState('')
  const { addToast } = useToast()
  const { user: currentUser, checkPermission } = useAuth()

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Load user profiles with role information using the new view
      let profiles: UserProfile[] = []
      
      // Try to load from view first
      const { data: viewData, error: viewError } = await supabase
        .from('user_profiles_with_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (viewError) {
        console.warn('View not available, falling back to profiles table:', viewError)
        
        // Fallback: Load from profiles table and manually get roles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) {
          console.error('Error loading profiles:', profilesError)
          addToast('Gagal memuat data pengguna', 'error')
        } else {
          // Transform profiles data to match UserProfile interface
          profiles = (profilesData || []).map(profile => ({
            id: profile.id,
            user_id: profile.id,
            email: profile.email,
            role: profile.role,
            roles: [profile.role], // Fallback to single role
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_sign_in_at: profile.last_login
          }))
        }
      } else {
        profiles = viewData || []
      }
      
      setUserProfiles(profiles)

      // Load system statistics
      const [productsResult, ordersResult, profilesCount] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' })
      ])

      setSystemStats({
        totalUsers: profilesCount.count || 0,
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

    if (newUserPassword.length < 6) {
      addToast('Password minimal 6 karakter', 'error')
      return
    }

    if (selectedRoles.length === 0) {
      addToast('Minimal satu role harus dipilih', 'error')
      return
    }

    // Pembuatan user baru memerlukan admin privileges yang tidak tersedia
    addToast('Pembuatan user baru memerlukan akses admin server. Silakan hubungi administrator sistem untuk membuat user baru.', 'warning')
    
    // Reset form
    setNewUserEmail('')
    setNewUserPassword('')
    setSelectedRoles(['CASHIER'])
  }

  const updateUser = async (profileId: string) => {
    try {
      setLoading(true)
      const profile = userProfiles.find(p => p.id === profileId)
      if (!profile) {
        addToast('Profil pengguna tidak ditemukan', 'error')
        return
      }

      // Use profile.user_id if available, otherwise use profile.id (for fallback compatibility)
      const userId = profile.user_id || profile.id
      
      let hasUpdates = false
      const messages: string[] = []
      
      // Update email di auth.users dan profiles jika berubah
      if (editUserEmail && editUserEmail !== profile.email) {
        // Update email menggunakan helper function (Admin API atau RPC fallback)
        const { error: emailError } = await updateUserEmail(userId, editUserEmail)
        
        if (emailError) {
          console.error('Error updating user email:', emailError)
          throw new Error(`Gagal mengupdate email: ${emailError.message}`)
        }

        hasUpdates = true
        messages.push('Email berhasil diupdate di sistem auth dan profil')
      }

      // Cek jika ada password yang ingin diupdate
      if (editUserPassword) {
        messages.push('Update password memerlukan akses admin server')
      }

      // Berikan feedback berdasarkan apa yang terjadi
      if (hasUpdates) {
        addToast(messages.join('. '), 'success')
      } else if (editUserPassword && !editUserEmail) {
        addToast('Update password memerlukan akses admin server. Silakan hubungi administrator sistem.', 'warning')
      } else if (!editUserEmail && !editUserPassword) {
        addToast('Tidak ada perubahan yang dilakukan', 'info')
      } else if (editUserEmail === profile.email) {
        addToast('Email yang dimasukkan sama dengan email saat ini', 'info')
      }
      
      // Reset form dan reload data hanya jika ada update
      if (hasUpdates) {
        setEditingUser(null)
        setEditUserEmail('')
        setEditUserPassword('')
        loadAdminData()
      }
    } catch (error: unknown) {
      console.error('Error updating user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengupdate pengguna'
      addToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRoles = async (userId: string, newRoles: UserRole[]) => {
    try {
      // Remove all existing roles for the user
      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (removeError) {
        console.error('Error removing existing roles:', removeError)
        addToast('Gagal menghapus role lama', 'error')
        return
      }

      // Add new roles
      if (newRoles.length > 0) {
        const roleInserts = newRoles.map(role => ({
          user_id: userId,
          role: role,
          assigned_by: currentUser?.id,
          assigned_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(roleInserts)

        if (insertError) {
          console.error('Error inserting new roles:', insertError)
          addToast('Gagal menambahkan role baru', 'error')
          return
        }
      }

      addToast('Role pengguna berhasil diupdate', 'success')
      setEditingRole(null)
      loadAdminData()
    } catch (error) {
      console.error('Error updating roles:', error)
      addToast('Gagal mengupdate role pengguna', 'error')
    }
  }

  // Backward compatibility function
  const updateUserRole = async (profileId: string, newRole: UserRole) => {
    const profile = userProfiles.find(p => p.id === profileId)
    if (profile) {
      // Use profile.user_id if available, otherwise use profile.id (for fallback compatibility)
      const userId = profile.user_id || profile.id
      await updateUserRoles(userId, [newRole])
    }
  }

  const toggleRole = (role: UserRole) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role)
      } else {
        return [...prev, role]
      }
    })
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    // Note: User deletion requires admin privileges on server-side
    addToast('Fitur ini memerlukan akses admin server. Silakan hubungi administrator sistem.', 'error')
  }

  const exportProductsToExcel = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Format data untuk Excel
      const excelData = products?.map(product => ({
        'ID': product.id,
        'Nama Produk': product.name,
        'Kategori': product.category,
        'Harga': product.price,
        'Stok': product.stock,
        'Deskripsi': product.description || '',
        'Tanggal Dibuat': new Date(product.created_at).toLocaleDateString('id-ID'),
        'Tanggal Diperbarui': new Date(product.updated_at).toLocaleDateString('id-ID')
      })) || []
      
      // Buat workbook dan worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set lebar kolom
      const colWidths = [
        { wch: 10 }, // ID
        { wch: 25 }, // Nama Produk
        { wch: 15 }, // Kategori
        { wch: 12 }, // Harga
        { wch: 8 },  // Stok
        { wch: 30 }, // Deskripsi
        { wch: 15 }, // Tanggal Dibuat
        { wch: 15 }  // Tanggal Diperbarui
      ]
      ws['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(wb, ws, 'Produk')
      
      // Download file
      const fileName = `master-produk-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      addToast(`Data produk berhasil diekspor ke ${fileName}!`, 'success')
    } catch (error) {
      console.error('Error exporting products:', error)
      addToast('Gagal mengekspor data produk', 'error')
    }
  }
  
  const importProductsFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData: Array<{name?: string, price?: number, category?: string, stock?: number}> = XLSX.utils.sheet_to_json(worksheet)
      
      // Validasi dan format data
      const productsToImport = jsonData.map((row: any) => {
        // Mapping kolom Excel ke struktur database
        const product = {
          name: row['Nama Produk'] || row['name'] || '',
          category: row['Kategori'] || row['category'] || 'Lainnya',
          price: parseFloat(row['Harga'] || row['price'] || '0'),
          stock: parseInt(row['Stok'] || row['stock'] || '0'),
          description: row['Deskripsi'] || row['description'] || ''
        }
        
        // Validasi data wajib
        if (!product.name || product.price <= 0) {
          throw new Error(`Data tidak valid: ${JSON.stringify(row)}`)
        }
        
        return product
      })
      
      if (productsToImport.length === 0) {
        addToast('Tidak ada data produk yang valid untuk diimpor', 'error')
        return
      }
      
      // Import ke database
      const { error } = await supabase
        .from('products')
        .insert(productsToImport)
      
      if (error) throw error
      
      addToast(`Berhasil mengimpor ${productsToImport.length} produk!`, 'success')
      loadAdminData() // Refresh data
      
      // Reset input file
      event.target.value = ''
    } catch (error) {
      console.error('Error importing products:', error)
      addToast('Gagal mengimpor data produk. Pastikan format Excel sesuai.', 'error')
      event.target.value = ''
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
                  placeholder="Password minimal 6 karakter"
                  value={newUserPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUserPassword(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Roles</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(['ADMIN', 'MANAGER', 'CASHIER'] as UserRole[]).map((role) => (
                      <Button
                        key={role}
                        type="button"
                        size="sm"
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        onClick={() => toggleRole(role)}
                        className="h-8 px-3 text-xs"
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Pilih satu atau lebih role untuk pengguna baru. Default: CASHIER
                  </p>
                  {selectedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-gray-600">Terpilih:</span>
                      {selectedRoles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={createUser} className="w-full text-sm">
                Tambah Pengguna
              </Button>
            </div>

            {/* Users List with Role Management */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Daftar Pengguna & Role</h4>
              {userProfiles.map((profile) => (
                <div key={profile.id} className="flex flex-col p-3 border rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{profile.email}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      {checkPermission('manage_users') && profile.user_id !== currentUser?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(profile.id)
                            setEditUserEmail(profile.email)
                            setEditUserPassword('')
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUser(profile.user_id)}
                        className="h-8 w-8 p-0"
                        disabled={profile.user_id === currentUser?.id}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Edit User Form */}
                  {editingUser === profile.id && (
                    <div className="space-y-3 p-3 bg-blue-50 rounded-lg border-t">
                      <h5 className="font-medium text-sm">Edit Pengguna</h5>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-email-${profile.id}`} className="text-xs sm:text-sm">Email</Label>
                        <Input
                          id={`edit-email-${profile.id}`}
                          type="email"
                          placeholder="user@example.com"
                          value={editUserEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUserEmail(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-password-${profile.id}`} className="text-xs sm:text-sm">Password Baru</Label>
                        <Input
                          id={`edit-password-${profile.id}`}
                          type="password"
                          placeholder="Kosongkan jika tidak ingin mengubah password"
                          value={editUserPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUserPassword(e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          Kosongkan field password jika tidak ingin mengubah password
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateUser(profile.id)}
                          className="h-8 px-3 text-xs"
                          disabled={!editUserEmail || editUserEmail === profile.email && !editUserPassword}
                        >
                          Simpan Perubahan
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(null)
                            setEditUserEmail('')
                            setEditUserPassword('')
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Multi-Role Management */}
                  <div className="flex flex-col space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {profile.roles && profile.roles.length > 0 ? (
                          profile.roles.map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Tidak ada role
                          </Badge>
                        )}
                      </div>
                      {checkPermission('manage_users') && profile.user_id !== currentUser?.id && !editingRole && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRole(profile.id)
                            setSelectedRoles(profile.roles || ['CASHIER'])
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          Edit Role
                        </Button>
                      )}
                    </div>
                    
                    {editingRole === profile.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Pilih Roles:</span>
                          <div className="flex flex-wrap gap-2">
                            {(['ADMIN', 'MANAGER', 'CASHIER'] as UserRole[]).map((role) => (
                              <Button
                                key={role}
                                size="sm"
                                variant={selectedRoles.includes(role) ? "default" : "outline"}
                                onClick={() => toggleRole(role)}
                                className="h-8 px-3 text-xs"
                              >
                                {role}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Klik untuk memilih/membatalkan role. Pengguna dapat memiliki beberapa role sekaligus.
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateUserRoles(profile.user_id, selectedRoles)}
                            className="h-8 px-3 text-xs"
                            disabled={selectedRoles.length === 0}
                          >
                            Simpan ({selectedRoles.length} role)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRole(null)
                              setSelectedRoles(['CASHIER'])
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              
              {userProfiles.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Belum ada pengguna terdaftar
                </div>
              )}
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
              <h4 className="font-medium text-sm sm:text-base">Manajemen Data Produk</h4>
              <div className="space-y-2">
                <Button onClick={exportProductsToExcel} className="w-full text-sm" variant="outline">
                  <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Export Produk ke Excel
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={importProductsFromExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="import-excel"
                  />
                  <Button className="w-full text-sm" variant="outline">
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Import Produk dari Excel
                  </Button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Format Excel: Nama Produk, Kategori, Harga, Stok, Deskripsi
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


          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredPermissions={['manage_users']}>
      <AdminPageContent />
    </ProtectedRoute>
  )
}