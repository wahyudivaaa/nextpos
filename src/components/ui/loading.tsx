'use client'

import { RefreshCw } from 'lucide-react'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ 
  message = 'Memuat data...', 
  size = 'md',
  className = '' 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 mb-4`} />
      <p className={`${textSizeClasses[size]} text-gray-600 text-center`}>{message}</p>
    </div>
  )
}

export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 ${className}`} />
  )
}