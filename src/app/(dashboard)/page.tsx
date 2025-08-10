'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings,
  User,
  LayoutDashboard,
  Home
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { MENU_ITEMS, ROLE_DESCRIPTIONS } from '@/lib/permissions'

export default function Dashboard() {
  const { user, role, checkPermission } = useAuth()
  
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

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 bg-gray-50">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-4">NextPOS</h1>
          <p className="text-base sm:text-xl text-muted-foreground">
            Sistem Kasir Modern - Pilih Modul
          </p>
          
          {/* User Role Info */}
          {user && role && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{user.email}</span>
                <Badge variant="outline" className="text-xs">
                  {role}
                </Badge>
                <span className="text-xs text-gray-500">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2">
          {visibleMenuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-32 sm:h-40 md:h-48 flex flex-col justify-center border-2 hover:border-blue-500">
                <CardHeader className="text-center p-4 sm:p-6">
                  <item.icon className="h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto mb-2 sm:mb-4 text-blue-600" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">{item.label}</CardTitle>
                  <CardDescription className="text-sm sm:text-base md:text-lg">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
        
        {visibleMenuItems.length === 0 && (
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada modul yang tersedia</h3>
            <p className="mt-1 text-sm text-gray-500">
              Hubungi administrator untuk mendapatkan akses ke modul.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}