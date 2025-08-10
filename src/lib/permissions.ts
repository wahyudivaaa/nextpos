// Sistem Role-Based Access Control (RBAC)
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export type Permission = 
  | 'view_dashboard'
  | 'view_products'
  | 'manage_products'
  | 'view_reports'
  | 'manage_reports'
  | 'view_users'
  | 'manage_users'
  | 'cashier_access'
  | 'view_orders'
  | 'manage_orders';

// Mapping role ke permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'view_reports',
    'manage_reports',
    'view_users',
    'manage_users',
    'cashier_access',
    'view_orders',
    'manage_orders'
  ],
  MANAGER: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'view_reports',
    'manage_reports',
    'cashier_access',
    'view_orders',
    'manage_orders'
  ],
  CASHIER: [
    'view_dashboard',
    'cashier_access',
    'view_orders'
  ]
};

// Fungsi untuk cek apakah user punya permission tertentu
export function hasPermission(userRole: UserRole | null, permission: Permission): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

// Fungsi untuk cek multiple permissions (AND logic)
export function hasAllPermissions(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Fungsi untuk cek any permission (OR logic)
export function hasAnyPermission(userRole: UserRole | null, permissions: Permission[]): boolean {
  if (!userRole) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Menu items dengan permissions
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
  description: string;
  subItems?: MenuItem[];
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
    permission: 'view_dashboard',
    description: 'Ringkasan dan statistik sistem'
  },
  {
    label: 'Kasir',
    href: '/cashier',
    icon: 'ShoppingCart',
    permission: 'cashier_access',
    description: 'Proses transaksi penjualan dan pembayaran'
  },
  {
    label: 'Produk',
    href: '/products',
    icon: 'Package',
    permission: 'view_products',
    description: 'Kelola inventori dan data produk'
  },
  {
    label: 'Laporan',
    href: '/reports',
    icon: 'BarChart3',
    permission: 'view_reports',
    description: 'Analisis penjualan dan laporan keuangan'
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: 'Settings',
    permission: 'manage_users',
    description: 'Pengaturan sistem dan manajemen pengguna'
  }
];

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Akses penuh ke semua fitur sistem',
  MANAGER: 'Akses ke produk, laporan, dan kasir',
  CASHIER: 'Akses hanya ke kasir dan dashboard'
};