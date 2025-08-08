'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import OfflineIndicator from '@/components/OfflineIndicator'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  LogOut, 
  User,
  Settings,
  Home
} from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const totalItems = useCartStore((state) => state.getTotalItems())

  useEffect(() => {
    // Cek status autentikasi
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/login')
      }
    }

    getUser()

    // Listen untuk perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        } else if (session?.user) {
          setUser(session.user)
        }
      }
    )

    // Monitor status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Gagal logout: ' + error.message)
    } else {
      toast.success('Logout berhasil')
      router.push('/login')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">NextPOS</h1>
              
              <nav className="flex space-x-4">
                <Link href="/">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                <Link href="/cashier">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Kasir</span>
                    {totalItems > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
                
                <Link href="/products">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Produk</span>
                  </Button>
                </Link>
                
                <Link href="/reports">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Laporan</span>
                  </Button>
                </Link>

                <Link href="/admin">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Online/Offline */}
              <OfflineIndicator />

              {/* User Info */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>

              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}