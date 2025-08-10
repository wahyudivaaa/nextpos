'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import OfflineIndicator from '@/components/OfflineIndicator'
import { useAuth } from '@/lib/hooks/useAuth'
import { MENU_ITEMS } from '@/lib/permissions'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  LogOut, 
  User,
  Settings,
  Home,
  LayoutDashboard
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const { addToast } = useToast()
  const { user, profile, loading, checkPermission, signOut, roles, roleCount } = useAuth()
  
  // Sembunyikan header di halaman dashboard utama
  const isDashboardHome = pathname === '/'
  
  // Icon mapping
  const iconMap = {
    LayoutDashboard,
    ShoppingCart,
    Package,
    BarChart3,
    Settings,
    User,
    Home
  }

  // Filter menu items berdasarkan permission dan tambahkan icon component
  const visibleMenuItems = MENU_ITEMS.filter(item => 
    !item.permission || checkPermission(item.permission)
  ).map(item => ({
    ...item,
    icon: iconMap[item.icon as keyof typeof iconMap] || Home
  }))

  useEffect(() => {
    // Monitor status online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sembunyikan di halaman dashboard utama */}
      {!isDashboardHome && (
        <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-8">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">NextPOS</h1>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-4">
                {visibleMenuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.href === '/cashier' && totalItems > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          {totalItems}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Status Online/Offline */}
              <OfflineIndicator />

              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-700 truncate max-w-32">{user.email}</span>
              </div>

              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-white border-t">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            {/* Mobile User Info */}
            <div className="flex items-center py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm text-gray-700 truncate">{user.email}</span>
              </div>
            </div>
            
            <nav className="flex justify-around py-2">
              {visibleMenuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 h-auto py-2 relative">
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                    {item.href === '/cashier' && totalItems > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 ${isDashboardHome ? 'py-0' : 'py-4 sm:py-6 lg:py-8'} ${!isDashboardHome ? 'pb-20 lg:pb-8' : ''}`}>
        {children}
      </main>
    </div>
  )
}