'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Permission } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  requiredPermissions?: Permission[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  requiredPermissions,
  fallback,
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { checkPermission, checkAnyPermission, loading, user } = useAuth();
  const router = useRouter();

  // Jika masih loading, tampilkan loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Jika user belum login, redirect ke login
  if (!user) {
    router.push('/login');
    return null;
  }

  // Jika user tidak punya permission, tampilkan fallback atau redirect
  const hasRequiredPermission = permission 
    ? checkPermission(permission)
    : requiredPermissions 
    ? checkAnyPermission(requiredPermissions)
    : true;

  if (!hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// HOC version untuk wrap komponen
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission?: Permission,
  requiredPermissions?: Permission[],
  fallback?: ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute 
        permission={permission} 
        requiredPermissions={requiredPermissions}
        fallback={fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}